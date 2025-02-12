import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { RouterService } from 'src/app2/services/router.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { Select, Store } from '@ngxs/store';
import { UserState } from 'src/app2/store/user/user.state';
import { take, tap } from 'rxjs/operators';
import { GetCurrentUser } from 'src/app2/store/user/user.action';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
@Component({
  selector: 'app-profile-ddq',
  templateUrl: './profile-ddq.component.html',
  styleUrls: ['./profile-ddq.component.css'],
})
export class ProfileDdqComponent implements OnInit, OnChanges {
  @Input() ddqs = [];
  @Input() emptyStateMessage = '';
  @Input() readonly = false;
  @Input() helpText = '';
  @Input() tooltipText = '';
  @Output() modalOpen? = new EventEmitter();
  empty_state_message;
  isFreeSubscription;
  entity_type: string;
  is_admin: any;
  is_manager: boolean;
  @Select(UserState.getCurrentUserData) user;
  @Select(UserState.getSubscriptionLimitsData) subscriptionLimits;

  constructor(
    private readonly routerService: RouterService,
    private readonly Utils: UtilsService,
    private readonly store: Store,
    private readonly SweetAlert: SweetAlertService
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
          this.is_admin = data.isAdmin;
          this.is_manager = data.isManager;
          this.isFreeSubscription = data.isFreeSubscription;
          if (!this.readonly) {
            this.readonly = !(this.is_manager && this.is_admin);
          }
        }
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes && changes.ddqs.currentValue != changes.ddqs.previousValue) {
      this.ddqs.forEach(
        (ddq) =>
          (ddq.url = this.routerService.href(
            'app.diligence.project.questionnaire',
            {
              diligenceId: ddq.id,
            }
          ))
      );
    }
  }

  openModal() {
    if (this.isFreeSubscription && this.is_manager)
      this.SweetAlert.premiumAlert();
    this.modalOpen.emit();
  }

}
