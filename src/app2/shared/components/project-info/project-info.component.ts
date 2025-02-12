import { HttpClient } from '@angular/common/http';
import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  SimpleChange,
} from '@angular/core';
import * as moment from 'moment';
import { Subject } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { finalize, takeUntil } from 'rxjs/operators';
import { ProjectSummaryService } from 'src/app2/services/project-summary.service';
import { RouterService } from 'src/app2/services/router.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { UtilsService } from 'src/app2/services/utils.service';
import swal from 'sweetalert2/dist/sweetalert2.js';
import { Select } from '@ngxs/store';
import { UserState } from 'src/app2/store/user/user.state';
import { take } from 'rxjs/operators';
import { DiligenceType } from 'src/app2/apis/questionnaire/type/diligence.type';
import { keywordConstants } from '../../constants/constant';
import { QuestionState } from 'src/app2/modules/questionnaire/store/questionnaire.state';
@Component({
  selector: 'app-project-info',
  templateUrl: './project-info.component.html',
  styleUrls: ['./project-info.component.css'],
})
export class ProjectInfoComponent implements OnInit, OnDestroy {
  @Input() diligence: DiligenceType;
  entity_type: string;
  is_due: boolean;
  completedDueDiff: number;
  daysDue: number;
  is_investor: boolean;
  is_freeSubscription: boolean;
  remaining: number;
  sent_total: any;
  sentToContactsList: any[] = [];
  sentToTooltip: string;
  recipients: any;
  saving_contact: boolean;
  @Select(UserState.getCurrentUserData) user;
  @Select(UserState.getSubscriptionLimitsData) subscriptionLimits;
  @Select(QuestionState.getReviewers) reviewers;
  showDueDate = true;
  ngUnsubscribe = new Subject();
  reviewerDetails: any = {};
  constructor(
    private readonly route: RouterService,
    private readonly Utils: UtilsService,
    private readonly http: HttpClient,
    private readonly SweetAlert: SweetAlertService,
    private readonly toaster: ToastrService,
    private readonly projectSummaryService: ProjectSummaryService,
  ) {}

  ngOnInit(): void {
    this.is_due = [
      'Started',
      'Followup',
      'ExtensionRequested',
      'Completed',
      'Approved',
    ].includes(this.diligence.status);

    this.subscriptionLimits.pipe(take(2)).subscribe((limits) => {
      if (limits?.length) {
        this.entity_type = this.Utils.getEntityType(limits[0]);
      }
    });
    this.user.pipe(take(1))
      .subscribe((data) => {
        if (data) {
          this.is_investor = data.isInvestor;
          this.is_freeSubscription = data.isFreeSubscription;
          this.getRecipients();
          if (this.diligence.diligence_type === 'dd_profile') {
            this.showDueDate = false;
          }
        }
      });

    this.reviewers
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((response: any) => {
        const reviewerList = [
          ...(response.reviewers as Map<number, string>).values(),
        ];
        const visibleReviewers = reviewerList.slice(0, 1).join(', ');
        const hiddenReviewers = reviewerList.slice(1).join(', ');
        const hiddenReviewersCount = reviewerList.slice(1).length;
        this.reviewerDetails = {
          ...response,
          visibleReviewers,
          hiddenReviewers,
          hiddenReviewersCount,
        };
      });
  }

