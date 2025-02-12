import { Component, OnInit, OnDestroy } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { dvTabsList } from 'src/app2/shared/components/dv-tabs/dv-tabs.model';
import { CurrentUserModel } from 'src/app2/store/user/user.model';
import { UserState } from 'src/app2/store/user/user.state';
import { take } from 'rxjs/operators';
import {
  QuestionAnswerFilter,
  QaTabType,
} from '../../constants/qa-bank.constants';
import { QaBankService } from '../../service/qa-bank.service';
import { QAState } from '../../store/qa.state';
import { SubscriptionLike } from 'rxjs';
import { SidePanelService } from 'src/app2/services/side-panel.service';
import { RouterService } from 'src/app2/services/router.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
@Component({
  selector: 'qa-bank-tabs',
  templateUrl: './qa-bank-tabs.component.html',
  styleUrls: ['./qa-bank-tabs.component.css'],
})
export class QaBankTabsComponent implements OnInit, OnDestroy {
  tabList: dvTabsList[] = [
    {
      name: QaTabType.Library,
      link: null,
      active: false,
      condition: true,
      tooltip: '',
    },
    {
      name: QaTabType.ProjectHistory,
      link: null,
      active: true,
      condition: true,
      tooltip: '',
    },
    {
      name: QaTabType.Archives,
      link: null,
      active: false,
      condition: true,
      tooltip: '',
    },
  ];
  filters_data_loaded;
  loader: boolean;
  @Select(UserState.getCurrentUserData) user;
  @Select(QAState.getActivePanelId) activePanelId;
  @Select(UserState.getFirmPreferenceData) firmPref;
  currUser: CurrentUserModel;
  firmPreferences;
  activeView:
    | QaTabType.Library
    | QaTabType.ProjectHistory
    | QaTabType.Archives = QaTabType.ProjectHistory;
  QuestionAnswerFilter = QuestionAnswerFilter;
  is_freeSubscription: boolean;
  observableSubscriptions: SubscriptionLike[] = [];
  isSidePanelOpened;
  updateLoader: boolean = false;
  QaTabType = QaTabType;
  selectedQAfilter = { name: null, type: 'Question' };
  questions;
  pageSizes: any[] = [
    { name: 10, id: 10 },
    { name: 25, id: 25 },
    { name: 50, id: 50 },
  ];
  mainLoader: boolean;

  constructor(
    private readonly store: Store,
    readonly qaBankService: QaBankService,
    private readonly panelService: SidePanelService,
    private readonly router: RouterService,
    private readonly NewModalFactory: CustomModalService,
    private readonly sweetAlert: SweetAlertService
  ) {}
  ngOnInit(): void {
    this.mainLoader = true;
    this.loader = true;
    this.init();
    this.observableSubscriptions.push(
      this.qaBankService.questions$.subscribe((questions) => {
        if (
          questions &&
          questions.activeView === this.activeView &&
          !this.updateLoader
        ) {
          this.questions = questions.questions;
          this.mainLoader = false;
        } else this.questions = null;
      })
    );
    this.observableSubscriptions.push(
      this.panelService.sidePanelSub.subscribe((val) => {
        this.isSidePanelOpened = val;
      })
    );
    this.qaBankService.getLastRefreshedData();
  }

  init() {
    this.user.pipe(take(1))
      .subscribe((user) => {
        if (user) {
          this.currUser = user;
          this.firmPreferences = this.store.selectSnapshot(
            (state) => state.user.firmPreference
          );
          this.defaultTabChoose();
        }
      });
  }

  defaultTabChoose() {
    let firmDefaultPreApproved = this.store.selectSnapshot(
      (state) => state.user.firmPreference.set_preapproved_default
    );
    this.is_freeSubscription = this.currUser.isFreeSubscription;
    this.tabList[0].disabled = this.is_freeSubscription;
    this.tabList[2].disabled = this.is_freeSubscription;
    if (this.is_freeSubscription) {
      this.tabList[0].tooltip =
        'Manage and update your Q/A Library content with a premium subscription.';
      this.tabList[2].tooltip =
        'Keep your Q/A Library organized and fresh by moving duplicate, outdated, and no longer relevant Q/As to your Archive with a premium subscription.';
    }
    let route = this.router.getState();
    let type = route?.params?.type?.toLowerCase();

    if (type && !this.is_freeSubscription) {
      if (type === 'library') {
        this.activeView = QaTabType.Library;
      } else if (type === 'archived') {
        this.activeView = QaTabType.Archives;
      } else {
        this.activeView = QaTabType.ProjectHistory;
      }
      this.tabList[1].active = false;
      this.tabList.find((x) => x.name === this.activeView).active = true;
    } else if (firmDefaultPreApproved && !this.is_freeSubscription) {
      this.activeView = QaTabType.Library;
      this.tabList[1].active = false;
      this.tabList.find((x) => x.name === this.activeView).active = true;
    }

    this.loader = false;
    this.qaBankService.init(this.currUser, this.activeView); // Executes everytime after a route change
  }

  handleSearchChange(event) {
    this.selectedQAfilter.name = event;
    this.qaBankService.onInputChange(this.selectedQAfilter);
  }

  handleTabChange(event) {
    if (this.activeView === this.tabList[event].name) return;
    this.activeView = this.tabList[event].name;
    this.router.navigateWithParams(
      'app.content.questions',
      {
        type: this.activeView.toLowerCase().replace(' ', ''),
      },
      { reload: true }
    );
    this.panelService.close();
  }

  handleClearSearchFilter() {
    this.selectedQAfilter.name = '';
    this.selectedQAfilter.type = 'Question';
    this.qaBankService.onInputChange(this.selectedQAfilter);
  }

  handleQAfilterChange(event) {
    this.selectedQAfilter.type = event;
    this.selectedQAfilter.name = this.qaBankService.selectedQAfilter.name;
    if (this.selectedQAfilter.name) {
      this.selectedQAfilter.type = event;
      this.qaBankService.onInputChange(this.selectedQAfilter);
    }
  }

  addNewQuestion() {
    if (!this.is_freeSubscription) {
      this.NewModalFactory.invoke('add-to-preapproved', {
        initialState: {
          source: 'questions',
          onSuccess: () => {
            this.qaBankService.init(this.currUser, this.activeView);
          },
        },
        class: 'modal-md',
      });
    }
  }

  resetFiltersData(value) {
    this.qaBankService.resetFiltersData(true);
  }

  toggleFiltersSection() {
    this.qaBankService.openFiltersModal();
  }

  checkIfQADataUpdated() {
    this.updateLoader = true;
    this.qaBankService
      .checkIfQADataUpdated()
      .subscribe((response: { data: any }) => {
        this.qaBankService.getLastRefreshedData();
        this.updateLoader = false;
      });
  }

  handleGoToPremium() {
    this.sweetAlert.premiumAlert();
  }

  handlePageSizeChange(event) {
    this.qaBankService.handlePageSizeChange(event);
  }

  handleOnNext() {
    this.qaBankService.goToNext();
  }

  handlePrevClick() {
    this.qaBankService.goToPrevious();
  }

  handleFirstClick() {
    this.qaBankService.firstClick();
  }

  handleLastClick(start_point) {
    this.qaBankService.lastClick(start_point);
  }

  ngOnDestroy(): void {
    this.qaBankService.clearAllQAdata();
    this.observableSubscriptions.forEach((subscription) =>
      subscription?.unsubscribe()
    );
  }
}
