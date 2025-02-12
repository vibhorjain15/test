import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Select, Store } from '@ngxs/store';

import { filter, take, tap } from 'rxjs/operators';
import { DiligenceType } from 'src/app2/apis/questionnaire/type/diligence.type';
import { RouterService } from 'src/app2/services/router.service';
import { GetCurrentUser } from 'src/app2/store/user/user.action';
import { UserState } from 'src/app2/store/user/user.state';
import { keywordConstants } from 'src/app2/shared/constants/constant';
import {
  DeleteCategoryData,
  GetDiligenceData,
  GetMyFunctions,
  GetQuestionCount,
  UpdateActivePanelId,
  UpdateDraftData,
  UpdateIds,
} from '../../store/questionnaire.action';
import { SidePanelService } from 'src/app2/services/side-panel.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { DvDraftService } from '../../service/draft.service';
import { SubscriptionLike } from 'rxjs';
import { QuestionState } from '../../store/questionnaire.state';
import { diligenceStatusConstant } from '../../constants/quick-view-headers.constant';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-dv-tab',
  templateUrl: './dv-tab.component.html',
  styleUrls: ['./dv-tab.component.css'],
})
export class DvTabComponent implements OnInit, OnDestroy {
  routeSub: any;
  constructor(
    private router: RouterService,
    private store: Store,
    private readonly panel: SidePanelService,
    private readonly draftService: DvDraftService,
    private readonly angularRouter: Router,
    private readonly activatedRoute: ActivatedRoute,
    private readonly toaster: ToastrService,
    private route: Router
  ) {}