  ngOnChanges(changes: SimpleChange): void {
    if (this.diligence.completed_at) {
      this.completedDueDiff = moment(this.diligence.due_at).diff(
        moment(this.diligence.completed_at),
        'days'
      );
    } else {
      this.daysDue = moment(this.diligence.due_at).diff(
        moment().startOf('day'),
        'days'
      );
    }
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  getRecipients() {
    this.remaining = 0;
    const params = {
      entity_id: this.diligence.id,
      entity_type: 'Duediligence',
      firm_id: this.diligence.managerfirm_id,
    };
    var functionItemList: any = [];
    this.http.get('functions').subscribe((res) => {
      functionItemList = res;
    });
    this.http
      .get('entitysubscribers', { params: params })
      .subscribe((response: any) => {
        this.sent_total = response.length;
        const sentToContact = response;
        const subscriberIds = sentToContact.filter(
          (x) => !x.user_id && x.function_id
        );
        const subscriberIds2 = sentToContact.filter((x) => x.user_id);
        subscriberIds.forEach((e1) => {
          e1.fullName = functionItemList.find(
            (e2) => e2.function_id == e1.function_id
          ).function_name;
        });
        this.sentToContactsList = [...subscriberIds, ...subscriberIds2];
        if (this.sent_total) {
          if (this.sent_total > 5) {
            this.remaining = this.sent_total - 5;
          }
          this.sentToTooltip = `Sent to ${this.sent_total} contacts`;
          this.recipients = response.slice(0, 5);
        }
      });
  }

  displaySubscriberRemovalConfirmation(subscriber: { fullName: any }) {
    this.SweetAlert.confirm({
      title: `Are you sure you want to unsubscribe ${subscriber.fullName}?`,
      confirmButtonText: 'Yes',
      showLoaderOnConfirm: true,
      focusCancel: true,
      preConfirm: () => {
        return new Promise<void>((resolve) => {
          this.removeSubscriber(subscriber, resolve);
        });
      },
    });
  }

  removeSubscriber(subscriber, resolve) {
    this.saving_contact = true;
    const params = {};
    params['entity_id'] = this.diligence.id;
    params['entity_type'] = 'Duediligence';
    subscriber.user_id
      ? (params['user_id'] = subscriber.user_id)
      : (params['function_id'] = subscriber.function_id);
    params['tofirm_id'] = this.diligence.managerfirm_id;
    this.http
      .delete(`entitysubscribers/${subscriber.id}`, { params: params })
      .pipe(
        finalize(() => {
          resolve();
          swal.close();
        })
      )
      .subscribe((response: any) => {
        const message = `${subscriber.fullName} is unsubscribed from this project!`;
        this.toaster.success(message);
        this.getRecipients();
        this.saving_contact = false;

        const subscriberIndex = this.sentToContactsList.findIndex(
          (x) => x.user_id === subscriber.user_id
        );
        this.sentToContactsList.splice(subscriberIndex, 1);
      });
  }

  addSubscriber(subscriber: any) {
    this.saving_contact = true;
    const subscriberIds = this.sentToContactsList.map((x) => x.user_id);
    if (Array.from(subscriberIds).includes(subscriber.id)) {
      this.toaster.warning('same user can not be assigned again');
      this.saving_contact = false;
      return;
    }
    const user = subscriber.fullName;
    const message = `${user} is now subscribed`;
    if (!subscriber.firmId) {
      subscriber.firmId = subscriber.firmInfo.id;
    }
    const params = {
      entity_id: this.diligence.id,
      entity_type: 'Duediligence',
      user_id: subscriber.id,
      firm_id: subscriber.firmId,
    };
    this.projectSummaryService
      .addSubscriber(params)
      .pipe(
        finalize(() => {
          this.saving_contact = false;
        })
      )
      .subscribe((response: any) => {
        this.getRecipients();
        this.toaster.success(message);
        this.saving_contact = false;
      });
  }

  redirectToFirm(id: number) {
    this.route.navigateWithParams('app.firms.profile.monitor', { firmId: id });
  }

  redirectToProject(id: number) {
    this.route.navigateWithParams('app.diligence.project.questionnaire', {
      diligenceId: id,
    });
  }

  redirectToEntity() {
    if (this.diligence.entity_type === keywordConstants.Strategy)
      this.route.navigateWithParams('app.firms.strategies.profile.monitor', {
        strategyId: this.diligence.entity_id,
        firmId: this.diligence.fromfirm_id,
      });
    else if (this.diligence.entity_type === keywordConstants.Vehicle)
      this.route.navigateWithParams(
        'app.firms.funds.vehicles.profile.monitor',
        {
          firmId: this.diligence.fromfirm_id,
          fundId: this.diligence.parent_entity_id,
          vehicleId: this.diligence.entity_id,
        }
      );
    else if (this.diligence.entity_type == keywordConstants.Product)
      this.route.navigateWithParams('app.firms.funds.profile.monitor', {
        firmId: this.diligence.fromfirm_id,
        fundId: this.diligence.entity_id,
      });
    else if (this.diligence.entity_type == keywordConstants.Firm)
      this.route.navigateWithParams('app.firms.profile.monitor', {
        firmId: this.diligence.entity_id,
      });
  }
}
