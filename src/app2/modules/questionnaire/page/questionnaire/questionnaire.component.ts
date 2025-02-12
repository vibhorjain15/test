import { Component, OnDestroy, OnInit } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { Subject, SubscriptionLike } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { DiligenceType } from 'src/app2/apis/questionnaire/type/diligence.type';
import { RouterService } from 'src/app2/services/router.service';
import { SidePanelService } from 'src/app2/services/side-panel.service';
import { UserState } from 'src/app2/store/user/user.state';
import {
  DeleteActiveSection,
  FilterReload,
  GetDiligenceSectionData,
  GetFunctionAssignment,
  GetMyFunctions,
  GetQuestionCount,
  GetQuestionsUserRoles,
  GetRatingScheme,
  GetReviewMappingsData,
  PatchActiveSection,
  UpdateCategory,
  UpdateDiligenceData,
  UpdateFilterMap,
  UpdateIds,
  UpdateSearchQuery,
} from '../../store/questionnaire.action';
import { QuestionState } from '../../store/questionnaire.state';
import { DiligenceTypeEnum } from '../../types/diligence-enum.type';
import { CacheUtil } from '../../service/cache.service';
import { DvDraftService } from '../../service/draft.service';
import { QuestionnaireStatusService } from '../../service/status.service';
import { QuestionnaireService } from 'src/app2/apis/questionnaire/questionnaire.service';
import { ReviewCommentsService } from '../../service/review-comments.service';
import { ActivatedRoute } from '@angular/router';
import { DeviceService } from 'src/app2/services/device-type.service';

