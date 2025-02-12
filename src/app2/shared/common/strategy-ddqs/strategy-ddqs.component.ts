import { finalize } from 'rxjs/operators';
import { swal } from 'sweetalert2/dist/sweetalert2.js';
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
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { RouterService } from 'src/app2/services/router.service';
import { keywordConstants } from 'src/app2/shared/constants/constant';
import { DueDiligenceDataService } from 'src/app2/services/due-diligence-data.service';
import { EntityUtilsService } from 'src/app2/utils/entity-utils.service';

@Component({
  selector: 'app-strategy-ddqs',
  templateUrl: './strategy-ddqs.component.html',
  styleUrls: ['./strategy-ddqs.component.css'],
})
export class StrategyDdqsComponent implements OnInit, OnChanges {
  @Input() modalTitle = '';
  @Input() ddqType = '';
  @Input() readonly;
  @Input() emptyStateMessage = '';
  @Input() ddqs = [];
  @Input() currentUser: any;
  @Input() helpText = '';
  @Output() modalOpen? = new EventEmitter();
  isFreeSubscription;
  empty_state_message;
  entity_type: string;
  is_admin: any;
  is_manager: boolean;
  createNewTooltip;

  constructor(
    private readonly SweetAlert: SweetAlertService,
    private readonly toaster: ToastrService,
    private readonly routerService: RouterService,
    private readonly DueDiligenceDataservice: DueDiligenceDataService,
    private readonly EntityUtilsService: EntityUtilsService
  ) {}

  ngOnInit(): void {
    this.entity_type = 'Strategy';
    const empty_state_message = 'No DDQ available for this ' + this.entity_type;
    this.is_admin = this.currentUser.isAdmin;
    this.is_manager = this.currentUser.isManager;
    this.isFreeSubscription = this.currentUser.isFreeSubscription;
    this.modalTitle = this.modalTitle;
    this.ddqType = this.ddqType;
    if (this.readonly) {
      this.readonly = true;
    } else {
      this.readonly = false;
    }
    this.empty_state_message = this.emptyStateMessage || empty_state_message;
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

  createNewVersion(ddq) {
    this.SweetAlert.confirm({
      title: 'Are you sure you want to create a new version ?',
      confirmButtonText: 'Yes, please!',
      showLoaderOnConfirm: true,
      preConfirm: () => {
        this.DueDiligenceDataservice.createNewVersion(ddq.id).subscribe(
          (response: any) => {
            const diligence_id = response.id;
            this.toaster.success(
              '',
              'You will be redirected to the latest version'
            );
            this.routerService.navigateWithParams(
              'app.diligence.project.questionnaire',
              {
                diligenceId: diligence_id,
              }
            );
            this.SweetAlert.close();
          },
          (error: any) => {
            this.SweetAlert.close();
            this.toaster.error('', 'Something went wrong. Please try again.');
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
        this.DueDiligenceDataservice.setStatus(ddq.id, 'Retired')
          .pipe(finalize(() => swal.close()))
          .subscribe((response: any) => {
            this.toaster.success('', 'DDQ retired successfully');
            this.ddqs.splice(this.ddqs.indexOf(ddq), 1);
          });
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
      ddq.entity_type.toLowerCase() === keywordConstants.Strategy.toLowerCase()
    ) {
      //if diligence type is strategy then go to firms.strategies route
      newState = '.firms.strategies';
      newParams.fromfirmId = ddq.fromfirm_id;
      newParams.tofirmId = ddq.tofirm_id;
      newParams.strategyId = ddq.entity_id;
    } else if (
      ddq.entity_type.toLowerCase() === keywordConstants.Firm.toLowerCase()
    ) {
      //else if it is a firm diligence then go to firms route
      newState = '.firms';
      newParams.fromfirmId = ddq.fromfirm_id;
      newParams.tofirmId = ddq.entity_id;
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