  headingList: any;
  @Select(UserState.getCurrentUserData) userData;
  diligence: DiligenceType;
  subs: any;
  loading;
  user;
  currentState: any;
  project_type: string;
  @Select(UserState.getFirmPreferenceData) firmPref;
  firmPreferences;
  @Select(QuestionState.getQuestions) getQuestions;
  @Select(QuestionState.getDiligence) stateDiligence;
  questions;
  activeSection;
  observableSubscriptions: SubscriptionLike[] = [];
  isQuestionnaireAngular = true;
  isFreeUser: boolean;
  stateDiligenceSub;
  ngOnInit(): void {
    this.routeSub = this.route.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        if (this.headingList) {
          this.headingList.map((h) => (h.active = false));
          this.highlightTab(this.router.getState()._routerState.url);
        }
      });
    this.loading = true;
    this.stateDiligenceSub = this.stateDiligence.subscribe((dil) => {
      if (
        dil &&
        dil.id == this.router.getState().params.diligenceId &&
        dil.status == diligenceStatusConstant.Deleted
      ) {
        this.toaster.error('You cannot access a deleted project.');
        this.router.navigateWithParams('app.diligence.projects.activity', {
          type: 'in-progress',
        });
      }
    });
    this.userData.pipe(take(1)).subscribe((user) => {
      if (user) {
        this.user = user;
        this.isFreeUser = this.user.isFreeSubscription;
        this.isQuestionnaireAngular =
          this.user.firmInfo.preferences.ui_version == 'Angular' &&
          JSON.parse(this.user.firmInfo.preferences.module_ui_version)
            .questionnaire_ui_version == 2;

        this.store.dispatch(new UpdateIds(this.router.getState().params));
        this.store.dispatch(new GetQuestionCount()).subscribe((val) => {
          this.store.dispatch(new GetDiligenceData());
          let diligenceId = this.router.getState().params.diligenceId;
          this.observableSubscriptions.push(
            this.stateDiligence.subscribe((dil) => {
              if (dil && dil.id == diligenceId) {
                this.diligence = dil;
                this.init();
              }
            })
          );
        });
      }
    });

    this.observableSubscriptions.push(
      this.firmPref.subscribe((data) => (this.firmPreferences = data))
    );
    this.observableSubscriptions.push(
      this.getQuestions.subscribe(({ questions, activeSection }) => {
        this.questions = questions;
        this.activeSection = activeSection;
      })
    );
  }

  init() {
    if (this.diligence.diligence_type == 'dd_review')
      this.project_type = 'Analyst Evaluation';
    else if (this.diligence.diligence_type == 'dd_profile')
      this.project_type = 'Internal Profile';
    else if (this.diligence.is_internal) {
      if (this.diligence.investorfirm_id) this.project_type = 'Questionnaire';
      // Only for investor request (Internally created)
      else this.project_type = 'Internal Project';
    } else this.project_type = 'Questionnaire';
    this.headingList = [
      {
        name: 'Summary',
        link: 'summary',
        active: false,
        condition: true,
      },
      {
        name: this.project_type,
        link: `questionnaire`,
        active: false,
        condition: true,
      },
      {
        name: 'Revisions & History',
        link: `response_history`,
        active: false,
        condition:
          this.user.isManager ||
          this.diligence.is_internal ||
          this.diligence.completed_at,
      },
      {
        name: 'Assignments',
        link: `assignment_status`,
        active: false,
        // Show the assignment tabs if its an
        // 1. Internal project
        // 2. Manager
        // 3. Investor in status Evaluation, Approved, Not approved
        condition:
          this.diligence.is_internal ||
          this.user.isManager ||
          (!this.user.isManager &&
            this.diligence.status !== diligenceStatusConstant.Started &&
            this.diligence.status !== diligenceStatusConstant.InReview &&
            this.diligence.status !== diligenceStatusConstant.Completed),
      },
      {
        name: 'Documents',
        link: `documents/list`,
        active: false,
        condition: true,
      },
      {
        name: 'Internal Notes',
        link: `notes`,
        active: false,
        condition: true,
      },
      {
        name: 'Investor Access Details',
        link: `share`,
        active: false,
        condition:
          this.user.isManager &&
          this.diligence.is_internal &&
          this.diligence.diligence_type != 'dd_profile',
      },
      {
        name: 'Ratings',
        link: 'investment_ratings',
        active: false,
        condition:
          this.user.isInvestor &&
          !this.isFreeUser &&
          !(this.diligence.entity_type == keywordConstants.Vehicle),
      },
      {
        name: 'Tracker Activities',
        link: `recommendations`,
        active: false,
        condition: true,
      },
    ];
    let route = this.router.getState()._routerState.url;
    this.highlightTab(route, true);
    this.loading = false;
  }
  handleRoute(route, index) {
    let curr = this.router.getState()._routerState.url;
    this.angularRouter
      .navigate([route], {
        relativeTo: this.activatedRoute.firstChild,
      })
      .then((onfulfilled) => {
        if (onfulfilled) {
          this.headingList[this.currentState].active = false;
          this.highlightTab(this.router.getState()._routerState.url);
        }
      });
  }

  highlightTab(routeArr, first?) {
    const recommendationId = this.router.getState()?.params?.recommendationId;
    const categoryId = this.router.getState()?.params?.categoryId;
    routeArr = routeArr.split('/');
    let len = routeArr.length;
    if (routeArr[len - 1] == 'summary') {
      this.headingList[0].active = true;
      this.currentState = 0;
    } else if (routeArr[len - 1] == 'response_history') {
      this.headingList[2].active = true;
      this.currentState = 2;
    } else if (routeArr[len - 1] == 'assignment_status') {
      this.headingList[3].active = true;
      this.currentState = 3;
    } else if (routeArr[len - 2] == 'documents') {
      this.headingList[4].active = true;
      this.currentState = 4;
    } else if (routeArr[len - 1] == 'notes') {
      this.headingList[5].active = true;
      this.currentState = 5;
    } else if (routeArr[len - 1] == 'share') {
      this.headingList[6].active = true;
      this.currentState = 6;
    } else if (
      routeArr[len - 1] === 'investment_ratings' ||
      (routeArr[len - 1]?.split('?')[0] === 'investment_ratings' && categoryId)
    ) {
      this.headingList[7].active = true;
      this.currentState = 7;
    } else if (routeArr[len - 1] === 'recommendations' || recommendationId) {
      this.headingList[8].active = true;
      this.currentState = 8;
    } else {
      // for questionniare
      this.headingList[1].active = true;
      this.currentState = 1;
    }
  }

  handleQaBankOpen() {
    this.store.dispatch(
      new UpdateActivePanelId(`questionnaire-bank-${this.diligence.id}`)
    );
    this.panel.invoke('qa-bank', {
      diligence: this.diligence,
      currentUser: this.user,
      firmPreferences: this.firmPreferences,
    });
  }

  ngOnDestroy(): void {
    this.observableSubscriptions.forEach((subscription) =>
      subscription?.unsubscribe()
    );
    this.store.dispatch(new DeleteCategoryData());
    this.stateDiligenceSub.unsubscribe();
    this.routeSub.unsubscribe();
  }

  handleUnsavedChanges(index) {
    let route = this.headingList[index].link;
    this.draftService.showCountAlert(
      () => {
        this.handleRoute(route, index);
      },
      () => {
        this.store.dispatch(new UpdateDraftData(null));
        this.handleRoute(route, index);
      }
    );
  }
}
