import { Injectable } from '@angular/core';
import {
  Action,
  Selector,
  State,
  StateContext,
  Store,
} from '@ngxs/store';
import { throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { TemplateService } from 'src/app2/apis/template/template.service';
import { QuestionType } from 'src/app2/apis/template/types/question.type';
import { SectionType } from 'src/app2/apis/template/types/section.type';
import {
  CreateBulkCategories,
  CreateBulkSubCategories,
  CreateCategories,
  CreateSubCategories,
  DeleteCategories,
  DeleteQuestions,
  DeleteSubCategories,
  GetCategories,
  GetQuestions,
  MoveQuestions,
  MoveSubCategories,
  ModifyCategory,
  SetTemplateId,
  UpdateActiveQuestionRow,
  UpdateCategories,
  UpdateQuestion,
  UpdateSubCategories,
  ConvertCategory,
  CopyQuestions,
  CreateQuestions,
  UpdateActivePanelId,
  EditTemplate,
  DeleteTemplateState,
  UpdateLocalQuestion,
  GetAllQuestions,
  GetTemplateInfo,
  SaveDescription,
  ActivateTemplate,
  ToggleTemplateState,
  UpdateSubcategoryList,
  UpdateQuestionList,
  UpdateError,
  UpdateTemplate,
  UpdateCategoryList,
  UpdateActiveSectionId,
  UpdateRouteParams,
  DeleteAllCategories,
  GetEntityScoreRules,
} from './template-builder.action';
import { TemplateModel } from './template-builder.model';
import { TemplateGridService } from '../page/template-grid/template-grid.service';
import { ERROR_CODES } from 'src/app2/shared/constants/constant';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { RouterService } from 'src/app2/services/router.service';
import { handelConflict } from './template-builder.util';
import { ClipBoardService } from 'src/app2/services/clipboard.service';
import { ResponseType } from '../../questionnaire/constants/Response-type.constant';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';

@State<TemplateModel>({
  name: 'template',
  defaults: {
    categories: null,
    activeSection: null,
    error: null,
    categoryLoading: false,
    questionLoading: false,
    questions: null,
    activeQuestionSection: null,
    templateId: null,
    totalSubCategories: 0,
    totalCategories: 0,
    template: null,
    activePanelId: null,
    categoryId: null,
    subCategoryId: null,
    entityScoreRules: null,
  },
})
@Injectable()
export class TemplateState {
  constructor(
    private readonly store: Store,
    private template: TemplateService,
    private gridService: TemplateGridService,
    private SweetAlert: SweetAlertService,
    private routerService: RouterService,
    private clipboard: ClipBoardService,
    private modalService: CustomModalService
  ) {}

  @Selector()
  static getTemplateData(state: TemplateModel) {
    return {
      categories: state.categories,
      categoryLoading: state.categoryLoading,
      error: state.error,
      templateId: state.templateId,
    };
  }
  @Selector()
  static getCategoriesData(state: TemplateModel) {
    return state.categories;
  }

  @Selector()
  static getCategoryLength(state: TemplateModel) {
    return state.totalCategories;
  }

  @Selector()
  static getTemplate(state: TemplateModel) {
    return state.template;
  }

  @Selector()
  static getCategories(state: TemplateModel) {
    return state.categories;
  }

  @Selector()
  static getCategoryLoading(state: TemplateModel) {
    return state.categoryLoading;
  }

  @Selector()
  static getSubCategoriesLength(state: TemplateModel) {
    return state.totalSubCategories;
  }

  @Selector()
  static getRouteParams(state: TemplateModel) {
    return { cat: state.categoryId, subCat: state.subCategoryId };
  }

  @Selector()
  static getQuestionData(state: TemplateModel) {
    return {
      questions: state.questions,
      questionLoading: state.questionLoading,
      activeSection: state.activeSection,
      activeQuestionSection: state.activeQuestionSection,
      error: state.error,
      templateId: state.templateId,
    };
  }

  @Selector()
  static getUpdatedQuestionData(state: TemplateModel) {
    return {
      questions: state.questions,
      questionLoading: state.questionLoading,
      activeSection: state.activeSection,
    };
  }

  @Selector()
  static getSectionQuestionData(state: TemplateModel) {
    return state.questions;
  }

  @Selector()
  static getQuestionLoading(state: TemplateModel) {
    return state.questionLoading;
  }

  @Selector()
  static getActiveSection(state: TemplateModel) {
    return {
      activeSection: state.activeSection,
    };
  }

  @Selector()
  static getTemplateID(state: TemplateModel) {
    return state.templateId;
  }
  @Selector()
  static getActivePanelId(state: TemplateModel) {
    return state.activePanelId;
  }

  @Selector()
  static getTemplateInfo(state: TemplateModel) {
    return {
      template: state.template,
      totalCategory: state.totalCategories,
      totalSubCategory: state.totalSubCategories,
    };
  }

  @Action(GetCategories)
  GetCategories({ getState, patchState }: StateContext<TemplateModel>) {
    let { categoryId, subCategoryId, template } = getState();
    patchState({
      categoryLoading: true,
      error: null,
    });
    return this.template
      .getTemplateSections(template.templateInfo.id, template.version)
      .pipe(
        tap(async (res: SectionType[]) => {
          let catList = {};
          let allSections = [];
          let catLen = 0;
          let destination_index = 0;
          let localId = null;
          res
            .filter((val) => val.isParent)
            .forEach((catagory) => {
              if (!localId) localId = catagory.id;
              catLen += 1;
              catagory.destination_index = destination_index;
              catList[catagory.id] = {
                ...catagory,
                label: catagory.name,
                isMultiSelect: false,
                isAllSelect: false,
                isOpen: true,
                list: {},
              };
              destination_index += 1;
              const subCats = res.filter(
                (subCat: any) =>
                  !subCat.isParent && subCat.parentID === catagory.id
              );
              allSections.push(...subCats);
            });
          if (!categoryId) categoryId = +localId;
          let sublocalId = null;
          let subCatCount = 0;
          destination_index = 0;

          let count = 0;
          allSections.forEach((sec) => {
            sec.previous_question_count = count;
            count = sec.question_counts + sec.previous_question_count;
          });

          res
            .filter((val) => !val.isParent)
            .forEach((val) => {
              if (!sublocalId) sublocalId = val.id;
              val.destination_index = destination_index;
              catList[val.parentID].list[val.id] = {
                ...val,
                isSelected: false,
                label: val.name,
                catId: catList[val.parentID].id,
                catName: catList[val.parentID].label,
                previous_question_count: allSections.find(
                  (sec) => sec.id == val.id
                )?.previous_question_count,
              };
              subCatCount += 1;
              destination_index += 1;
            });
          if (!subCategoryId) subCategoryId = +sublocalId;
          patchState({
            categoryLoading: false,
            error: null,
            categories: catList,
            totalCategories: catLen,
            categoryId: +categoryId,
            totalSubCategories: subCatCount,
            subCategoryId: +subCategoryId,
          });
        }),
        catchError((error) => {
          handelConflict(
            error,
            getState().templateId,
            this.SweetAlert,
            this.routerService,
            this.modalService
          );
          patchState({
            categoryLoading: false,
            error: error,
          });
          return throwError(error);
        })
      );
  }

  @Action(GetQuestions)
  GetQuestions(
    { getState, patchState }: StateContext<TemplateModel>,
    { params }: any
  ) {
    patchState({
      questionLoading: true,
      error: null,
    });
    let questions = getState().questions;
    return this.template.getQuestions(params).pipe(
      tap((res: QuestionType[]) => {
        if (res.length) {
          let quesList = {};
          let destination_index = 0;
          res.forEach((question) => {
            question.destination_index = destination_index;
            if (
              question.responseType == ResponseType.Attachment &&
              !question.text?.includes('(click)') &&
              question.text?.includes('data-ng-click')
            ) {
              question.text = question.text
                .replace('data-ng-click', '(click)')
                .replace('vm.', '');
              let localText = question.text.split('<a');
              localText[1] = `id="attachmentUrl" ` + localText[1];
              question.text = `${localText[0]} <a ${localText[1]}`;
            }
            quesList[question.id] = {
              ...question,
              label: question.text,
              isSelected: false,
            };
            destination_index += 1;
          });
          patchState({
            questionLoading: false,
            error: null,
            activeSection: res[0].sectionID,
            questions: JSON.parse(
              JSON.stringify({ ...questions, [res[0].sectionID]: quesList })
            ),
          });
        } else {
          patchState({
            questionLoading: false,
            error: null,
            activeSection: params.sectionId,
            questions: JSON.parse(
              JSON.stringify({ ...questions, [params.sectionId]: {} })
            ),
          });
        }
      }),
      catchError((error) => {
        handelConflict(
          error,
          getState().templateId,
          this.SweetAlert,
          this.routerService,
          this.modalService
        );
        patchState({
          questionLoading: false,
          error: 'Something went wrong while fetching user data',
        });
        return throwError(error);
      })
    );
  }

  @Action(GetAllQuestions)
  GetAllQuestions(
    { getState, patchState }: StateContext<TemplateModel>,
    { params }: any
  ) {
    patchState({
      questionLoading: true,
      error: null,
    });
    let questions = getState().questions;
    return this.template.getQuestions(params).pipe(
      tap((res: QuestionType[]) => {
        if (res.length) {
          let quesList = {};
          let secionId = {};
          res.forEach((question: QuestionType) => {
            quesList[question.id] = {
              ...question,
              label: question.text,
              isSelected: false,
            };
            if (question.sectionID in secionId) {
              let data = { [question.id]: quesList[question.id] };
              secionId[question.sectionID] = {
                ...secionId[question.sectionID],
                ...data,
              };
            } else {
              secionId[question.sectionID] = {
                [question.id]: quesList[question.id],
              };
            }
          });
          patchState({
            questionLoading: false,
            error: null,
            activeSection: res[0].sectionID,
            questions: JSON.parse(
              JSON.stringify({ ...questions, ...secionId })
            ),
          });
        } else {
          patchState({
            questionLoading: false,
            error: null,
          });
        }
      }),
      catchError((error) => {
        patchState({
          questionLoading: false,
          error: 'Something went wrong while fetching user data',
        });
        return throwError(error);
      })
    );
  }

  @Action(CreateQuestions)
  CreateQuestions(
    { getState, patchState }: StateContext<TemplateModel>,
    { id, params }: any
  ) {
    return this.template.CreateQuestionsTemplateSection(id, params).pipe(
      tap((res: QuestionType[]) => {
        let templateData = JSON.parse(JSON.stringify(getState().template));
        let categoryData = JSON.parse(JSON.stringify(getState().categories));
        let categories: any = Object.values(categoryData);
        let quesList = {};
        let localIndex = Object.keys(getState().questions[id]).length;
        res.forEach((question) => {
          for (let i = 0; i < categories.length; i++) {
            if (
              Object.keys(categories[i].list).indexOf(
                question.sectionID.toString()
              ) != -1
            ) {
              categoryData[categories[i].id].list[
                question.sectionID
              ].question_counts += 1;
              categoryData[categories[i].id].question_counts += 1;
              break;
            }
          }
          question.destination_index = localIndex;
          localIndex++;
          quesList[question.id] = {
            ...question,
            label: question.text,
            isSelected: false,
          };
          templateData.questionCount += 1;
        });
        templateData.templateInfo.is_draft = true;
        patchState({
          questionLoading: false,
          error: null,
          categories: categoryData,
          activeSection: res[0].sectionID,
          template: templateData,
          questions: JSON.parse(
            JSON.stringify({
              ...getState().questions,
              [id]: { ...getState().questions[id], ...quesList },
            })
          ),
        });
      }),
      catchError((error) => {
        patchState({
          questionLoading: false,
          error: 'Something went wrong while fetching user data',
        });
        if (error.status === ERROR_CODES.CONFLICT) {
          handelConflict(
            error,
            getState().templateId,
            this.SweetAlert,
            this.routerService,
            this.modalService
          );
        } else if (error.error && error.error.message) {
          this.SweetAlert.error({
            title: error.error.message,
            confirmButtonText: 'Okay',
          });
        }
        return throwError(error);
      })
    );
  }

  @Action(UpdateQuestion)
  UpdateQuestion(
    { getState, patchState }: StateContext<TemplateModel>,
    { id, params }: any
  ) {
    let questions = JSON.parse(JSON.stringify(getState().questions));
    let templateData = JSON.parse(JSON.stringify(getState().template));
    templateData.templateInfo.is_draft = true;
    return this.template.updateQuestions(id, params).pipe(
      tap((res: QuestionType & any) => {
        res = {
          ...res,
          destination_index: questions[params.sectionID][id].destination_index,
          label: res.text,
          isSelected: false,
        };
        let questionsCopy = questions[params.sectionID];
        //during a grid question edit, when a new grid version is created, question id gets changed, delete the old question id from the questions map and add the new one.
        if (id != res.id) {
          delete questionsCopy[id];
        }
        patchState({
          error: null,
          template: templateData,
          questions: {
            ...questions,
            [params.sectionID]: {
              ...questionsCopy,
              [res.id]: res,
            },
          },
        });
      }),
      catchError((error) => {
        if (error.status === ERROR_CODES.CONFLICT) {
          handelConflict(
            error,
            getState().templateId,
            this.SweetAlert,
            this.routerService,
            this.modalService
          );
        } else {
          patchState({
            error: 'Something went wrong while fetching user data',
          });
        }
        patchState({
          error: error,
        });
        return throwError(error);
      })
    );
  }

  @Action(CreateBulkCategories)
  CreateBulkCategories(
    { getState, patchState }: StateContext<TemplateModel>,
    { params }: any
  ) {
    patchState({
      error: null,
    });
    params['template_id'] = +getState().templateId;
    let templateData = JSON.parse(JSON.stringify(getState().template));
    templateData.templateInfo.is_draft = true;
    return this.template
      .createBulkTemplateSection(getState().templateId, params)
      .pipe(
        tap((res: SectionType[]) => {
          let { categories: catData } = JSON.parse(JSON.stringify(getState()));
          let catList = {};
          catData &&
            Object.keys(catData).forEach((catID: any, index) => {
              catData[catID].destination_index = index;
            });
          let catLen = getState().totalCategories;
          res.forEach((catagory) => {
            catagory.destination_index = catLen;
            catLen += 1;
            catList[catagory.id] = {
              ...catagory,
              label: catagory.name,
              isMultiSelect: false,
              isAllSelect: false,
              isOpen: true,
              list: {},
            };
          });
          let categories = { ...catData, ...catList };
          patchState({
            error: null,
            categories: JSON.parse(JSON.stringify(categories)),
            totalCategories: catLen,
            template: templateData,
          });
        }),
        catchError((error) => {
          if (error.status === ERROR_CODES.CONFLICT) {
            handelConflict(
              error,
              getState().templateId,
              this.SweetAlert,
              this.routerService,
              this.modalService
            );
          } else {
            patchState({
              error: 'Something went wrong while fetching user data',
            });
          }
          return throwError(error);
        })
      );
  }

  @Action(CreateBulkSubCategories)
  CreateBulkSubCategories(
    { getState, patchState }: StateContext<TemplateModel>,
    { params }: any
  ) {
    patchState({
      error: null,
    });
    params['template_id'] = +getState().templateId;
    let templateData = JSON.parse(JSON.stringify(getState().template));
    templateData.templateInfo.is_draft = true;
    templateData.last_updated_at = this.gridService.lastUpdateFinder(
      new Date().toISOString().replace('Z', '')
    );
    return this.template
      .createBulkTemplateSection(getState().templateId, params)
      .pipe(
        tap((catagory: SectionType[]) => {
          let { categories: stateCategories, questions } = JSON.parse(
            JSON.stringify(getState())
          );
          let subCatCount = getState().totalSubCategories;

          catagory.map((val) => {
            val.destination_index = subCatCount;
            subCatCount += 1;

            stateCategories[params.parentSection_id]['list'][val.id] = {
              ...val,
              isSelected: false,
              label: val.name,
              catId: stateCategories[params.parentSection_id].id,
              catName: stateCategories[params.parentSection_id].label,
            };
          });

          patchState({
            error: null,
            activeSection: catagory[0].id,
            categoryId: params.parentSection_id,
            subCategoryId: catagory[0].id,
            categories: JSON.parse(JSON.stringify(stateCategories)),
            questions: JSON.parse(
              JSON.stringify({ ...questions, [catagory[0].id]: {} })
            ),
            totalSubCategories: subCatCount,
            template: templateData,
          });
        }),
        catchError((error) => {
          if (error.status === ERROR_CODES.CONFLICT) {
            handelConflict(
              error,
              getState().templateId,
              this.SweetAlert,
              this.routerService,
              this.modalService
            );
          } else {
            patchState({
              error: 'Something went wrong while fetching user data',
            });
          }
          return throwError(error);
        })
      );
  }

  @Action(CreateCategories)
  CreateCategories(
    { getState, patchState }: StateContext<TemplateModel>,
    { params }: any
  ) {
    patchState({
      error: null,
    });
    params['templateID'] = +getState().templateId;
    return this.template.createTemplateSection(params).pipe(
      tap((catagory: SectionType) => {
        let templateData = JSON.parse(JSON.stringify(getState().template));
        templateData.templateInfo.is_draft = true;
        templateData.last_updated_at = this.gridService.lastUpdateFinder(
          new Date().toISOString().replace('Z', '')
        );
        let catList = {};
        catagory.destination_index = getState().totalCategories;
        catList[catagory.id] = {
          ...catagory,
          label: catagory.name,
          isMultiSelect: false,
          isAllSelect: false,
          isOpen: true,
          list: {},
        };
        patchState({
          error: null,
          categories: JSON.parse(
            JSON.stringify({ ...getState().categories, ...catList })
          ),
          totalCategories: getState().totalCategories + 1,
          template: templateData,
        });
      }),
      catchError((error) => {
        if (error.status === ERROR_CODES.CONFLICT) {
          handelConflict(
            error,
            getState().templateId,
            this.SweetAlert,
            this.routerService,
            this.modalService
          );
        } else {
          patchState({
            error: 'Something went wrong while fetching user data',
          });
        }
        return throwError(error);
      })
    );
  }

  @Action(CreateSubCategories)
  CreateSubCategories(
    { getState, patchState }: StateContext<TemplateModel>,
    { params }: any
  ) {
    patchState({
      error: null,
    });
    params['templateID'] = +getState().templateId;
    let templateData = JSON.parse(JSON.stringify(getState().template));
    templateData.templateInfo.is_draft = true;
    templateData.last_updated_at = this.gridService.lastUpdateFinder(
      new Date().toISOString().replace('Z', '')
    );
    return this.template.createTemplateSection(params).pipe(
      tap((catagory: SectionType) => {
        let { categories: stateCategories, questions } = JSON.parse(
          JSON.stringify(getState())
        );
        catagory.destination_index = getState().totalSubCategories;
        stateCategories[params.parentID]['list'][catagory.id] = {
          ...catagory,
          isSelected: false,
          label: catagory.name,
          catId: stateCategories[params.parentID].id,
          catName: stateCategories[params.parentID].label,
        };

        patchState({
          error: null,
          activeSection: catagory.id,
          categories: JSON.parse(JSON.stringify(stateCategories)),
          questions: JSON.parse(
            JSON.stringify({ ...questions, [catagory.id]: {} })
          ),
          totalSubCategories: getState().totalSubCategories + 1,
          template: templateData,
        });
      }),
      catchError((error) => {
        if (error.status === ERROR_CODES.CONFLICT) {
          this.SweetAlert.error({
            title: error.error.message,
            confirmButtonText: 'Refresh',
          }).then((isConfirm) => {
            if (isConfirm.value && isConfirm.value == true) {
              this.routerService.navigateWithParams(
                'app.diligence.template.preview',
                { templateId: getState().templateId }
              );
            }
          });
        } else {
          patchState({
            error: 'Something went wrong while fetching user data',
          });
        }
        return throwError(error);
      })
    );
  }

  @Action(UpdateCategories)
  updateCategories(
    { getState, patchState }: StateContext<TemplateModel>,
    { id, params }: any
  ) {
    patchState({
      error: null,
    });
    let templateData = JSON.parse(JSON.stringify(getState().template));
    templateData.templateInfo.is_draft = true;
    return this.template.updateTemplateSection(id, params).pipe(
      tap((catagory: SectionType) => {
        let stateCategories = JSON.parse(JSON.stringify(getState().categories));
        let catList = {};
        catList[catagory.id] = {
          ...catagory,
          label: catagory.name,
          isMultiSelect: false,
          isAllSelect: false,
          isOpen: true,
          list: stateCategories[catagory.id]['list'],
          destination_index: stateCategories[catagory.id].destination_index,
        };
        patchState({
          error: null,
          template: templateData,
          categories: JSON.parse(
            JSON.stringify({ ...getState().categories, ...catList })
          ),
        });
      }),
      catchError((error) => {
        if (error.status === ERROR_CODES.CONFLICT) {
          handelConflict(
            error,
            getState().templateId,
            this.SweetAlert,
            this.routerService,
            this.modalService
          );
        } else {
          patchState({
            error: 'Something went wrong while fetching user data',
          });
        }
        return throwError(error);
      })
    );
  }

  @Action(UpdateSubCategories)
  UpdateSubCategories(
    { getState, patchState }: StateContext<TemplateModel>,
    { id, params }: any
  ) {
    patchState({
      error: null,
    });
    let templateData = JSON.parse(JSON.stringify(getState().template));
    templateData.templateInfo.is_draft = true;
    templateData.last_updated_at = this.gridService.lastUpdateFinder(
      new Date().toISOString().replace('Z', '')
    );
    return this.template.updateTemplateSection(id, params).pipe(
      tap((catagory: SectionType) => {
        let stateCategories = JSON.parse(JSON.stringify(getState().categories));
        Object.values(stateCategories).map((val: any) => {
          if (id in val.list) {
            stateCategories[val.id]['list'][id] = {
              ...catagory,
              isSelected: false,
              label: catagory.name,
              catId: stateCategories[val.id].id,
              catName: stateCategories[val.id].label,
              destination_index:
                stateCategories[val.id]['list'][id].destination_index,
            };
          }
        });
        patchState({
          error: null,
          categories: JSON.parse(JSON.stringify(stateCategories)),
          template: templateData,
        });
      }),
      catchError((error) => {
        if (error.status === ERROR_CODES.CONFLICT) {
          handelConflict(
            error,
            getState().templateId,
            this.SweetAlert,
            this.routerService,
            this.modalService
          );
        } else {
          patchState({
            error: 'Something went wrong while fetching user data',
          });
        }
        return throwError(error);
      })
    );
  }

  @Action(DeleteSubCategories)
  DeleteSubCategories(
    { getState, patchState }: StateContext<TemplateModel>,
    { id }: any
  ) {
    patchState({
      error: null,
    });
    let templateData = JSON.parse(JSON.stringify(getState().template));
    templateData.templateInfo.is_draft = true;
    return this.template.deleteTemplateSection(id).pipe(
      tap(() => {
        let stateCategories = JSON.parse(JSON.stringify(getState().categories));
        let subCatCount = getState().totalSubCategories;
        let questionCopy = JSON.parse(JSON.stringify(getState().questions));
        Object.values(stateCategories).map((val: any) => {
          if (id in val.list) {
            subCatCount -= 1;
            stateCategories[val.id].question_counts -=
              stateCategories[val.id]['list'][id].question_counts;
            delete stateCategories[val.id]['list'][id];
            templateData.questionCount -= Object.values(
              questionCopy[id] ?? {}
            ).length;
            delete questionCopy[id];
            let subCat: any = Object.values(val.list);
            if (subCat.length > 0) {
              this.store.dispatch(
                new GetQuestions({ sectionId: subCat[0].id })
              );
            }
          }
        });
        patchState({
          error: null,
          categories: JSON.parse(JSON.stringify(stateCategories)),
          questions: questionCopy,
          totalSubCategories: subCatCount,
          template: templateData,
        });
        this.store.dispatch(new GetEntityScoreRules());
      }),
      catchError((error) => {
        patchState({
          error: error,
        });
        return throwError(error);
      })
    );
  }

  @Action(MoveQuestions)
  MoveQuestions(
    { getState, patchState }: StateContext<TemplateModel>,
    { payload }: any
  ) {
    patchState({
      error: null,
    });
    let templateData = JSON.parse(JSON.stringify(getState().template));
    let categoryData = JSON.parse(JSON.stringify(getState().categories));
    let categories: any = Object.values(categoryData);
    templateData.templateInfo.is_draft = true;
    return this.template.moveQuestions(payload).pipe(
      tap((res) => {
        let stateQuestions = JSON.parse(JSON.stringify(getState().questions));
        payload.questions.map((ques) => {
          delete stateQuestions[payload.source_section_id][ques.id];
          ques.sectionID = payload.destination_section_id;
          ques.isSelected = false;
          if (stateQuestions[payload.destination_section_id]) {
            stateQuestions[payload.destination_section_id][ques.id] = ques;
          }
        });
        for (let i = 0; i < categories.length; i++) {
          if (
            Object.keys(categories[i].list).indexOf(
              payload.destination_section_id.toString()
            ) != -1
          ) {
            categoryData[categories[i].id].list[
              payload.destination_section_id.toString()
            ].question_counts += payload?.questions?.length;
            categoryData[categories[i].id].question_counts +=
              payload?.questions?.length;
          }

          if (
            Object.keys(categories[i].list).indexOf(
              payload.source_section_id.toString()
            ) != -1
          ) {
            categoryData[categories[i].id].list[
              payload.source_section_id.toString()
            ].question_counts -= payload?.questions?.length;
            categoryData[categories[i].id].question_counts -=
              payload?.questions?.length;
          }
        }
        patchState({
          error: null,
          questions: JSON.parse(JSON.stringify(stateQuestions)),
          template: templateData,
          categories: JSON.parse(JSON.stringify(categoryData)),
        });
      }),
      catchError((error) => {
        handelConflict(
          error,
          getState().templateId,
          this.SweetAlert,
          this.routerService,
          this.modalService
        );
        patchState({
          error: error,
          templateId: payload.source_section_id,
        });
        return throwError(error);
      })
    );
  }

  @Action(MoveSubCategories)
  MoveSubCategories(
    { getState, patchState }: StateContext<TemplateModel>,
    { payload }: any
  ) {
    patchState({
      error: null,
    });
    let templateData = JSON.parse(JSON.stringify(getState().template));
    templateData.templateInfo.is_draft = true;
    return this.template.moveSubCategories(payload).pipe(
      tap((res) => {
        let stateCategories = JSON.parse(JSON.stringify(getState().categories));

        payload.sections.map((subcat) => {
          delete stateCategories[payload.source_section_id].list[subcat.id];
          subcat.parentID = payload.destination_section_id;
          stateCategories[payload.destination_section_id].list[subcat.id] =
            subcat;
        });

        patchState({
          error: null,
          categories: JSON.parse(JSON.stringify(stateCategories)),
          template: templateData,
        });
      }),
      catchError((error) => {
        handelConflict(
          error,
          getState().templateId,
          this.SweetAlert,
          this.routerService,
          this.modalService
        );
        patchState({
          error: error,
        });
        return throwError(error);
      })
    );
  }

  @Action(DeleteCategories)
  DeleteCategories(
    { getState, patchState }: StateContext<TemplateModel>,
    { id }: any
  ) {
    patchState({
      error: null,
    });
    let {
      subCategoryId: subCatId,
      categoryId: catId,
      template: templateData,
      activeSection,
    } = JSON.parse(JSON.stringify(getState()));

    templateData.templateInfo.is_draft = true;
    return this.template.deleteTemplateSection(id).pipe(
      tap(() => {
        let stateCategories = JSON.parse(JSON.stringify(getState().categories));
        let questionCopy = JSON.parse(JSON.stringify(getState().questions));
        let flag = false;
        Object.values(stateCategories[id]?.list).map((val: any) => {
          templateData.questionCount -= Object.values(
            questionCopy[val.id] ?? {}
          ).length;
          if (val.id === activeSection) {
            flag = true;
          }
        });
        delete stateCategories[id];
        if (catId === id) {
          catId = Object.values(stateCategories)[0]['id'];
          subCatId = Object.values(
            Object.values(stateCategories)[0]?.['list']
          )[0]?.['id'];
        }
        if (flag) {
          activeSection = null;
        }
        patchState({
          error: null,
          categories: JSON.parse(JSON.stringify({ ...stateCategories })),
          totalCategories: getState().totalCategories - 1,
          template: templateData,
          questions: questionCopy,
          categoryId: catId,
          subCategoryId: subCatId,
          activeSection,
        });
        this.store.dispatch(new GetEntityScoreRules());
      }),
      catchError((error) => {
        patchState({
          error: error,
        });
        return throwError(error);
      })
    );
  }

  @Action(DeleteQuestions)
  DeleteQuestions(
    { getState, patchState }: StateContext<TemplateModel>,
    { id, questionId, nestedQuestionId }: any
  ) {
    patchState({
      error: null,
    });
    let templateData = JSON.parse(JSON.stringify(getState().template));
    templateData.questionCount -= 1;
    let categoryData = JSON.parse(JSON.stringify(getState().categories));
    let categories: any = Object.values(categoryData);
    templateData.templateInfo.is_draft = true;
    return this.template.deleteQuestionsTemplateSection(id, questionId).pipe(
      tap(() => {
        let stateQuestions = JSON.parse(JSON.stringify(getState().questions));
        if (!nestedQuestionId) {
          for (let i = 0; i < categories.length; i++) {
            if (Object.keys(categories[i].list).indexOf(id.toString()) != -1) {
              categoryData[categories[i].id].list[id].question_counts -= 1;
              categoryData[categories[i].id].question_counts -= 1;
              break;
            }
          }
          delete stateQuestions[id][questionId];
        }
        patchState({
          error: null,
          questions: JSON.parse(JSON.stringify({ ...stateQuestions })),
          categories: categoryData,
          template: templateData,
        });
        this.store.dispatch(new GetEntityScoreRules());
      }),
      catchError((error) => {
        patchState({
          error: error,
        });
        return throwError(error);
      })
    );
  }

  // Not getting used for now
  @Action(ModifyCategory)
  ModifyCategory(
    { getState, patchState }: StateContext<TemplateModel>,
    { catData }: any
  ) {
    let localList = {};
    catData.list.map((val) => {
      localList[val.id] = val;
    });
    catData.list = localList;
    let stateQuestions = JSON.parse(JSON.stringify(getState().categories));
    stateQuestions[catData.id] = catData;

    patchState({
      categories: JSON.parse(JSON.stringify(stateQuestions)),
    });
  }

  @Action(UpdateActiveQuestionRow)
  UpdateActiveQuestionRow(
    { patchState }: StateContext<TemplateModel>,
    { id }: any
  ) {
    patchState({
      activeQuestionSection: id,
    });
  }
  @Action(SetTemplateId)
  SetTemplateId({ patchState }: StateContext<TemplateModel>, { id }: any) {
    patchState({
      templateId: id,
    });
  }

  @Action(ConvertCategory)
  ConvertCategory(
    { getState, patchState }: StateContext<TemplateModel>,
    { payload }: any
  ) {
    patchState({
      error: null,
    });
    payload['template_id'] = +getState().templateId;
    payload['template_version'] = +getState().template.version;
    let templateData = JSON.parse(JSON.stringify(getState().template));
    templateData.templateInfo.is_draft = true;
    return this.template.convertCategory(payload).pipe(
      tap((ids: any[]) => {
        let stateCatList = JSON.parse(JSON.stringify(getState().categories));
        let catList = {};
        let responseKeys = {};
        for (const key in ids) {
          responseKeys[ids[key]] = key;
        }

        payload.sections.forEach((section) => {
          delete stateCatList[+section.parentID]['list'][+section.id];
          let tempID = section.id;
          section.parentID = responseKeys[tempID];
          catList[responseKeys[tempID]] = {
            templateID: +getState().templateId,
            id: responseKeys[tempID],
            name: section.name,
            isMultiple: false,
            isMultiSelect: false,
            isAllSelect: false,
            isOpen: true,
            label: section.name,
            list: {
              [tempID]: section,
            },
          };
        });

        patchState({
          categories: { ...stateCatList, ...catList },
          template: templateData,
        });
      }),
      catchError((error) => {
        handelConflict(
          error,
          getState().templateId,
          this.SweetAlert,
          this.routerService,
          this.modalService
        );
        patchState({
          error: 'Something went wrong while fetching user data',
        });
        return throwError(error);
      })
    );
  }

  @Action(CopyQuestions)
  CopyQuestions(
    { getState, patchState }: StateContext<TemplateModel>,
    { payload }: any
  ) {
    patchState({
      error: null,
    });
    payload = {
      ...payload,
      destination_template_id: +getState().templateId,
      template_version: +getState().template.version,
    };
    let categoryData = JSON.parse(JSON.stringify(getState().categories));
    let templateData = JSON.parse(JSON.stringify(getState().template));
    templateData.templateInfo.is_draft = true;
    return this.template.copyQuestions(payload).pipe(
      tap(() => {
        let questions = JSON.parse(JSON.stringify(getState().questions));
        Object.keys(categoryData).forEach((catKey) => {
          payload.destination_section_ids.map((sectionId) => {
            if (sectionId in categoryData[catKey].list) {
              categoryData[catKey].list[sectionId].question_counts +=
                payload?.question_ids?.length;
              categoryData[catKey].question_counts +=
                payload?.question_ids?.length;
            }
          });
        });
        templateData.questionCount +=
          payload.question_ids.length * payload.destination_section_ids.length;
        patchState({
          error: null,
          questions: questions,
          template: templateData,
          categories: JSON.parse(JSON.stringify(categoryData)),
        });
      }),
      catchError((error) => {
        handelConflict(
          error,
          getState().templateId,
          this.SweetAlert,
          this.routerService,
          this.modalService
        );
        patchState({
          error: error,
        });
        return throwError(error);
      })
    );
  }

  @Action(UpdateActivePanelId)
  UpdateActivePanelId(
    { patchState }: StateContext<TemplateModel>,
    { id }: any
  ) {
    patchState({
      activePanelId: id,
    });
  }

  @Action(GetTemplateInfo)
  GetTemplateInfo(
    { getState, patchState }: StateContext<TemplateModel>,
    { isDraft = false }
  ) {
    if (getState().template) return;
    return this.template.getTemplateData(+getState().templateId).pipe(
      tap(
        (data: any) => {
          data.last_updated_at = this.gridService.lastUpdateFinder(
            data.last_updated_at
          );
          if (isDraft) data.templateInfo.is_draft = isDraft;
          return patchState({
            error: null,
            template: JSON.parse(JSON.stringify(data)),
          });
        },
        catchError((error) => {
          patchState({
            error: 'Something went wrong',
          });
          return throwError(error);
        })
      )
    );
  }

  @Action(EditTemplate)
  editTemplate(
    { getState, patchState }: StateContext<TemplateModel>,
    { payload }: any
  ) {
    let id = +getState().templateId;
    let templateData = JSON.parse(JSON.stringify(getState().template));
    const params = {
      frequency_id: payload.frequency_id,
      strategyID: payload.strategyID ?? 0,
      is_draft: templateData.templateInfo.is_draft,
      name: payload.name,
      desc: payload.desc,
    };

    templateData.frequency_id = payload.frequency_id;
    templateData.name = payload.name;
    templateData.templateInfo.is_draft = true;
    templateData.templateInfo.desc = payload.desc;
    templateData.templateInfo.strategyID = payload.strategyID;
    return this.template.editTemplate(id, params).pipe(
      tap((res) => {
        templateData.last_updated_at = this.gridService.lastUpdateFinder(
          new Date().toISOString().replace('Z', '')
        );
        patchState({
          template: JSON.parse(JSON.stringify(templateData)),
        });
      }),
      catchError((error) => {
        handelConflict(
          error,
          getState().templateId,
          this.SweetAlert,
          this.routerService,
          this.modalService
        );
        patchState({
          error: 'Something went wrong while editing template',
        });
        return throwError(error);
      })
    );
  }
  @Action(DeleteTemplateState)
  DeleteTemplateState({ getState, patchState }: StateContext<TemplateModel>) {
    this.clipboard.clearClipboardContent();
    patchState({
      error: null,
      questions: null,
      totalCategories: 0,
      templateId: null,
      totalSubCategories: 0,
      categories: null,
      activeSection: null,
      template: null,
      categoryId: null,
      subCategoryId: null,
    });
  }

  @Action(UpdateLocalQuestion)
  UpdateLocalQuestion(
    { getState, patchState }: StateContext<TemplateModel>,
    { id, data }: any
  ) {
    let { activeSection, questions } = getState();
    let questionOne = JSON.parse(JSON.stringify(questions));
    questionOne[activeSection][id] = {
      ...questionOne[activeSection][id],
      ...data,
    };
    patchState({
      questions: {
        ...questionOne,
      },
    });
  }

  @Action(SaveDescription)
  SaveDescription(
    { getState, patchState }: StateContext<TemplateModel>,
    { desc }: any
  ) {
    let templateData = JSON.parse(JSON.stringify(getState().template));
    let payload = {
      frequency_id: templateData.frequency_id,
      is_draft: templateData.templateInfo.is_draft,
      name: templateData.templateInfo.name,
      desc: desc,
    };
    let id = +getState().templateId;
    templateData.templateInfo.desc = desc;

    return this.template.editTemplate(id, payload).pipe(
      tap((res) => {
        patchState({
          template: templateData,
        });
      }),
      catchError((error) => {
        handelConflict(
          error,
          getState().templateId,
          this.SweetAlert,
          this.routerService,
          this.modalService
        );
        patchState({
          error: 'Something went wrong while editing description',
        });
        return throwError(error);
      })
    );
  }

  @Action(ActivateTemplate)
  ActivateTemplate({ getState, patchState }: StateContext<TemplateModel>) {
    let templateData = JSON.parse(JSON.stringify(getState().template));
    templateData.templateInfo.is_draft = false;
    let payload = {
      frequency_id: templateData.frequency_id,
      is_draft: false,
      name: templateData.templateInfo.name,
      desc: templateData.templateInfo.desc,
    };
    return this.template.activateTemplate(+getState().templateId, payload).pipe(
      tap((res) => {
        patchState({
          template: templateData,
        });
      }),
      catchError((error) => {
        handelConflict(
          error,
          getState().templateId,
          this.SweetAlert,
          this.routerService,
          this.modalService
        );
        patchState({
          error: 'Something went wrong',
        });
        return throwError(error);
      })
    );
  }

  @Action(ToggleTemplateState)
  ToggleTemplateState({ getState, patchState }: StateContext<TemplateModel>) {
    let templateData = JSON.parse(JSON.stringify(getState().template));
    templateData.templateInfo.is_draft = true;
    patchState({
      template: templateData,
    });
  }

  @Action(UpdateSubcategoryList)
  UpdateSubcategoryList(
    { getState, patchState }: StateContext<TemplateModel>,
    { list, id }: any
  ) {
    let templateData = JSON.parse(JSON.stringify(getState().template));
    templateData.templateInfo.is_draft = true;
    let categoriesCopy = JSON.parse(JSON.stringify(getState().categories));
    list.forEach((data, index) => {
      categoriesCopy[id].list[data.id].destination_index = index;
    });
    patchState({
      categories: JSON.parse(JSON.stringify(categoriesCopy)),
      template: templateData,
    });
  }

  @Action(UpdateCategoryList)
  UpdateCategoryList(
    { getState, patchState }: StateContext<TemplateModel>,
    { list }: any
  ) {
    let templateData = JSON.parse(JSON.stringify(getState().template));
    templateData.templateInfo.is_draft = true;
    let categoriesCopy = JSON.parse(JSON.stringify(getState().categories));
    list.forEach((data, index) => {
      categoriesCopy[data.id].destination_index = index;
    });
    patchState({
      categories: JSON.parse(JSON.stringify(categoriesCopy)),
      template: templateData,
    });
  }

  @Action(UpdateQuestionList)
  UpdateQuestionList(
    { getState, patchState }: StateContext<TemplateModel>,
    { list, id }: any
  ) {
    let templateData = JSON.parse(JSON.stringify(getState().template));
    templateData.templateInfo.is_draft = true;
    let questionData = JSON.parse(JSON.stringify(getState().questions));
    let questionDataCopy = {};
    list.forEach((data, index) => {
      data.destination_index = index;
      questionDataCopy[data.id] = data;
    });

    questionData[id] = questionDataCopy;
    patchState({
      questions: questionData,
      template: templateData,
    });
  }

  @Action(UpdateError)
  UpdateError({ patchState }: StateContext<TemplateModel>, { error }: any) {
    patchState({
      error: error,
    });
  }

  @Action(UpdateActiveSectionId)
  UpdateActiveSectionId(
    { patchState }: StateContext<TemplateModel>,
    { id }: any
  ) {
    patchState({
      activeSection: id,
    });
  }

  @Action(UpdateRouteParams)
  UpdateRouteParams(
    { patchState }: StateContext<TemplateModel>,
    { params }: any
  ) {
    patchState({
      categoryId: params.categoryId,
      subCategoryId: params.subCategoryId,
    });
  }

  @Action(UpdateTemplate)
  UpdateTemplate(
    { getState, patchState }: StateContext<TemplateModel>,
    { template }: any
  ) {
    let templateData = JSON.parse(JSON.stringify(getState().template));
    if (template && template.template) {
      let templateInfo = JSON.parse(JSON.stringify(templateData.templateInfo));
      templateData = { ...templateData, ...template.template };
      if (template.templateInfo) {
        templateData.templateInfo = {
          ...templateData.templateInfo,
          ...template.templateInfo,
        };
      } else {
        templateData.templateInfo = { ...templateInfo };
      }
    }
    templateData.templateInfo.isExpiredTemplateVersion = false;
    templateData.last_updated_at = this.gridService.lastUpdateFinder(
      new Date().toISOString().replace('Z', '')
    );
    patchState({
      template: JSON.parse(JSON.stringify(templateData)),
      error: null,
    });
  }

  @Action(DeleteAllCategories)
  DeleteAllCategories({ patchState }: StateContext<TemplateModel>) {
    patchState({
      categories: null,
    });
  }

  @Action(GetEntityScoreRules)
  GetEntityScoreRules({ getState, patchState }: StateContext<TemplateModel>) {
    let state = getState();
    return this.template
      .getScoreRules(state.templateId, state.template.version)
      .pipe(
        tap((res: any[]) => {
          patchState({
            entityScoreRules: res,
          });
        })
      );
  }
}
