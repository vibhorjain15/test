import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Store } from '@ngxs/store';
import { debouncer } from 'src/app2/utils/debouce.util';
import { RouterService } from 'src/app2/services/router.service';
import {
  FilterReload,
  GetDiligenceSectionData,
  UpdateSearchQuery,
} from '../../store/questionnaire.action';

@Component({
  selector: 'question-search',
  templateUrl: './question-search.component.html',
  styleUrls: ['./question-search.component.css'],
})
export class QuestionSearchComponent implements OnInit {
  @Output() onClick = new EventEmitter();
  search = '';
  querySearch = '';
  total_questions_count = '';
  debouceInst;
  showResultLabel: boolean;
  questionAnswerFilter = [
    { name: 'Question', id: 'Search' },
    { name: 'Response', id: 'ResponseSearch' },
  ];
  filterType: string;
  constructor(private route: RouterService, private readonly store: Store) {
    this.updateQuestion = this.updateQuestion.bind(this);
  }

  ngOnInit(): void {
    this.debouceInst = debouncer(this.updateQuestion, 500);
    this.querySearch = this.route.getState().params.q ?? '';
    // Make sure status params belong to search filter (status param is also used in quick filters)
    this.filterType = [
      this.questionAnswerFilter[0].id,
      this.questionAnswerFilter[1].id,
    ].includes(this.route.getState().params.status)
      ? this.route.getState().params.status
      : this.questionAnswerFilter[0].id;
    this.search = this.querySearch;
  }
  async handleOnCancel() {}

  async updateQuestion() {
    this.querySearch = this.search;
    await this.store.dispatch(
      new UpdateSearchQuery(this.search, this.filterType)
    );
    await this.store.dispatch(new GetDiligenceSectionData()).toPromise();
    await this.store.dispatch(new FilterReload(`${Math.random()}`)).toPromise();
  }

  // Will be used in type ahead
  // searchQuestions() {
  //   this.store.dispatch(new UpdateSearchQuery(this.search));
  // }

  handleSearchChange() {
    this.debouceInst();
  }

  resetFilter() {
    this.search = '';
  }

  redirectToSinglePageView() {
    const currentUrl = this.route.getState()._routerState.url;
    if (this.search.length) {
      let url = currentUrl.split('questionnaire')[0];
      this.route.navigateWithParams(url + 'search_n_review_questions', {
        status: this.filterType,
        q: this.search,
      });
    }
  }
}
