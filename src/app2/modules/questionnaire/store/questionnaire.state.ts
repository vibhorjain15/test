import { Injectable } from '@angular/core';
import { Action, Selector, State, StateContext, Store } from '@ngxs/store';
import { of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { QuestionnaireService } from 'src/app2/apis/questionnaire/questionnaire.service';
import { DiligenceType } from 'src/app2/apis/questionnaire/type/diligence.type';
import { RouterService } from 'src/app2/services/router.service';
import { DiligenceTypeEnum } from 'src/app2/shared/constants/constant';
import {
  NoCommentResponseTypes,
  TaskType,
} from '../constants/question-status.constant';
import { diligenceStatusConstant } from '../constants/quick-view-headers.constant';
import { ResponseType } from '../constants/Response-type.constant';
import { QuestionRootType } from '../types/questions.type';
import { RatingScaleDefType } from '../types/rating-scale-def.type';
import { RatingSchemeMappingType } from '../types/rating-scheme-mapping.type';
import { ReviewMappingsData } from '../types/review-mappings-data.type';
import { SectionResponseType } from '../types/section.type';
import {
  DeleteCategoryData,
  DeleteDraftQuestionData,
  DeleteLocalQuestionMap,
  DeleteQuestionData,
  getCustomFieldDatamap,
  GetDiligenceData,
  GetDiligenceSectionData,
  GetFunctionAssignment,
  GetMyFunctions,
  GetQuestionCount,
  GetQuestionData,
  GetRatingScheme,
  GetReviewMappingsData,
  GetSequenceId,
  GetSubSectionData,
  GetTrackChanges,
  HandleReviewStatus,
  IsSavingDraft,
  TriggerSilentReload,
  UpdateActivePanelId,
  UpdateActiveSection,
  UpdateAttachmentMap,
  UpdateCategory,
  UpdateColorData,
  UpdateDiligenceData,
  UpdateDraftData,
  UpdateFilterMap,
  UpdateIds,
  UpdateLocalGridMap,
  UpdateLocalQuestionMap,
  UpdateQuestionData,
  UpdateReviewCommentsData,
  UpdateSearchQuery,
  UpdateSectionFilterCounter,
  UpdateSequenceSectionQuestionMap,
  UpdateShownModal,
  UpdateSubCatData,
  SidePanelUpdate,
  UpdateBulkLocalQuestionMapQuestionMap,
  DeleteOnlyDraftQuestionData,
  getReviewAssignments,
  updateReviewAssignments,
  FilterReload,
  DeleteActiveSection,
  DeleteReviewMapData,
  ClearCategory,
  GetEntityScoreRules,
  SetTemplateQuestions,
  SetQuestionOptions,
  PatchActiveSection,
  GetReviewers,
  UpdateSequenceIdInLocalGridMap,
} from './questionnaire.action';
import { QuestionCount, QuestionnaireModel } from './questionnaire.modal';
import {
  DefaultQuestionState,
  getNestedQuestionObjectById,
  getParentNestedQuestion,
  LocalQuestionMapHelper,
  updateDiligenceData,
  UpdateLocalQuestionState,
} from './questionnaire.util';
import { SidePanelService } from 'src/app2/services/side-panel.service';
import { AssignReviewDefinition } from 'src/app2/shared/models/review-definitions.model';
import { ToastrService } from 'ngx-toastr';
import { canSetDefaultRating } from '../util/question-status.util';
import { ReviewCommentsService } from '../service/review-comments.service';
import { AssignmentsService } from 'src/app2/services/assignments.service';
import { CacheUtil } from '../service/cache.service';
import { Router } from '@angular/router';
import { DvDatePipe } from 'src/app2/shared/pipes/dv-date.pipe';

@State<QuestionnaireModel>({
  name: 'questionnaire',
  defaults: {
    fromfirmId: null,
    tofirmId: null,
    fundId: null,
    diligenceId: null,
    subCatToCatMap: null,
    categoryId: null,
    subCatId: null,
    activeSection: null,
    questionCounts: null,
    countLoader: false,
    error: null,
    diligenceLoader: false,
    diligence: null,
    categories: null,
    questions: null,
    draftData: null,
    activePanelId: null,
    attachmentMap: null,
    filterStatus: 'default',
    localQuestionMap: null,
    nestedQuestionMap: null,
    sequenceMap: null,
    searchQuery: null,
    colorData: null,
    selectedRatingScheme: null,
    rating_scheme_default: null,
    reviewMappingsData: null,
    silentReload: null,
    localGridMap: {},
    customFieldDatamap: null,
    questionUserRoles: null,
    questionId: null,
    functionAssignment: null,
    responseHistory: null,
    followups: null,
    parentQuestionCount: {},
    reviewStatus: null,
    categoryLoading: false,
    sequenceSectionQuestionMap: {},
    introModalShown: false,
    sectionFilterCounter: null,
    isDraftSave: null,
    allSections: null,
    responseTypeFromPanel: null,
    assignments: {},
    filterReload: null,
    reviewCommentDataMap: {},
    isSequenceIdInRoute: false,
    entityScoreRules: null,
    templateQuestions: null,
    questionOptions: null,
    reviewers: new Map<number, string>(),
    isReviewersVisible: false,
  },
})
@Injectable()
export class QuestionState {
  constructor(
    private readonly store: Store,
    private readonly assignmentsService: AssignmentsService,
    private question: QuestionnaireService,
    private dvDatePipe: DvDatePipe,
    private router: RouterService,
    private toaster: ToastrService,
    private sidePanelService: SidePanelService,
    private comment: ReviewCommentsService,
    private cache: CacheUtil,
    private readonly angularRouter: Router
  ) {}

  @Selector()
  static getDilignceId(state: QuestionnaireModel) {
    return state.diligenceId;
  }
  @Selector()
  static getSequenceSectionQuestionMap(state: QuestionnaireModel) {
    return state.sequenceSectionQuestionMap;
  }

  @Selector()
  static getActiveSection(state: QuestionnaireModel) {
    return state.activeSection;
  }
  @Selector()
  static getQuestionUserRoles(state: QuestionnaireModel) {
    return state.questionUserRoles;
  }

  @Selector()
  static getCutomMapRating(state: QuestionnaireModel) {
    return state.customFieldDatamap;
  }
  @Selector()
  static getActivePanelId(state: QuestionnaireModel) {
    return state.activePanelId;
  }
  @Selector()
  static getFunctionAssignment(state: QuestionnaireModel) {
    return state.functionAssignment;
  }

  @Selector()
  static getQuestions(state: QuestionnaireModel) {
    return {
      questions: state.questions,
      activeSection: state.activeSection,
    };
  }

  @Selector()
  static getReviewStatus(state: QuestionnaireModel) {
    return state.reviewStatus;
  }

  @Selector()
  static getQuestionChange(state: QuestionnaireModel) {
    return {
      questions: state.questions,
    };
  }

  @Selector()
  static getDraftData(state: QuestionnaireModel) {
    return state.draftData;
  }

  @Selector()
  static getColorData(state: QuestionnaireModel) {
    return state.colorData;
  }

  @Selector()
  static getFilterStatus(state: QuestionnaireModel) {
    return state.filterStatus;
  }
  @Selector()
  static getFilterReload(state: QuestionnaireModel) {
    return state.filterReload;
  }
  @Selector()
  static getQueryStatus(state: QuestionnaireModel) {
    return state.searchQuery;
  }
  @Selector()
  static getResponseTypeFromPanel(state: QuestionnaireModel) {
    return state.responseTypeFromPanel;
  }

  @Selector()
  static getQuestionnaireCount(state: QuestionnaireModel) {
    return {
      count: state.questionCounts,
      loader: state.countLoader,
    };
  }
  @Selector()
  static getQuestionnaireCountOnly(state: QuestionnaireModel) {
    return state.questionCounts;
  }
  @Selector()
  static getDiligence(state: QuestionnaireModel) {
    return state.diligence;
  }
  @Selector()
  static getCategoriesData(state: QuestionnaireModel) {
    return {
      categories: state.categories,
      categoryLoading: state.categoryLoading,
      activeSection: state.activeSection,
    };
  }

  @Selector()
  static getCatData(state: QuestionnaireModel) {
    return state.categories;
  }

  @Selector()
  static getReviewMappingsData(state: QuestionnaireModel) {
    return state.reviewMappingsData;
  }

  @Selector()
  static getSilentReload(state: QuestionnaireModel) {
    return state.silentReload;
  }

  @Selector()
  static getLocalQuestionMap(state: QuestionnaireModel) {
    return state.localQuestionMap;
  }

  @Selector()
  static getResponseHistory(state: QuestionnaireModel) {
    return state.responseHistory;
  }
  @Selector()
  static getFollowUpsToSend(state: QuestionnaireModel) {
    return state.followups;
  }

  @Selector()
  static getSavedData(state: QuestionnaireModel) {
    return state.isDraftSave;
  }

  @Selector()
  static getAssignments(state: QuestionnaireModel) {
    return state.assignments;
  }

  @Selector()
  static getReviewers(state: QuestionnaireModel) {
    return {
      isReviewersVisible: state.isReviewersVisible,
      reviewers: state.reviewers,
    };
  }

  @Action(GetQuestionCount)
  GetQuestionCount({ getState, patchState }: StateContext<QuestionnaireModel>) {
    patchState({
      countLoader: true,
      error: null,
    });
    return (
      getState().diligenceId &&
      this.question.getQuestionCounts(getState().diligenceId).pipe(
        tap((res: QuestionCount[]) => {
          patchState({
            countLoader: false,
            error: null,
            questionCounts: res,
          });
        }),
        catchError((error) => {
          patchState({
            countLoader: false,
            error: 'Something went wrong',
          });
          return of([]);
        })
      )
    );
  }

  @Action(GetDiligenceData)
  GetDiligenceData({ getState, patchState }: StateContext<QuestionnaireModel>) {
    patchState({
      error: null,
      diligenceLoader: true,
    });
    if (!getState().diligenceId) return;
    return this.question.getDiligence(getState().diligenceId).pipe(
      tap(async (res: DiligenceType) => {
        if (res.status == 'Invited') {
          let toastInstance = this.toaster.info(
            'Please wait while the request is being processed.',
            'Starting project...'
          );
          try {
            let response: any = await this.question
              .updateDiligenceStatus(res.id, { status: 'Started' })
              .toPromise();
            res = response;
          } catch (error) {
            this.router.navigate('app.home');
            this.toaster.clear(toastInstance.toastId);
          }
        }

        const { currentUser } = this.store.selectSnapshot(
          (state) => state.user
        );
        res.isQuickFilter = true;
        patchState({
          diligenceLoader: false,
          error: null,
          diligence: updateDiligenceData(res, currentUser),
        });

        if (res) this.store.dispatch(new GetReviewers());
      }),
      catchError((error) => {
        patchState({
          diligenceLoader: false,
          error: 'Something went wrong',
        });
        return of([]);
      })
    );
  }

  @Action(GetDiligenceSectionData)
  GetDiligenceSectionData({
    getState,
    patchState,
  }: StateContext<QuestionnaireModel>) {
    patchState({
      error: null,
      categoryLoading: true,
    });
    let {
      subCatToCatMap,
      categoryId,
      subCatId,
      filterStatus,
      searchQuery,
      selectedRatingScheme,
      diligence,
      diligenceId,
    } = JSON.parse(JSON.stringify(getState()));
    if (!diligenceId) return;
    let task_type =
      diligence.status === diligenceStatusConstant.Completed ||
      diligence.status === diligenceStatusConstant.Evaluation
        ? TaskType.Evaluation
        : TaskType.Inreview;
    return this.question
      .getCategoriesList(
        diligenceId,
        task_type,
        filterStatus,
        searchQuery,
        selectedRatingScheme
      )
      .pipe(
        tap((res: SectionResponseType) => {
          let categoryData = {};
          let allSections = [];
          let firstCatId = null;
          let destination_index = 0;
          res.data
            .filter((cat: any) => cat.attributes.isParent)
            .map((val, index) => {
              if (!firstCatId) firstCatId = val.id;
              categoryData[val.id] = {
                ...val.attributes,
                isOpen: subCatId ? false : index === 0,
                isCatSelected: false,
                label: `${val.attributes.name}`,
                list: {},
                destination_index,
              };
              destination_index++;
              const subCats = res.data.filter(
                (subCat: any) =>
                  !subCat.attributes.isParent &&
                  subCat.attributes.parentID === val.id
              );
              allSections.push(...subCats);
            });
          destination_index = 0;
          let count = 0;
          allSections.forEach((sec) => {
            sec.attributes.previous_question_count = count;
            count =
              sec.attributes.question_counts +
              sec.attributes.previous_question_count;
          });
          res.data
            .filter((cat: any) => !cat.attributes.isParent)
            .map((val: any) => {
              categoryData[val.attributes.parentID].list[val.id] = {
                ...val.attributes,
                isSelected: false,
                label: `${val.attributes.name}`,
                assignedUser: { attributes: { assigned_to: null } },
                status: '',
                destination_index,
                previous_question_count: allSections.find(
                  (sec) => sec.id == val.id
                )?.attributes?.previous_question_count,
              };
              destination_index++;
              subCatToCatMap = {
                ...subCatToCatMap,
                [val.id]: val.parentID,
              };
            });

          // sanity check for empty subcategories
          let Categories: any = Object.values(categoryData);
          for (let i = 0; i < Categories.length; i++) {
            if (!firstCatId && Object.values(Categories[i].list).length) {
              firstCatId = Categories[i].id;
              break;
            }
          }

          let activeSubCat =
            categoryId &&
            categoryId in categoryData &&
            categoryData[categoryId]['list']
              ? categoryData[categoryId]['list'][
                  Object.values<any>(categoryData[categoryId].list).sort(
                    (a: any, b: any) =>
                      a.destination_index - b.destination_index
                  )[0]?.id
                ]
              : firstCatId && firstCatId in categoryData
              ? categoryData[firstCatId]['list'][
                  Object.values<any>(categoryData[firstCatId].list).sort(
                    (a: any, b: any) =>
                      a.destination_index - b.destination_index
                  )[0]?.id
                ]
              : null;
          if (categoryId && categoryId in categoryData && subCatId) {
            activeSubCat =
              categoryData[categoryId]['list'][
                Object.keys(categoryData[categoryId].list).find(
                  (key) => key == subCatId
                )
              ];
          }
          if (categoryId && categoryId in categoryData) {
            categoryData[categoryId].isOpen = true;
          } else if (firstCatId && firstCatId in categoryData)
            categoryData[firstCatId].isOpen = true;
          patchState({
            error: null,
            categoryLoading: false,
            allSections,
            categories: categoryData,
            activeSection: {
              label: activeSubCat?.label,
              id: activeSubCat?.id,
              data: activeSubCat,
            },
          });
        }),
        catchError((error) => {
          patchState({
            error: null,
            categoryLoading: false,
          });
          throw new Error(error);
        })
      );
  }

  @Action(GetQuestionData)
  GetQuestionData(
    { getState, patchState }: StateContext<QuestionnaireModel>,
    { activeSectionParam }: any
  ) {
    patchState({
      error: null,
    });
    let {
      categories,
      activeSection,
      subCatToCatMap,
      questions,
      attachmentMap,
      filterStatus,
      nestedQuestionMap,
      searchQuery,
      selectedRatingScheme,
      rating_scheme_default,
      parentQuestionCount,
      draftData,
    } = JSON.parse(JSON.stringify(getState()));

    let diligence = getState().diligence;
    if (!activeSection?.id) return;
    if (!Object.keys(categories).length) return;
    if (activeSectionParam) activeSection = activeSectionParam;
    const { currentUser } = this.store.selectSnapshot((state) => state.user);
    if (
      diligence.status === diligenceStatusConstant.InReview ||
      ((currentUser?.isInvestor || diligence.is_internal) &&
        diligence.status === diligenceStatusConstant.Evaluation) ||
      (diligence.diligence_type === DiligenceTypeEnum.dd_profile &&
        diligence.status === diligenceStatusConstant.Started)
    )
      this.store.dispatch(
        new getReviewAssignments(diligence.id, activeSection.id)
      );
    let task_type =
      diligence.status === diligenceStatusConstant.Completed ||
      diligence.status === diligenceStatusConstant.Evaluation
        ? TaskType.Evaluation
        : TaskType.Inreview;
    return this.question
      .getQuestionData(
        getState().diligenceId,
        activeSection.id,
        task_type,
        filterStatus,
        searchQuery,
        selectedRatingScheme,
        rating_scheme_default
      )
      .pipe(
        tap((res: QuestionRootType) => {
          let categoryID = res.data[0].attributes.parentID;
          const questionResponse = res as QuestionRootType;
          let assignedUsers = {};
          let assignedUsersSubCat = {};
          let questionMap = {};
          let ratingMap = {};
          let questionIndex = 0;
          let sequenceID = Number(Math.random().toFixed(10));
          let nestAdjencyList = {};
          let allNestedQuestionID = new Set();
          let localQuestionMap = {};
          let localNestedQuestionMap = {};
          let sequenceMap = {};
          let ratingVerify = {};
          // let responseVerifier = {};
          // let sectionVerifier = {};
          let sectionFilterCounter: any = {};

          // creating sequence map
          questionResponse.included
            .filter((item) => item.type === 'sequences')
            .forEach((sequence) => (sequenceMap[sequence.id] = {}));

          questionResponse.included.map((question) => {
            if (question.type === 'questions') {
              sectionFilterCounter = {
                ...sectionFilterCounter,
                [question.id]: {
                  unresolvedComments: 0,
                },
              };

              if (
                question.attributes.responseType == ResponseType.Attachment &&
                !question.attributes.text?.includes('(click)') &&
                question.attributes.text?.includes('data-ng-click')
              ) {
                question.attributes.text = question.attributes.text
                  .replace('data-ng-click', '(click)')
                  .replace('vm.', '');
                let localText = question.attributes.text.split('<a');
                localText[1] = `id="attachmentUrl" ` + localText[1];
                question.attributes.text = `${localText[0]} <a ${localText[1]}`;
              }

              question.attributes['icons'] = {
                leftIcons: [],
                rightIcons: [],
                leftLinks: [],
                rightLinks: [],
              };
              questionMap[question.attributes.sectionID] = {
                ...questionMap[question.attributes.sectionID],
                [question.id]: {
                  type: question.type,
                  id: question.id,
                  index: question.attributes.isNested ? -1 : questionIndex,
                  isValid: false,
                  showComment: false,
                  sequenceID: null,
                  isSequence: false,
                  ...question.attributes,
                  nestedQuestions: [],
                  assignedUser: {
                    attributes: {
                      assigned_to: null,
                    },
                  },
                  uniqueQuestionId: `UID:${
                    question.id
                  }:${new Date().getTime()}`, // This is the Unique ID for each question used to bind resolve all comments in ckeditor side-panel
                  answer: {
                    attributes: DefaultQuestionState(),
                  },
                },
              };

              UpdateLocalQuestionState(
                questionMap[question.attributes.sectionID][question.id].answer,
                this.dvDatePipe
              );

              if (!question.attributes.isNested) questionIndex += 1;
            }
            if (question.type === 'nestingrules') {
              localNestedQuestionMap[question.attributes.nestedQuestionId] =
                question.attributes.questionID;
              if (question.attributes.questionID in nestAdjencyList)
                nestAdjencyList[question.attributes.questionID].push({
                  operatorID: question.attributes.operatorID,
                  value: question.attributes.value,
                  nestedID: question.attributes.nestedQuestionId,
                });
              else
                nestAdjencyList[question.attributes.questionID] = [
                  {
                    operatorID: question.attributes.operatorID,
                    value: question.attributes.value,
                    nestedID: question.attributes.nestedQuestionId,
                  },
                ];
              allNestedQuestionID.add(question.attributes.nestedQuestionId);
            }
            if (question.type === 'section_rating_mapping')
              ratingMap = {
                [question.attributes.section_id]: {
                  ...ratingMap[question.attributes.section_id],
                  ...question.attributes,
                },
              };

            if (question.type === 'sequences' && sequenceID % 1)
              sequenceID = question.id;
          });
          questionResponse.included.map((question) => {
            if (question.type === 'responses') {
              if (question.attributes.response_unresolved_comments_counts > 0) {
                let { questionID, response_unresolved_comments_counts } =
                  question.attributes;
                sectionFilterCounter[questionID].unresolvedComments =
                  response_unresolved_comments_counts;
              }
              let id = `${question.attributes.sequenceID}-${question.attributes.sectionId}-${question.attributes.questionID}`;
              if (draftData && id in draftData)
                question.attributes = {
                  ...question.attributes,
                  ...draftData[id]?.response?.response,
                };
              UpdateLocalQuestionState(question, this.dvDatePipe);
              if (
                !questionMap[question.attributes.sectionId][
                  question.attributes.questionID
                ].sequenceID &&
                question.attributes.sequenceID == sequenceID
              ) {
                questionMap[question.attributes.sectionId] = {
                  ...questionMap[question.attributes.sectionId],
                  [question.attributes.questionID]: {
                    ...questionMap[question.attributes.sectionId][
                      question.attributes.questionID
                    ],
                    sequenceID: question.attributes.sequenceID,
                    answer: question,
                    showComment:
                      !NoCommentResponseTypes.includes(
                        question.attributes.response_type as ResponseType
                      ) && !!question.attributes.textResponse,
                  },
                };
              }
              localQuestionMap[id] = LocalQuestionMapHelper(question);
              // creating sequence Map
              sequenceMap[question.attributes.sequenceID] = {
                ...sequenceMap[question.attributes.sequenceID],
                responses: {
                  ...sequenceMap[question.attributes.sequenceID]?.responses,
                  [question.attributes.questionID]: question,
                },
              };
            }

            if (question.type === 'question_assignments') {
              assignedUsers = {
                ...assignedUsers,
                [question.attributes.entity_id]: {
                  assignedUser: question,
                },
              };
            }
            if (question.type === 'attachments') {
              attachmentMap = {
                ...attachmentMap,
                [question.id]: question['attributes'],
              };
            }
            if (
              question.type === 'question_rating_mapping' &&
              questionMap &&
              questionMap[question.attributes.section_id] &&
              questionMap[question.attributes.section_id][
                question.attributes.question_id
              ]
            ) {
              questionMap[question.attributes.section_id] = {
                ...questionMap[question.attributes.section_id],
                [question.attributes.question_id]: {
                  ...questionMap[question.attributes.section_id][
                    question.attributes.question_id
                  ],
                  questionRating: { ...question.attributes, assignments: null },
                },
              };
            }
            if (question.type == 'question_rating_verify') {
              ratingVerify[question.attributes.entity_id] = question.attributes;
            }

            if (question.type === 'section_assignments') {
              assignedUsersSubCat = {
                ...assignedUsersSubCat,
                [question.attributes.entity_id]: {
                  assignedUser: question,
                },
              };
            }
          });
          // Updating rating at category level
          Object.keys(ratingMap).forEach((sectionId) => {
            categories[categoryID].list[sectionId].sectionRating =
              ratingMap[sectionId];
          });

          // Updating assigned user at question level
          Object.keys(questionMap).map((section) => {
            Object.keys(questionMap[section]).map((question) => {
              if (Number(question) in assignedUsers) {
                questionMap[section][question] = {
                  ...questionMap[section][question],
                  assignedUser: assignedUsers[question]['assignedUser'],
                };
              }
            });
          });

          // Updating and setting the sequence ID
          Object.keys(questionMap).map((section) => {
            Object.keys(questionMap[section]).map((question) => {
              if (!questionMap[section][question].sequenceID) {
                questionMap[section][question] = {
                  ...questionMap[section][question],
                  sequenceID,
                };
                if (questionMap[section][question].answer)
                  localQuestionMap[
                    `${sequenceID}-${questionMap[section][question].sectionID}-${questionMap[section][question].id}`
                  ] = LocalQuestionMapHelper(
                    questionMap[section][question].answer
                  );
              }
            });
          });

          // Updating assigned user at category level
          Object.keys(assignedUsersSubCat).map((entity) => {
            categories[categoryID].list[entity] = {
              ...categories[categoryID].list[entity],
              ...assignedUsersSubCat[entity],
            };
          });

          // Updating nested question
          Object.keys(nestAdjencyList).map((key) => {
            if (key in questionMap[activeSection.id])
              nestAdjencyList[key].map(({ operatorID, value, nestedID }) => {
                questionMap[activeSection.id][nestedID].parentQuestionId = key;
                questionMap[activeSection.id][key].nestedQuestions.push({
                  operatorID,
                  value,
                  nestedID: questionMap[activeSection.id][nestedID],
                });
              });
          });
          Array.from(allNestedQuestionID).map((ids) => {
            delete questionMap[activeSection.id][ids];
          });
          nestedQuestionMap = { ...localNestedQuestionMap };
          if (!questions) questions = {};
          questions[activeSection.id] = questionMap[activeSection.id];
          parentQuestionCount[activeSection.id] = questions[activeSection.id]
            ? Object.keys(questions[activeSection.id]).length
            : 0;
          patchState({
            error: null,
            categories: JSON.parse(JSON.stringify(categories)),
            questions,
            subCatToCatMap,
            attachmentMap,
            localQuestionMap,
            nestedQuestionMap,
            sequenceMap,
            parentQuestionCount,
            sectionFilterCounter,
          });
          let category: any = getState().categories[categoryID];
          let section = JSON.parse(
            JSON.stringify(category.list[activeSection.id])
          );
          section.status = res.data[0].attributes.section_status;
          this.store.dispatch(
            new UpdateSubCatData(
              {
                data: section,
                id: section.id,
                label: section.label,
              },
              section
            )
          );
          this.store.dispatch(new GetTrackChanges());
        })
      );
  }

  @Action(UpdateLocalQuestionMap)
  UpdateLocalQuestionMap(
    { patchState, getState }: StateContext<QuestionnaireModel>,
    { id, params }
  ) {
    const localMap = {
      ...getState().localQuestionMap,
    };
    localMap[id] = {
      ...localMap[id],
      ...params,
    };
    patchState({
      localQuestionMap: localMap,
    });
  }

  @Action(DeleteLocalQuestionMap)
  DeleteLocalQuestionMap(
    { patchState, getState }: StateContext<QuestionnaireModel>,
    { id }
  ) {
    const localMap = JSON.parse(JSON.stringify(getState().localQuestionMap));
    delete localMap[id];
    patchState({
      localQuestionMap: localMap,
    });
  }

  @Action(UpdateIds)
  UpdateIds({ patchState }: StateContext<QuestionnaireModel>, { params }) {
    let subCatId = null;
    if (params['#']) subCatId = +params['#'].split('child_section_')[1];
    patchState({
      fromfirmId: +params.fromfirmId,
      tofirmId: +params.tofirmId,
      fundId: +params.fundId,
      diligenceId: +params.diligenceId,
      categoryId: +params.categoryId,
      subCatId: subCatId,
      error: null,
      filterStatus: params?.status,
      searchQuery: params?.q,
      questionId: params?.questionId,
      isSequenceIdInRoute: params['questionId']?.includes('-') ?? false,
    });
  }

  @Action(UpdateDiligenceData)
  UpdateDiligenceData(
    { getState, patchState }: StateContext<QuestionnaireModel>,
    { data }
  ) {
    let localDiligenceData = JSON.parse(JSON.stringify(getState().diligence));
    localDiligenceData = { ...localDiligenceData, ...data };
    const { currentUser } = this.store.selectSnapshot((state) => state.user);
    patchState({
      diligence: JSON.parse(
        JSON.stringify(updateDiligenceData(localDiligenceData, currentUser))
      ),
      error: null,
    });
    this.store.dispatch(new GetMyFunctions(localDiligenceData.id));
  }
  @Action(DeleteCategoryData)
  DeleteCategoryData({
    getState,
    patchState,
  }: StateContext<QuestionnaireModel>) {
    patchState({
      fromfirmId: null,
      tofirmId: null,
      fundId: null,
      diligenceId: null,
      subCatToCatMap: null,
      categoryId: null,
      subCatId: null,
      activeSection: null,
      questionCounts: null,
      countLoader: false,
      error: null,
      diligenceLoader: false,
      diligence: null,
      categories: null,
      questions: null,
      draftData: null,
      activePanelId: null,
      attachmentMap: null,
      filterStatus: 'default',
      localQuestionMap: null,
      nestedQuestionMap: null,
      sequenceMap: null,
      searchQuery: null,
      colorData: null,
      selectedRatingScheme: null,
      rating_scheme_default: null,
      reviewMappingsData: null,
      silentReload: null,
      localGridMap: {},
      customFieldDatamap: null,
      questionUserRoles: null,
      questionId: null,
      functionAssignment: null,
      responseHistory: null,
      followups: null,
      parentQuestionCount: {},
      reviewStatus: null,
      categoryLoading: false,
      sequenceSectionQuestionMap: {},
      introModalShown: false,
      sectionFilterCounter: null,
      isDraftSave: null,
      allSections: null,
      responseTypeFromPanel: null,
      assignments: null,
      entityScoreRules: null,
      templateQuestions: null,
      questionOptions: null,
      reviewers: new Map<number, string>(),
      isReviewersVisible: false,
    });
  }

  @Action(UpdateActiveSection)
  UpdateActiveSection(
    { patchState, getState }: StateContext<QuestionnaireModel>,
    { data }
  ) {
    let { categoryId, filterStatus, searchQuery, categories } = JSON.parse(
      JSON.stringify(getState())
    );
    const currRoute = this.router.getState()._routerState.url;
    this.angularRouter.navigate(
      [
        currRoute.split('questionnaire')[0] +
          '/questionnaire' +
          `/category/` +
          (data.data.parentID ? data.data.parentID : categoryId),
      ],
      {
        fragment: `child_section_${data.id}`,
        queryParams: {
          status: filterStatus,
          q: searchQuery,
        },
      }
    );
    this.store.dispatch(new UpdateActivePanelId(''));
    this.sidePanelService.close();
    this.store.dispatch(new SidePanelUpdate(null));
    let catId = data?.data?.parentID ? data.data.parentID : categoryId;
    categories[catId].isOpen = true;
    this.comment.clearMultiTextData();
    patchState({
      activeSection: data,
      categoryId: catId,
      categories,
    });
  }

  @Action(PatchActiveSection)
  PatchActiveSection(
    { patchState, getState }: StateContext<QuestionnaireModel>,
    { data }
  ) {
    patchState({
      activeSection: data,
    });
  }

  @Action(DeleteActiveSection)
  DeleteActiveSection({
    patchState,
    getState,
  }: StateContext<QuestionnaireModel>) {
    patchState({
      activeSection: null,
      draftData: null,
    });
  }

  @Action(UpdateCategory)
  UpdateCategory(
    { getState, patchState }: StateContext<QuestionnaireModel>,
    { data }
  ) {
    let catData = JSON.parse(JSON.stringify(getState().categories));
    catData[data.id].isOpen = data.isOpen;
    patchState({
      categories: JSON.parse(JSON.stringify(catData)),
    });
  }
  @Action(UpdateSubCatData)
  UpdateSubCatData(
    { getState, patchState }: StateContext<QuestionnaireModel>,
    { subCat, data }
  ) {
    let catData = JSON.parse(JSON.stringify(getState().categories));
    catData[subCat.data.parentID].list[subCat.id] = {
      ...catData[subCat.data.parentID].list[subCat.id],
      ...data,
    };
    patchState({
      categories: JSON.parse(JSON.stringify(catData)),
    });
  }

  @Action(DeleteDraftQuestionData)
  DeleteDraftQuestionData(
    { getState, patchState }: StateContext<QuestionnaireModel>,
    { ids }
  ) {
    let draftData = JSON.parse(JSON.stringify(getState().draftData));
    let questionmap = JSON.parse(JSON.stringify(getState().localQuestionMap));
    ids.map((id) => draftData && id in draftData && delete draftData[id]);
    ids.map((id) => questionmap && id in questionmap && delete questionmap[id]);
    return patchState({
      draftData,
      localQuestionMap: questionmap,
    });
  }

  @Action(DeleteOnlyDraftQuestionData)
  DeleteOnlyDraftQuestionData(
    { getState, patchState }: StateContext<QuestionnaireModel>,
    { ids }
  ) {
    let draftData = JSON.parse(JSON.stringify(getState().draftData));
    ids.map((id) => draftData && id in draftData && delete draftData[id]);
    return patchState({
      draftData,
    });
  }

  @Action(UpdateDraftData)
  UpdateDraftData(
    { getState, patchState }: StateContext<QuestionnaireModel>,
    { data, isSave = false }
  ) {
    if (!data) {
      if (!isSave) {
        let draft = getState().draftData as any;
        for (let id in draft) {
          if (
            draft[id]?.response?.response?.response_type ==
            ResponseType.DynamicGrid
          ) {
            this.cache.clearGridCacheById(id);
          }
        }
      }
      return patchState({
        draftData: null,
      });
    }
    let draftData = JSON.parse(JSON.stringify(getState().draftData));

    if (
      draftData &&
      data.id in draftData &&
      Object.keys(draftData[data.id]).length
    ) {
      if (data.type in draftData[data.id] && data?.isError) {
        delete draftData[data.id][data.type];
      } else if (
        data.type in draftData[data.id] &&
        data?.isError === undefined &&
        !data?.api?.response?.response?.is_NA
      ) {
        delete draftData[data.id][data.type];
      } else {
        draftData[data.id] = { ...draftData[data.id], ...data.api };
      }
    } else if (data?.isError) return;
    else {
      draftData = { ...draftData, [data.id]: data.api };
    }
    return patchState({
      draftData,
    });
  }

  @Action(UpdateActivePanelId)
  UpdateActivePanelId(
    { patchState }: StateContext<QuestionnaireModel>,
    { id }: any
  ) {
    patchState({
      activePanelId: id,
    });
  }

  @Action(GetSequenceId)
  GetSequenceId(
    { getState, patchState }: StateContext<QuestionnaireModel>,
    { id }: any
  ) {
    const questionMap = JSON.parse(JSON.stringify(getState().questions));
    Object.keys(questionMap).map((section) => {
      Object.keys(questionMap[section]).map((question) => {
        if (!questionMap[section][question].sequenceID)
          questionMap[section][question] = {
            sequenceID: id,
            ...questionMap[section][question],
          };
      });
      patchState({
        questions: questionMap,
      });
    });
  }

  @Action(UpdateAttachmentMap)
  UpdateAttachmentMap(
    { getState, patchState }: StateContext<QuestionnaireModel>,
    { data }: any
  ) {
    let attachmentMap = JSON.parse(JSON.stringify(getState().attachmentMap));
    attachmentMap = { ...attachmentMap, ...data };
    patchState({
      attachmentMap,
    });
  }

  @Action(UpdateFilterMap)
  UpdateFilterMap(
    { getState, patchState }: StateContext<QuestionnaireModel>,
    { filterStatus }: any
  ) {
    const currRoute = this.router.getState()._routerState.url;
    let url = currRoute.split('#')[0];
    if (url.includes('?')) {
      url = url.split('?')[0];
    }
    let fragment = currRoute.split('#')[1];
    this.angularRouter.navigate([url], {
      fragment,
      queryParams: {
        status: filterStatus === 'default' ? null : filterStatus,
        q: null,
      },
    });

    patchState({
      filterStatus,
      searchQuery: null,
      categoryId: null,
      subCatId: null,
    });
  }
  @Action(UpdateColorData)
  UpdateSectionData(
    { getState, patchState }: StateContext<QuestionnaireModel>,
    { data }: any
  ) {
    patchState({
      colorData: data,
    });
  }

  @Action(UpdateSearchQuery)
  UpdateSearchQuery(
    { getState, patchState }: StateContext<QuestionnaireModel>,
    { search, filterType }: any
  ) {
    let filterStatus = null;
    let searchQuery = null;

    const currRoute = this.router.getState()._routerState.url;
    let url = currRoute.split('#')[0];
    if (url.includes('?')) {
      url = url.split('?')[0];
    }
    let fragment = currRoute.split('#')[1];

    if (search) {
      filterStatus = filterType;
      searchQuery = search;
      this.angularRouter.navigate([url], {
        fragment,
        queryParams: {
          status: filterStatus,
          q: searchQuery,
        },
      });
    } else {
      searchQuery = null;
      this.angularRouter.navigate([url], {
        fragment,
        queryParams: {
          status: null,
          q: null,
        },
      });
    }
    patchState({
      searchQuery,
      filterStatus,
    });
  }

  @Action(GetRatingScheme)
  GetRatingScheme({ getState, patchState }: StateContext<QuestionnaireModel>) {
    const diligence = JSON.parse(JSON.stringify(getState().diligence));
    let selectedRatingScheme;
    this.question
      .getTemplateRatingSchemeMapping(
        diligence.template_id,
        diligence.template_version
      )
      .subscribe((res: RatingSchemeMappingType[]) => {
        if (res.length) {
          let rating_scheme_default;
          this.question
            .getRatingSchemeDefaults(diligence.id)
            .subscribe(async (ratingScheme: any) => {
              rating_scheme_default = ratingScheme;

              if (!ratingScheme && canSetDefaultRating(this.store)) {
                await this.question
                  .updateDefaultRatingScheme({
                    rating_scheme_id: res[0].rating_scheme_id,
                    entity_id: diligence.id,
                    entity_type: 'Duediligence',
                  })
                  .toPromise()
                  .then((res) => {
                    ratingScheme = res;
                  });
              }
              if (
                (ratingScheme &&
                  ratingScheme.rating_scheme_id == res[0].rating_scheme_id) ||
                !ratingScheme
              ) {
                selectedRatingScheme = res[0];
                this.question
                  .getRatingScaleDef(
                    res[0].rating_scale_id,
                    res[0].rating_scale_version
                  )
                  .subscribe((res: RatingScaleDefType[]) => {
                    if (ratingScheme?.rating_scheme_id)
                      this.store.dispatch(
                        new getCustomFieldDatamap({
                          entity_id: ratingScheme?.rating_scheme_id,
                          schema_type: 'rating',
                        })
                      );
                    this.store.dispatch(new UpdateColorData(res));
                  });
              } else {
                selectedRatingScheme = null;
              }
              patchState({
                selectedRatingScheme,
                rating_scheme_default,
              });
            });
        }
      });
  }

  @Action(DeleteQuestionData)
  DeleteQuestionData(
    { getState, patchState }: StateContext<QuestionnaireModel>,
    { sectionId, question }: any
  ) {
    const questionMap = JSON.parse(JSON.stringify(getState().questions));
    return this.question.deleteQuestionResponse(question.answer.id).pipe(
      tap((res: SectionResponseType) => {
        let draftData = JSON.parse(JSON.stringify(getState().draftData));
        const id = `${question.sequenceID}-${question.sectionID}-${question.id}`;
        draftData && delete draftData[id];
        let defaultQuestionState = {
          assignedUser: {
            attributes: {
              assigned_to: null,
            },
          },
          answer: {
            attributes: DefaultQuestionState(),
          },
        };
        let localGridMap = { ...getState().localGridMap };
        if (
          question.responseType == ResponseType.Grid ||
          question.responseType == ResponseType.DynamicGrid
        ) {
          localGridMap[id] = {};
        }

        if (
          question?.parentQuestionId &&
          !(question?.parentQuestionId in questionMap[sectionId])
        ) {
          getParentNestedQuestion(questionMap, sectionId, question);
        } else if (question?.parentQuestionId) {
          questionMap[sectionId][
            question?.parentQuestionId
          ].nestedQuestions.forEach((nested) => {
            if (nested.nestedID.id === question.id) {
              nested.nestedID = {
                ...nested.nestedID,
                answer: {
                  attributes: DefaultQuestionState(),
                },
                showComment: false,
              };
            }
          });
        } else {
          questionMap[sectionId][question.id] = {
            ...questionMap[sectionId][question.id],
            answer: {
              attributes: DefaultQuestionState(),
            },
            showComment: false,
          };
        }

        patchState({
          questions: questionMap,
          draftData,
          localGridMap,
        });
      })
    );
  }

  @Action(UpdateQuestionData)
  UpdateQuestionData(
    { getState, patchState }: StateContext<QuestionnaireModel>,
    { catID, sectionId, question }: any
  ) {
    const questionMap = JSON.parse(JSON.stringify(getState().questions));
    questionMap[sectionId][question.id] = {
      ...questionMap[sectionId][question.id],
      ...question,
    };
    patchState({
      questions: questionMap,
    });
  }

  @Action(UpdateSectionFilterCounter)
  UpdateSectionFilterCounter(
    { getState, patchState }: StateContext<QuestionnaireModel>,
    { sectionFilterCounter }: any
  ) {
    patchState({
      sectionFilterCounter: JSON.parse(JSON.stringify(sectionFilterCounter)),
    });
  }

  @Action(GetReviewMappingsData)
  GetReviewMappingsData({
    getState,
    patchState,
  }: StateContext<QuestionnaireModel>) {
    return this.question.getReviewMappingsData(getState().diligenceId).pipe(
      tap((data: ReviewMappingsData) => {
        if (data?.question_mappings) {
          data.question_mappings.forEach((questionMapping) => {
            questionMapping?.mapped_questions.forEach(
              (mappedQuestion) =>
                (mappedQuestion.template_id =
                  questionMapping.mapped_template_id)
            );
          });
        }
        patchState({ reviewMappingsData: data });
      })
    );
  }

  @Action(TriggerSilentReload)
  TriggerSilentReload(
    { patchState }: StateContext<QuestionnaireModel>,
    { silentReload, closeSidePanel }
  ) {
    if (closeSidePanel) {
      this.sidePanelService.close();
      this.store.dispatch(new UpdateActivePanelId(''));
    }
    this.store.dispatch(new GetDiligenceData()).subscribe(() => {
      return patchState({
        silentReload,
      });
    });
  }

  @Action(UpdateLocalGridMap)
  UpdateLocalGridMap(
    { patchState }: StateContext<QuestionnaireModel>,
    { localGridMap }
  ) {
    return patchState({
      localGridMap,
    });
  }

  @Action(GetMyFunctions)
  GetMyFunctions(
    { getState, patchState }: StateContext<QuestionnaireModel>,
    { id }: any
  ) {
    let diligenceCopy = JSON.parse(JSON.stringify(getState().diligence));
    if (id)
      return this.question.getMyFunctions(id).subscribe((res: any) => {
        diligenceCopy['myFunction'] = res;
        patchState({
          diligence: diligenceCopy,
        });
      });
  }
  @Action(GetFunctionAssignment)
  GetFunctionAssignment({
    getState,
    patchState,
  }: StateContext<QuestionnaireModel>) {
    let diligence = JSON.parse(JSON.stringify(getState().diligence));
    let params: { entity_type: any; entity_id: any };
    if (diligence.entity_type == 'Review')
      params = {
        entity_type: 'Duediligence',
        entity_id: diligence.id,
      };
    else
      params = {
        entity_type: diligence.entity_type,
        entity_id: diligence.entity_id,
      };
    this.question.getFunctionAssignment(params).subscribe((res: any) => {
      patchState({
        functionAssignment: res,
      });
    });
  }

  @Action(getCustomFieldDatamap)
  getCustomFieldDataMap(
    { getState, patchState }: StateContext<QuestionnaireModel>,
    { param }: any
  ) {
    return this.question
      .getRatings(param)
      .pipe(tap((res: any) => patchState({ customFieldDatamap: res })));
  }

  @Action(GetSubSectionData)
  getSubSectionData({
    getState,
    patchState,
  }: StateContext<QuestionnaireModel>) {
    let {
      activeSection,
      filterStatus,
      searchQuery,
      selectedRatingScheme,
      rating_scheme_default,
    } = JSON.parse(JSON.stringify(getState()));
    if (!activeSection?.id) return;
    let task_type =
      getState().diligence.status === diligenceStatusConstant.Completed ||
      getState().diligence.status === diligenceStatusConstant.Evaluation
        ? TaskType.Evaluation
        : TaskType.Inreview;
    return this.question
      .getQuestionData(
        getState().diligenceId,
        activeSection.id,
        task_type,
        filterStatus,
        searchQuery,
        selectedRatingScheme,
        rating_scheme_default
      )
      .pipe(
        tap((res: any) => {
          let verifier = res.included.find((x) => x.type === 'section_verify');
          if (!verifier) return;
          res.data[0].attributes['status'] =
            res.data[0].attributes.section_status;
          res.data[0].attributes['verifier'] = [verifier.attributes];
          this.store.dispatch(
            new UpdateSubCatData(activeSection, res.data[0].attributes)
          );
        })
      );
  }

  @Action(GetTrackChanges)
  getTrackChanges({ getState, patchState }: StateContext<QuestionnaireModel>) {
    let { activeSection, diligence } = JSON.parse(JSON.stringify(getState()));
    if (diligence?.status == diligenceStatusConstant.InReview)
      return this.question
        .getResponseTrackChange(diligence.id, activeSection.data.parentID)
        .pipe(
          tap((res) => {
            patchState({
              responseHistory: JSON.parse(JSON.stringify(res)),
            });
          })
        );
  }

  @Action(UpdateSequenceSectionQuestionMap)
  UpdateSequenceSectionQuestionMap(
    { getState, patchState }: StateContext<QuestionnaireModel>,
    { data }
  ) {
    patchState({
      sequenceSectionQuestionMap: data,
    });
  }

  @Action(HandleReviewStatus)
  handleReviewStatus(
    { getState, patchState }: StateContext<QuestionnaireModel>,
    { reviewStatus }: any
  ) {
    let { diligence } = JSON.parse(JSON.stringify(getState()));
    const { currentUser } = this.store.selectSnapshot((state) => state.user);
    if (
      diligence.status === diligenceStatusConstant.InReview ||
      diligence.status === diligenceStatusConstant.Evaluation ||
      (diligence.diligence_type === DiligenceTypeEnum.dd_profile &&
        currentUser.isManager)
    ) {
      patchState({
        reviewStatus: reviewStatus,
      });
    }
  }

  @Action(DeleteReviewMapData)
  DeleteReviewMapData({
    getState,
    patchState,
  }: StateContext<QuestionnaireModel>) {
    patchState({
      reviewCommentDataMap: {},
    });
  }

  @Action(UpdateReviewCommentsData)
  UpdateReviewCommentsData(
    { getState, patchState }: StateContext<QuestionnaireModel>,
    { id, sectionId, questionId, parentQuestionId, data }
  ) {
    const { questions: questionMap, reviewCommentDataMap } = JSON.parse(
      JSON.stringify(getState())
    );
    reviewCommentDataMap[id] = {
      response_comments_counts: data.response_comments_counts,
      response_unresolved_comments_counts:
        data.response_unresolved_comments_counts,
      response_with_notes_attributes: data.editorText.replace(
        ' tox-comment--active',
        ''
      ),
    };
    let question;
    if (parentQuestionId) {
      const nestedQuestionMap = JSON.parse(
        JSON.stringify(getState().nestedQuestionMap)
      );
      question = getNestedQuestionObjectById(
        questionMap,
        nestedQuestionMap,
        sectionId,
        questionId,
        parentQuestionId
      );
    } else {
      question = questionMap[sectionId][questionId];
    }
    question.answer.attributes.response_comments_counts =
      data.response_comments_counts;
    question.answer.attributes.response_unresolved_comments_counts =
      data.response_unresolved_comments_counts;
    question.answer.attributes.response_with_notes_attributes = data.editorText;
    if (data.updateTextResponse) {
      question.answer.attributes.textResponse =
        question.answer.attributes.localTextResponse =
        question.answer.attributes.responseText =
          data.editorText;

      reviewCommentDataMap[id] = {
        ...reviewCommentDataMap[id],
        textResponse: data.editorText.replace(' tox-comment--active', ''),
      };
    }
    // update store with the attributes updated above
    patchState({
      questions: questionMap,
      reviewCommentDataMap,
    });
  }

  @Action(UpdateShownModal)
  updateShownModal(
    { patchState }: StateContext<QuestionnaireModel>,
    { shown }
  ) {
    patchState({
      introModalShown: shown,
    });
  }

  @Action(IsSavingDraft)
  IsSavingDraft(
    { patchState }: StateContext<QuestionnaireModel>,
    { draftData }
  ) {
    patchState({
      isDraftSave: draftData,
    });
  }

  @Action(UpdateBulkLocalQuestionMapQuestionMap)
  UpdateBulkLocalQuestionMapQuestionMap(
    { getState, patchState }: StateContext<QuestionnaireModel>,
    { data }
  ) {
    patchState({
      localQuestionMap: {
        ...getState().localQuestionMap,
        ...JSON.parse(JSON.stringify(data)),
      },
    });
  }

  @Action(SidePanelUpdate)
  SidePanelUpdate(
    { patchState }: StateContext<QuestionnaireModel>,
    { responseTypeFromPanel }
  ) {
    patchState({
      responseTypeFromPanel: JSON.parse(JSON.stringify(responseTypeFromPanel)),
    });
  }

  @Action(getReviewAssignments)
  AssignReviewDefinition(
    { getState, patchState }: StateContext<QuestionnaireModel>,
    { diligenceId, sectionId }: any
  ) {
    let localReviewer = {};
    return this.question.getReviewerForSection({ diligenceId, sectionId }).pipe(
      tap((res: AssignReviewDefinition[]) => {
        res.forEach((reviewer: AssignReviewDefinition) => {
          localReviewer[reviewer.entity_id] = reviewer;
        });
        patchState({
          assignments: localReviewer,
        });
      })
    );
  }

  @Action(updateReviewAssignments)
  updateReviewAssignments(
    { getState, patchState }: StateContext<QuestionnaireModel>,
    { reviewAssignments }: any
  ) {
    let localReviewer = {};

    reviewAssignments.forEach((reviewer: AssignReviewDefinition) => {
      localReviewer[reviewer.entity_id] = reviewer;
    });
    patchState({
      assignments: localReviewer,
    });
  }
  @Action(FilterReload)
  FilterReload({ patchState }: StateContext<QuestionnaireModel>, { reload }) {
    patchState({
      filterReload: reload,
    });
  }

  @Action(ClearCategory)
  ClearCategory({ patchState }: StateContext<QuestionnaireModel>) {
    patchState({
      categories: {},
    });
  }

  @Action(GetEntityScoreRules)
  GetEntityScoreRules({
    getState,
    patchState,
  }: StateContext<QuestionnaireModel>) {
    let state = getState();
    return this.question
      .getEvaluatedScoreRulesByDiligenceId(state.diligence.id)
      .pipe(
        tap((res: any[]) => {
          patchState({
            entityScoreRules: res,
          });
        })
      );
  }

  @Action(SetTemplateQuestions)
  SetTemplateQuestions(
    { patchState }: StateContext<QuestionnaireModel>,
    { templateQuestions }
  ) {
    patchState({
      templateQuestions: JSON.parse(JSON.stringify(templateQuestions)),
    });
  }

  @Action(SetQuestionOptions)
  SetQuestionOptions(
    { patchState }: StateContext<QuestionnaireModel>,
    { questionOptions }
  ) {
    patchState({
      questionOptions: JSON.parse(JSON.stringify(questionOptions)),
    });
  }

  @Action(GetReviewers)
  GetReviewers({ getState, patchState }: StateContext<QuestionnaireModel>) {
    const diligence = getState().diligence;
    const { currentUser } = this.store.selectSnapshot((state) => state.user);
    this.assignmentsService.updateData(diligence, currentUser);
    if (!diligence && !diligence?.id) return;
    return this.assignmentsService.getReviewAssignments(diligence.id).pipe(
      tap((response: Array<any>) => {
        const isReviewersVisible =
          diligence.is_internal ||
          (!(
            currentUser.isInvestor &&
            diligence.status === diligenceStatusConstant.Completed
          ) &&
            !(
              currentUser.isManager &&
              diligence.status === diligenceStatusConstant.Started
            ));

        const reviewers = new Map<number, string>();
        response.forEach((reviewer: any) => {
          if (reviewer.id && !reviewers.has(reviewer.id)) {
            reviewers.set(reviewer.id, reviewer.fullName);
          }
        });

        patchState({
          reviewers: reviewers,
          isReviewersVisible: isReviewersVisible,
        });
      })
    );
  }

  @Action(UpdateSequenceIdInLocalGridMap)
  UpdateSequenceIdInLocalGridMap(
    { getState, patchState }: StateContext<QuestionnaireModel>,
    { updatedSequenceMap }
  ) {
    let localGridMap = { ...(getState().localGridMap ?? {}) };
    for (let sequenceId in updatedSequenceMap) {
      for (let id in localGridMap) {
        let gridIdParts = id?.split('-');
        let gridQuestionSequenceId;
        if (gridIdParts?.length > 0) {
          gridQuestionSequenceId = gridIdParts[0];
        }
        if (sequenceId == gridQuestionSequenceId) {
          gridIdParts[0] = updatedSequenceMap[sequenceId];
          let updatedId = gridIdParts.join('-');
          if (!(updatedId in localGridMap)) {
            localGridMap[updatedId] = localGridMap[id];
          }
        }
      }
    }
    patchState({
      localGridMap,
    });
  }
}
