import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngxs/store';
import { ToastrService } from 'ngx-toastr';
import { forkJoin } from 'rxjs';
import { ProjectSummaryService } from 'src/app2/services/project-summary.service';

@Component({
  selector: 'app-manage-subscribers',
  templateUrl: './manage-subscribers.component.html',
})
export class ManageSubscribersModal implements OnInit {
  @Input() diligence;
  current_user: any;
  functions = [];
  related_diligences: {};
  subscribers = [];
  entity_type = 'Duediligence';
  isInvestor = false;
  selection = [];
  constructor(
    private readonly store: Store,
    private readonly ProjectSummaryService: ProjectSummaryService,
    private readonly toastrService: ToastrService
  ) {}

  ngOnInit(): void {
    this.initialize();
  }

  initialize() {
    this.current_user = this.store.selectSnapshot(
      (state) => state.user.currentUser
    );
    this.isInvestor = this.current_user.isInvestor;
    forkJoin({
      functions: this.getFunctions(),
      related_diligences: this.getRelatedDiligences(),
    }).subscribe(
      (response) => {
        this.functions = response.functions as Array<any>;
        this.related_diligences = response.related_diligences as Array<any>;
        this.getSubscribers();
      },
      (e) => {}
    );
  }

  getFunctions() {
    const params = {
      entity_id: this.current_user.firmInfo.id,
      entity_type: 'Firm',
    };
    return this.ProjectSummaryService.getMyFunctions(params);
  }

  getRelatedDiligences() {
    this.related_diligences = [];
    return this.ProjectSummaryService.getRelatedDiligences(this.diligence.id);
  }

  addSubscriber(event: any) {
    const subscriber = event[event.length - 1];
    let payload: any = {
      entity_id: this.diligence.id,
      entity_type: this.entity_type,
    };
    if (subscriber.type === 'function') {
      payload.function_id = subscriber.id;
    } else {
      payload.user_id = subscriber.id;
    }
    this.ProjectSummaryService.addSubscriber(payload).subscribe(
      (response) => {
        this.toastrService.success(`${subscriber.fullName} is now subscribed`);
        this.getSubscribers();
      },
      (e) => {
        this.getSubscribers();
      }
    );
  }

  getSubscribers() {
    this.ProjectSummaryService.getSubscribers(
      this.diligence.id,
      this.entity_type,
      this.functions
    ).subscribe(
      (response: Array<any>) => {
        this.selection = response;
        this.subscribers = JSON.parse(JSON.stringify(response));
      },
      (e) => {}
    );
  }

  selectionChanged(event = []) {
    let subscriber = null;
    if (this.subscribers?.length < event?.length) {
      this.addSubscriber(event);
    } else if (
      this.subscribers.length &&
      this.subscribers.length === event?.length
    ) {
      const isUser = this.subscribers.filter((x) => x.user_id).length;
      if (isUser) {
        subscriber = this.subscribers.find((x) =>
          event.map((y) => y.user_id).includes(x.user_id)
        );
      } else {
        subscriber = this.subscribers.find((x) =>
          event.map((y) => y.function_id).includes(x.function_id)
        );
      }
    } else {
      const isUserRemoved =
        this.subscribers.filter((x) => x.user_id).length ===
        event.filter((x) => x.user_id).length;
      if (
        !isUserRemoved &&
        this.subscribers.filter((x) => x.user_id).length > 0
      ) {
        subscriber = this.subscribers.find(
          (x) => !event.map((y) => y.user_id).includes(x.user_id)
        );
      } else {
        subscriber = this.subscribers.find(
          (x) => !event.map((y) => y.function_id).includes(x.function_id)
        );
      }
    }
    if (subscriber) {
      this.removeSubscriber(subscriber);
    }
  }

  removeSubscriber(subscriber: any) {
    let payload: any = {
      entity_id: this.diligence.id,
      entity_type: this.entity_type,
    };
    if (subscriber.function_id) {
      payload.function_id = subscriber.function_id;
    } else {
      payload.user_id = subscriber.user_id;
    }
    this.ProjectSummaryService.removeSubscriber(payload).subscribe(
      (response) => {
        this.toastrService.success(
          `${subscriber.fullName} is unsubscribed from this project`
        );
        this.getSubscribers();
      },
      (e) => {
        this.getSubscribers();
      }
    );
  }
}
