import { Component, Input, OnInit } from '@angular/core';
import { UtilsService } from 'src/app2/services/utils.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { ToastrService } from 'ngx-toastr';
import { Select } from '@ngxs/store';
import { UserState } from 'src/app2/store/user/user.state';
import { take } from 'rxjs/operators';
import { ProjectSummaryService } from 'src/app2/services/project-summary.service';

@Component({
  selector: 'app-dv-sent-to-info',
  templateUrl: './dv-sent-to-info.component.html',
})
export class DvSentToInfoComponent implements OnInit {
  @Input() diligence: any;
  @Input() user: any;
  sentToContactsList = [];
  is_investor: any;
  is_freeSubscription: any;
  entity_type: any;
  sent_total: any;
  saving_contact: boolean;
  @Select(UserState.getSubscriptionLimitsData) subscriptionLimits;
  contactsLoaded: boolean;

  constructor(
    private readonly ProjectSummaryService: ProjectSummaryService,
    private readonly Utils: UtilsService,
    private readonly sweetAlertService: SweetAlertService,
    private readonly toaster: ToastrService
  ) {}

  ngOnInit(): void {
    this.initialize();
  }

  initialize() {
    this.getRecipients();
    this.is_investor = this.user.isInvestor;
    this.is_freeSubscription = this.user.isFreeSubscription;
    this.subscriptionLimits.pipe(take(2)).subscribe((limits) => {
      if (limits?.length) {
        this.entity_type = this.Utils.getEntityType(limits[0]);
      }
    });
  }

  getRecipients() {
    this.ProjectSummaryService.getExternalSubscribers(
      this.diligence.id,
      'Duediligence',
      this.diligence.tofirm_id
    ).subscribe((response: any) => {
      this.sent_total = response.length;
      this.sentToContactsList = response;
      this.contactsLoaded = true;
    });
  }

  addContact(subscriber) {
    this.saving_contact = true;
    const subsciberIds = this.sentToContactsList.map((x) => x?.user_id);
    if (Array.from(subsciberIds).includes(subscriber.id)) {
      this.saving_contact = false;
      this.toaster.error('same user can not be assigned again');
      return;
    }
    const user = subscriber.fullName;
    const message = `${user} is now subscribed`;
    if (!subscriber.firmId) {
      subscriber.firmId = subscriber.firmInfo.id;
    }
    const payload: any = {
      entity_id: this.diligence.id,
      entity_type: 'Duediligence',
      user_id: subscriber.id,
      firm_id: subscriber.firmId,
    };
    this.ProjectSummaryService.addSubscriber(payload).subscribe(
      (response: any) => {
        this.getRecipients();
        this.toaster.success(message);
        this.saving_contact = false;
      },
      (e) => {
        this.saving_contact = false;
      }
    );
  }

  displaySubscriberRemovalConfirmation(subscriber) {
    this.sweetAlertService.confirm({
      title: `Are you sure you want to unsubscribe ${subscriber.fullName}?`,
      confirmButtonText: 'Yes',
      showLoaderOnConfirm: true,
      focusCancel: true,
      preConfirm: () => {
        this.removeSubscriber(subscriber);
      },
    });
  }

  removeSubscriber(subscriber: any) {
    this.saving_contact = true;
    const payload: any = {
      entity_id: this.diligence.id,
      entity_type: 'Duediligence',
      user_id: subscriber.user_id,
      tofirm_id: this.diligence.tofirm_id,
    };
    this.ProjectSummaryService.removeSubscriber(payload).subscribe(
      (response: any) => {
        const message = `${subscriber.fullName} is unsubscribed from this project!`;
        this.toaster.success(message);
        this.getRecipients();
        this.saving_contact = false;
        const subscriberIndex = this.sentToContactsList.findIndex(
          (subscriberItem: { user_id: any }) =>
            subscriberItem.user_id === subscriber.user_id
        );
        this.sentToContactsList.splice(subscriberIndex, 1);
      },
      (error: any) => {}
    );
  }
}
