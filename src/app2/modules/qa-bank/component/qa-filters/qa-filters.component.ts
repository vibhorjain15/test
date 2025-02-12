import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { QaTabType } from '../../constants/qa-bank.constants';
import { QaBankService } from '../../service/qa-bank.service';
import { RouterService } from 'src/app2/services/router.service';
import { Subscription } from 'rxjs';
import {
  DateSortHistory,
  DateSortLibrary,
  archiveQuickFilter,
  archiveTabSortList,
  dayFilters,
  projectQuickFilter,
} from '../../constants/qa-bank-filters.constants';
import { CurrentUserModel } from 'src/app2/store/user/user.model';

@Component({
  selector: 'qa-filters',
  templateUrl: './qa-filters.component.html',
  styleUrls: ['./qa-filters.component.css'],
})
export class QaFiltersComponent implements OnInit, OnDestroy, OnChanges {
  constructor(
    public readonly qaBankService: QaBankService,
    private router: RouterService
  ) {}
  @Input() questions;
  @Input() activeView:
    | QaTabType.Archives
    | QaTabType.Library
    | QaTabType.ProjectHistory;
  @Input() currUser: CurrentUserModel;
  tabType = QaTabType;
  showAnswers: boolean = true;
  subscription: Subscription;
  sortByList;
  quickFilterList;
  expiryDateFilter = dayFilters;

  ngOnInit(): void {
    this.subscription = this.qaBankService.questions$.subscribe((ques) => {
      if (this.activeView === this.tabType.Library) {
        this.sortByList = DateSortLibrary;
      } else if (this.activeView === this.tabType.ProjectHistory) {
        this.sortByList = DateSortHistory;
        const updatedItem = projectQuickFilter.find(
          (item) => item.id === 'Standard DDQs'
        );
        updatedItem.disabled = this.currUser.isFreeSubscription;
        updatedItem.premiumOnly = this.currUser.isFreeSubscription;
        updatedItem.tooltip = this.currUser.isFreeSubscription
          ? 'Maintain your proprietary and industry DDQs on DiligenceVault with a premium subscription.'
          : '';
        this.quickFilterList = projectQuickFilter;
      } else {
        this.sortByList = archiveTabSortList;
        this.quickFilterList = archiveQuickFilter;
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (
      changes &&
      changes.questions &&
      changes.questions.currentValue !== changes.questions.previousValue
    ) {
      if (changes.questions?.currentValue?.length) {
        this.questions = changes.questions.currentValue;
        this.toggleShowAnswers(this.showAnswers);
      }
    }
  }
  handleTagSelection() {
    this.qaBankService.addRemoveTagsBulkModal();
  }

  handleExpiryDate() {
    this.qaBankService.changeExpiryDateBulkModal();
  }

  handleSme() {
    this.qaBankService.assignSMEBulkModal();
  }

  handleDeactivate() {
    const selectedQuestions = [];
    this.questions.map((question) => {
      if (question.isSelected) {
        selectedQuestions.push(question);
      }
    });
    this.qaBankService.deactivateBulkResponse(selectedQuestions);
  }

  handleDuplicateQuestion() {
    this.router.navigate('app.content.questions.duplicates');
  }

  clickedSelectAllQuestions() {
    this.qaBankService.clickedSelectAllQuestions();
  }

  clickedUnSelectAllQuestions() {
    this.qaBankService.clickedUnSelectAllQuestions();
  }

  toggleShowAnswers(value) {
    this.showAnswers = value;
    if (value)
      this.questions.forEach((question) => (question.showAnswer = true));
    else this.questions.forEach((question) => (question.showAnswer = false));
  }

  handleDateSortChange(value) {
    this.qaBankService.selectSortCriteriaFilter(value);
  }

  goToPrevious() {
    this.qaBankService.goToPrevious();
  }
  goToNext() {
    this.qaBankService.goToNext();
  }

  removeViewSimilarQuestionFilter() {
    this.qaBankService.removeViewSimilarQuestionFilter();
  }

  displayFilter(criterion) {
    let displayedFilter = '';
    let value = '';
    if (
      criterion.criteria_obj.filter_type.toLowerCase() === 'date' ||
      criterion.criteria_obj.filter_type.toLowerCase() === 'datetime'
    ) {
      let displayedDate: string;
      if (criterion.condition === 'between') {
        const startDate = criterion.advance_filter_value.startDate;
        const endDate = criterion.advance_filter_value.endDate;
        displayedDate = startDate + ' to ' + endDate;
      } else {
        displayedDate = criterion.advance_filter_value;
      }
      displayedFilter =
        `${criterion.criteria_obj.filter_label} : ` + displayedDate;
    } else {
      this.qaBankService.searchFiltersFromApi.custom_filter.map((filter) => {
        if (
          filter.filter_label === criterion.criteria_obj.filter_label &&
          filter.hasOwnProperty('options')
        ) {
          filter.options.map((option) => {
            if (option.id === criterion.advance_filter_value) {
              ({ value } = option);
            }
          });
        }
      });
      if (criterion.criteria_obj.filter_type === 'bool') {
        value = criterion.advance_filter_value ? 'Yes' : 'No';
      }
      if (value !== '') {
        displayedFilter = `${criterion.criteria_obj.filter_label} : ` + value;
      } else {
        displayedFilter =
          `${criterion.criteria_obj.filter_label} : ` +
          criterion.advance_filter_value;
      }
    }
    return displayedFilter;
  }

  removeFilterCriterion(index) {
    this.qaBankService.removeFilterCriterion(index);
  }

  removeDatesFilter() {
    this.qaBankService.removeDatesFilter();
  }

  handleSendToLibrary() {
    this.qaBankService.handleSendToLibrary();
  }

  handleUnarchive() {
    const selectedQuestions = [];
    this.questions.map((question) => {
      if (question.isSelected) {
        selectedQuestions.push(question);
      }
    });
    this.qaBankService.unArchiveQuestions(selectedQuestions);
  }

  handleArchiveQuickFilter(value) {
    this.qaBankService.handleArchiveQuickFilter(value);
  }

  handleProjectQuickFilter(value) {
    this.qaBankService.handleProjectQuickFilter(value);
  }

  removeArchiveFilter() {
    this.qaBankService.removeQuickFilter();
  }

  removeProjectFilter() {
    this.qaBankService.removeQuickFilter();
  }

  handleExpiryQuickFilter(type) {
    if (type === 'none') this.removeDatesFilter();
    else this.qaBankService.filterByExpiryDate(type);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
