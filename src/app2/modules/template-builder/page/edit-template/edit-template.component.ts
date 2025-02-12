import { Component, OnDestroy, OnInit } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { Subject } from 'rxjs';
import { skip, take, takeUntil } from 'rxjs/operators';
import { RouterService } from 'src/app2/services/router.service';
import { SidePanelService } from 'src/app2/services/side-panel.service';
import { UserState } from 'src/app2/store/user/user.state';
import {
  GetCategories,
  GetEntityScoreRules,
  GetTemplateInfo,
  UpdateActivePanelId,
  UpdateRouteParams,
} from '../../store/template-builder.action';
import {
  CategoriesType,
  TemplateModel,
} from '../../store/template-builder.model';
import { TemplateState } from '../../store/template-builder.state';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { UtilsService } from 'src/app2/services/utils.service';

@Component({
  selector: 'edit-template',
  templateUrl: './edit-template.component.html',
  styleUrls: ['./edit-template.component.css'],
})
export class EditTemplateComponent implements OnInit, OnDestroy {
  categories = [];
  questions = [];
  categoryLoading = false;
  questionsLoading = false;
  activeCategoryRow;
  radioVal = '';
  activeQuestionRow = 0;

  isSidePanelOpened = false;
  isInvestor = false;
  localState;
  @Select(TemplateState.getQuestionData) questionState;
  @Select(TemplateState.getCategoryLoading) categoryLoadingState;
  @Select(TemplateState.getUpdatedQuestionData) updatedQuestionState;
  @Select(UserState.getCurrentUserData) user;
  @Select(TemplateState.getTemplateInfo) templateInfo;
  @Select(TemplateState.getActivePanelId) activePanelId;
  @Select(TemplateState.getTemplateID) templateId;
  @Select(TemplateState.getCategoriesData) categoriesState;
  private ngUnsubscribe = new Subject<void>();

  constructor(
    private panelService: SidePanelService,
    private readonly store: Store,
    private readonly routerService: RouterService,
    private routerState: ActivatedRoute,
    private readonly customModalFactory: CustomModalService,
    private readonly router: Router,
    private readonly utils: UtilsService
  ) {}

  ngOnInit(): void {
    this.templateId.pipe(take(2)).subscribe((id) => {
      if (id) {
        this.store.dispatch(new GetTemplateInfo()).subscribe(() => {
          this.store.dispatch(new GetCategories());
          this.store.dispatch(new GetEntityScoreRules());
        });
      }
    });
    let { categoryId, subcategoryId } = this.routerService.getState(
      this.routerState
    ).params;
    this.store.dispatch(
      new UpdateRouteParams({
        categoryId: categoryId,
        subCategoryId: subcategoryId,
      })
    );
    this.user.pipe(take(1)).subscribe((user) => {
      if (user) {
        this.init();
        this.isInvestor = user.isInvestor;
      }
    });

    this.store.dispatch(new UpdateActivePanelId(''));
  }

  init(): void {
    this.panelService.sidePanelSub
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((val) => {
        this.isSidePanelOpened = val;
      });
    this.questionState
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((state: TemplateModel) => {
        this.questionsLoading = state.questionLoading;
        let localState = JSON.parse(JSON.stringify(state));
        this.activeCategoryRow = localState.activeSection;
        this.activeQuestionRow = JSON.parse(
          JSON.stringify(localState.activeQuestionSection)
        );

        if (localState.questions && localState.activeSection) {
          const questions: any[] = JSON.parse(
            JSON.stringify(
              Object.values(
                localState.questions[localState.activeSection] ?? []
              )
            )
          );
          questions.forEach(
            (q) => (q.label = this.utils.addDownloadLink(q.label))
          );
          this.questions = questions;
        }
      });
    this.categoryLoadingState
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((state: boolean) => {
        this.categoryLoading = state;
      });
    let { categoryId, subcategoryId, addNew, addNewSubcategory } =
      this.routerService.getState().params;

    if (
      categoryId &&
      subcategoryId &&
      this.routerService.getState().params?.addNewQuestion
    ) {
      this.customModalFactory.invoke('new-question', {
        initialState: {
          sectionId: this.routerService.getState().params.subcategoryId,
        },
        class: 'modal-xl',
      });
    }

    this.categoriesState
      .pipe(takeUntil(this.ngUnsubscribe), skip(1))
      .subscribe((state: CategoriesType) => {
        let categories = JSON.parse(JSON.stringify(state));
        if (categories) {
          this.categories = Object.values(categories);
          this.categories.forEach((cat) => {
            cat.list = Object.values(cat.list);
            if (categoryId == cat.id && addNewSubcategory) {
              this.router.navigate([], {
                queryParams: {
                  addNewSubcategory: null,
                },
                queryParamsHandling: 'merge',
              });
              addNewSubcategory = false;
              this.customModalFactory.invoke('manage-category', {
                initialState: {
                  type: 'sub-category',
                  parentID: cat.id,
                  categoryName: cat.name,
                  OnSuccess: () => {
                    addNewSubcategory = false;
                  },
                },
                closeInterceptor: () => {
                  return new Promise<void>((resolve) => {
                    resolve();
                    addNewSubcategory = false;
                  });
                },
              });
            }
          });
        }
        if (addNew) {
          this.router.navigate([], {
            queryParams: {
              addNew: null,
            },
            queryParamsHandling: 'merge',
          });
          addNew = false;
          this.customModalFactory.invoke('manage-category', {
            initialState: {
              type: 'category',
              currentLength: 0,
              OnSuccess: () => {
                addNew = false;
              },
              closeInterceptor: () => {
                return new Promise<void>((resolve) => {
                  resolve();
                  addNew = false;
                });
              },
            },
          });
          addNew = false;
        }
      });
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
