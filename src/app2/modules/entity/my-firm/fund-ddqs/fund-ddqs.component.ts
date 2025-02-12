import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { DueDiligenceDataService } from 'src/app2/services/due-diligence-data.service';
import { RouterService } from 'src/app2/services/router.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { keywordConstants } from 'src/app2/shared/constants/constant';
import { Select, Store } from '@ngxs/store';
import { UserState } from 'src/app2/store/user/user.state';
import { take, tap } from 'rxjs/operators';
import { GetCurrentUser } from 'src/app2/store/user/user.action';
import { EntityUtilsService } from '../../../../utils/entity-utils.service';
@Component({
  selector: 'fund-ddqs',
  templateUrl: './fund-ddqs.component.html',
  styleUrls: ['./fund-ddqs.component.css'],
})
export class FundDdqsComponent implements OnInit, OnChanges {
  @Input() ddqs = [];
  @Input() modalTitle = '';
  @Input() ddqType = '';
  @Input() readonly = false;
  @Input() emptyStateMessage = '';
  @Input() helpText = '';
  @Output() modalOpen? = new EventEmitter();
  isFreeSubscription;
  entity_type: string;
  is_admin: any;
  is_manager: boolean;
  createNewTooltip: string = 'Add New DDQ';
  empty_state_message: any;
  @Select(UserState.getCurrentUserData) user;
  @Select(UserState.getSubscriptionLimitsData) subscriptionLimits;

  constructor(
    private readonly Utils: UtilsService,
    private readonly SweetAlert: SweetAlertService,
    private readonly DueDiligenceDataservice: DueDiligenceDataService,
    private readonly toaster: ToastrService,
    private readonly routerService: RouterService,
    private readonly store: Store,
    private readonly EntityUtilsService: EntityUtilsService
  ) {}

  ngOnInit(): void {
    const empty_state_message = 'No DDQ available for this ' + this.entity_type;
    this.empty_state_message = this.emptyStateMessage || empty_state_message;
    this.subscriptionLimits.pipe(take(2)).subscribe((limits) => {
      if (limits?.length) {
        this.entity_type = this.Utils.getEntityType(limits[0]);
      }
    });
    this.user.pipe(take(1))
      .subscribe((data) => {
        if (data) {
          this.is_admin = data.is_admin;
          this.is_manager = data.isManager;
          this.isFreeSubscription = data.isFreeSubscription;
        }
      });

    this.createNewTooltip = this.EntityUtilsService.getCreateNewTooltip(
      this.modalTitle
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes && changes.ddqs.currentValue != changes.ddqs.previousValue) {
      this.ddqs.forEach(
        (ddq) =>
          (ddq.url = this.routerService.href('app.diligence.project.questionnaire', {
            diligenceId: ddq.id,
          }))
      );
    }
  }

  createNewVersion(ddq: { id: any }) {
    this.SweetAlert.confirm({
      title: 'Are you sure you want to create a new version ?',
      confirmButtonText: 'Yes, please!',
      showLoaderOnConfirm: true,
      preConfirm: () => {
        this.DueDiligenceDataservice.createNewVersion(ddq.id).subscribe(
          (response: any) => {
            const diligence_id = response.id;
            this.toaster.success(
              'You will be redirected to the latest version'
            );
            this.routerService.navigateWithParams(
              'app.diligence.project.questionnaire',
              {
                diligenceId: diligence_id,
              }
            );
          },
          (error: any) => {
            this.toaster.error('Something went wrong. Please try again.');
          }
        );
      },
    });
  }

  shareDDQ(ddq) {
    this.routerService.navigateWithParams('app.diligence.project.share', {
      diligenceId: ddq.id,
    });
  }

  retireDDQ(ddq) {
    this.SweetAlert.confirm({
      title: 'Are you sure you want to retire this DDQ ?',
      text: 'You will not be able to recover this',
      confirmButtonText: 'Yes, retire it!',
      showLoaderOnConfirm: true,
      focusCancel: true,
      preConfirm: () => {
        this.DueDiligenceDataservice.setStatus(ddq.id, 'Retired').subscribe(
          (response: any) => {
            this.toaster.success('DDQ retired successfully');
            this.ddqs.splice(this.ddqs.indexOf(ddq), 1);
          }
        );
      },
    });
  }

  redirectToQuestionnaire(ddq) {
    //generate new route
    let newState: string;
    const parentState = 'app.diligence'; //parent state of the route
    const newParams: any = {
      diligenceId: ddq.id,
    };
    if (
      ddq.entity_type.toLowerCase() === keywordConstants.Product.toLowerCase()
    ) {
      //if diligence type is fund then go to firms.funds route
      newState = '.firms.funds';
      newParams.fromfirmId = ddq.fromfirm_id;
      newParams.tofirmId = ddq.tofirm_id;
      newParams.fundId = ddq.entity_id;
    } else if (
      ddq.entity_type.toLowerCase() === keywordConstants.Firm.toLowerCase()
    ) {
      //else if it is a firm diligence then go to firms route
      newState = '.firms';
      newParams.fromfirmId = ddq.fromfirm_id;
      newParams.tofirmId = ddq.entity_id;
    } else if (
      ddq.entity_type.toLowerCase() === keywordConstants.Strategy.toLowerCase()
    ) {
      //else if it is a firm diligence then go to firms route
      newState = '.firms.strategies';
      newParams.fromfirmId = ddq.fromfirm_id;
      newParams.tofirmId = ddq.tofirm_id;
      newParams.strategyId = ddq.entity_id;
    } else {
      newState = ''; //else go to the oldstate
    }
    const childState = '.project.questionnaire'; //get the tostate from the $state and append to the new route
    this.routerService.navigateWithParams(
      parentState + newState + childState,
      newParams
    );
  }

  openModal() {
    if (this.isFreeSubscription && this.is_manager)
      this.SweetAlert.premiumAlert();
    this.modalOpen.emit();
  }

}
