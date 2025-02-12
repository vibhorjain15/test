import { Component, OnInit } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { take } from 'rxjs/operators';
import { RouterService } from 'src/app2/services/router.service';
import { UserState } from 'src/app2/store/user/user.state';
import {
  GetDiligenceData,
  GetDiligenceSectionData,
  UpdateIds,
  UpdateSearchQuery,
} from '../../store/questionnaire.action';
import { QuestionState } from '../../store/questionnaire.state';
import { Router } from '@angular/router';

@Component({
  selector: 'question-search-review',
  templateUrl: './question-search-review.component.html',
  styleUrls: ['./question-search-review.component.css'],
})
export class QuestionSearchReviewComponent implements OnInit {
  noResultsPresent: boolean;
  searchText: string;
  newSearchText: string;
  diligenceData: any;
  categories: any[];
  loading: boolean;
  isManager: boolean;
  questionAnswerFilter = [
    { name: 'Question', id: 'Search' },
    { name: 'Response', id: 'ResponseSearch' },
  ];
  filterType: string;
  @Select(QuestionState.getDiligence) diligence;
  @Select(UserState.getCurrentUserData) user;
  constructor(
    private readonly store: Store,
    private readonly router: RouterService,
    private readonly angularRouter: Router
  ) {}

  ngOnInit(): void {
    this.searchText = this.newSearchText = this.router.getState().params.q;
    this.filterType =
      this.router.getState().params.status ?? this.questionAnswerFilter[0].id;
    this.loading = true;
    this.user.pipe(take(1)).subscribe((user) => {
      if (user) {
        this.isManager = user.isManager;
        this.store.dispatch(new UpdateIds(this.router.getState().params));
        this.store.dispatch(new GetDiligenceData()).subscribe((data) => {
          this.diligenceData = data.questionnaire.diligence;
          this.store.dispatch(
            new UpdateSearchQuery(this.searchText, this.filterType)
          );
          this.store
            .dispatch(new GetDiligenceSectionData())
            .subscribe((res) => {
              this.categories = Object.values(res.questionnaire.categories);
              this.noResultsPresent = !this.categories.length;
              this.loading = false;
            });
        });
      }
    });
  }

  getValues(obj) {
    return Object.values(obj);
  }

  searchQuestions() {
    const currRoute = this.router.getState()._routerState.url;
    this.angularRouter.navigate([
      currRoute.split('search_n_review_questions')[0] +
        '/search_n_review_questions',
    ]);
    this.store.dispatch(
      new UpdateSearchQuery(this.newSearchText, this.filterType)
    );
    this.loading = true;
    this.store.dispatch(new GetDiligenceSectionData()).subscribe((res) => {
      this.categories = Object.values(res.questionnaire.categories);
      this.noResultsPresent = !this.categories.length;
      this.loading = false;
    });
  }

  goBack() {
    const currRoute = this.router.getState()._routerState.url;
    if (this.noResultsPresent) {
      this.router.navigateWithParams(
        currRoute.split('search_n_review_questions')[0] + '/questionnaire',
        { status: null, q: null }
      );
    } else {
      this.router.navigateWithParams(
        currRoute.split('search_n_review_questions')[0] + '/questionnaire',
        { status: this.filterType, q: this.newSearchText }
      );
    }
  }

  resetFilter() {
    this.newSearchText = null;
  }
}