@Component({
  selector: 'questionnaire',
  templateUrl: './questionnaire.component.html',
  styleUrls: ['./questionnaire.component.css'],
})
export class QuestionnaireComponent implements OnInit, OnDestroy {
  usertype = 'investor';
  @Select(QuestionState.getDiligence) diligence;
  @Select(UserState.getCurrentUserData) user;
  @Select(QuestionState.getActiveSection) activeSection;
  @Select(QuestionState.getActivePanelId) activePanelId;
  @Select(QuestionState.getSilentReload) getSilentReload;
  @Select(QuestionState.getCategoriesData) categories;
  @Select(QuestionState.getCatData) categoriesData;
  private ngUnsubscribe = new Subject<void>();
  private ngCatUnsubscribe = new Subject<void>();
  categoryData;
  query;
  categoryLoading = false;
  isSidePanelOpened = false;
  diligenceData;
  silentReload;
  diligenceDataSub;
  ngUnsubscribeScope;
  observableSubscriptions: SubscriptionLike[] = [];
  isFirst = false;
  loading: boolean = false;
  constructor(
    private readonly store: Store,
    private router: RouterService,
    private panelService: SidePanelService,
    private cache: CacheUtil,
    private draft: DvDraftService,
    private status: QuestionnaireStatusService,
    private question: QuestionnaireService,
    private comment: ReviewCommentsService,
    private routeState: ActivatedRoute,
    private device: DeviceService
  ) {}
  ngOnInit(): void {
    this.router.createListener((url, extras) => {
      const count = this.draft.getDraftCount();
      if (count) {
        this.draft.showCountAlert(
          () => {
            this.clearStoreBeforeRouting();
            this.router.navigateAngular(url, extras);
          },
          () => {
            this.clearStoreBeforeRouting();
            this.router.navigateAngular(url, extras);
          }
        );
        return true;
      } else {
        this.router.navigateAngular(url, extras);
      }
      return null;
    });
    this.observableSubscriptions.push(
      this.diligence.subscribe((diligence) => {
        this.diligenceData = diligence;
      })
    );
    this.observableSubscriptions.push(
      this.panelService.sidePanelSub.subscribe((val) => {
        this.isSidePanelOpened = val;
      })
    );
    this.categoriesData
      .pipe(takeUntil(this.ngCatUnsubscribe))
      .subscribe((categories) => {
        if (categories && Object.keys(categories).length && !this.loading) {
          this.loading = true;
          this.categoryData = Object.values(
            JSON.parse(JSON.stringify(categories))
          );
          setTimeout(() => {
            this.openReviewCommentSidePanel();
            this.ngCatUnsubscribe.next();
            this.ngCatUnsubscribe.complete();
          }, 1000);
        }
      });

    this.categories
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(({ categories, categoryLoading }) => {
        if (categories) {
          this.categoryData = Object.values(
            JSON.parse(JSON.stringify(categories))
          );
        }
        this.categoryLoading = categoryLoading;
        if (!this.query)
          this.query =
            this.router.getState().params?.q ||
            this.router.getState().params?.status;
      });

      this.user.pipe(take(1))
      .subscribe((user) => {
        if (user) {
          this.usertype = user.type;
          this.store.dispatch(new UpdateIds(this.router.getState().params));
          this.store.dispatch(new GetQuestionCount()).subscribe((val) => {
            let diligenceId = this.router.getState().params.diligenceId;
            diligenceId &&
              this.question
                .getDiligence(diligenceId)
                .subscribe((res: DiligenceType) => {
                  res.status = res.status == 'Invited' ? 'Started' : res.status;
                  res.isQuickFilter = true;
                  this.store.dispatch(new UpdateDiligenceData(res));
                  this.store.dispatch(new GetDiligenceSectionData());
                  this.store.dispatch(new GetMyFunctions(diligenceId));
                  this.store.dispatch(new GetQuestionsUserRoles());
                  this.store.dispatch(new GetRatingScheme());
                  this.store.dispatch(new GetFunctionAssignment());
                });
          });
        }
      });

    this.observableSubscriptions.push(
      this.diligence.subscribe((diligence: DiligenceType) => {
        if (
          diligence &&
          diligence.diligence_type === DiligenceTypeEnum.dd_review
        ) {
          this.store.dispatch(new GetReviewMappingsData());
        }
      })
    );

    this.observableSubscriptions.push(
      this.getSilentReload.subscribe((silentReload) => {
        if (silentReload) {
          this.silentReload = silentReload;
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.cache.clearCache();
    this.observableSubscriptions.forEach((subscription) =>
      subscription?.unsubscribe()
    );
    this.status.localQuestionMapSubscription?.unsubscribe();
    this.store.dispatch(new DeleteActiveSection());
    this.clearStoreBeforeRouting();
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.status.destroyVariablesUponExit();
  }

  async handleResetFilter() {
    this.query = '';
    this.store.dispatch(new UpdateSearchQuery('', null));
    await this.store.dispatch(new GetDiligenceSectionData()).toPromise();
    await this.store.dispatch(new UpdateFilterMap('default')).toPromise();
    this.store.dispatch(new FilterReload(`${Math.random()}`));
  }

  redirectToSummary() {
    // when curr page is questionnaire we have to skip two parts of the route to get the parent route and then append summary to it as its
    // current route will always be parentRoute.questionnaire.category
    //const currRoute = this.router.getState()._routerState.url;
    //this.router.navigate(currRoute.split('questionnaire')[0] + 'summary');
    this.router.navigateToRelativeRoute('summary', this.routeState);
  }

  clearStoreBeforeRouting() {
    this.router.destroyListener();
    this.cache.clearCache();
    this.comment.clearMultiTextData();
  }

  openReviewCommentSidePanel(): void {
    const state = this.router.getState();
    const queryParams = state.queryParams;
    // Check for CKComments side-panel
    if (
      queryParams &&
      Object.keys(queryParams).length > 0 &&
      queryParams.panel === 'ck-comments' &&
      queryParams.questionId &&
      queryParams.Sectionid
    ) {
      let category = null;
      let activeCategory = null;
      this.categoryData.forEach((section: any) => {
        if (queryParams.Sectionid in section.list) {
          category = section.list[queryParams.Sectionid];
          section.isOpen = true;
          activeCategory = section;
        }
      });
      if (category) {
        let sidePanelRoute = `questionnaire/category/${category.parentID}/question/${queryParams.questionId}`;
        let url =
          state._routerState.url.split('questionnaire')[0] + sidePanelRoute;

        this.router.navigateAngular(url, {
          queryParams: { panel: 'ck-comments' },
          fragment: `child_section_${queryParams.Sectionid}`,
        });
        setTimeout(() => {
          this.store
            .dispatch([
              new PatchActiveSection({
                label: category.name,
                id: category.id,
                data: category,
              }),
              new UpdateCategory(activeCategory),
            ])
            .subscribe(() => (this.loading = false));
        }, 0);
      } else {
        this.loading = false;
      }
    } else {
      this.loading = false;
    }
  }
}
