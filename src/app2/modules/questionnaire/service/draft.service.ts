import { Injectable } from '@angular/core';
import { Store } from '@ngxs/store';
import { forkJoin } from 'rxjs';
import { QuestionnaireService } from 'src/app2/apis/questionnaire/questionnaire.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import {
  DeleteDraftQuestionData,
  GetQuestionCount,
  GetTrackChanges,
  IsSavingDraft,
  UpdateDraftData,
  UpdateLocalQuestionMap,
  UpdateSequenceIdInLocalGridMap,
} from '../store/questionnaire.action';
import {
  deleteMap,
  getAllNestedQuestionResponse,
  getCurrentQuestion,
} from '../util/nested-question.util';
import { UnsupportedResponseTypes } from '../constants/question-status.constant';
import { QuestionAttributeType } from '../types/questions.type';
import { ResponseType } from '../constants/Response-type.constant';
import { CacheUtil } from './cache.service';
import { ErrorHandlerService } from 'src/app2/services/error-handler.service';
import { ReviewCommentsService } from './review-comments.service';
import { ImageDataService } from 'src/app2/services/ImageData/ImageDataService.service';

@Injectable({
  providedIn: 'root',
})
export class DvDraftService {
  sequenceIdMap = {}; // This map is getting used in status.service
  storeSequenceData;
  notesAttributeUpdateMap = {};
  constructor(
    private questionnaire: QuestionnaireService,
    private store: Store,
    private SweetAlert: SweetAlertService,
    private cache: CacheUtil,
    private commentsService: ReviewCommentsService,
    private imageDataService: ImageDataService
  ) {}

  async updateDraftData(apiData, isDraft = false) {
    let apiList = [];
    let questionIDMap = {};
    let isSequenceMap = {};
    let updatedSequenceMap = {};

    this.storeSequenceData = Object.keys(
      this.store.selectSnapshot((state) => state.questionnaire.sequenceMap)
    );
    let triggerReview = false;
    for (let index = 0; index < apiData.length; index++) {
      let params = apiData[index];
      let id = `${params.response.sequenceID}-${params.SectionID}-${params.questionID}`;
      if (params.response?.textResponse?.includes('data:image')) {
        params.response.textResponse =
          await this.imageDataService.asyncReplaceBase64Images(
            params.response.textResponse
          );
      }

      // Sync Suggestions (aka. TrackChanges)
      if (id in this.cache.SUGGESTION_IDS && this.cache.SUGGESTION_IDS[id]) {
        const payload = {
          suggestion_ids: this.cache.SUGGESTION_IDS[id],
        };

        apiList.push(
          this.commentsService.syncSuggestion(
            payload,
            params.duediligence_id,
            params.responseId
          )
        );
      }
      if (!(params.response.sequenceID in this.sequenceIdMap)) {
        this.sequenceIdMap[params.response.sequenceID] =
          params.response.sequenceID;
        if (params.response.sequenceID % 1) {
          try {
            await this.getSequenceId(params.response.sequenceID, params);
            updatedSequenceMap[params.response.sequenceID] =
              this.sequenceIdMap[params.response.sequenceID];
            params.response.sequenceID =
              this.sequenceIdMap[params.response.sequenceID];
          } catch (e) {
            this.showErrorAlert();
            break;
          }
        }
      } else {
        params.response.sequenceID =
          this.sequenceIdMap[params.response.sequenceID];
      }
      isSequenceMap[`${params.questionID}-${params.response.sequenceID}`] =
        params.isSequence;
      delete params.isSequence;
      questionIDMap[params.questionID] = null;
      if (isDraft) params.response.is_WIP = true;
      if (params.bulkResolveComments) {
        const payload = {
          current_comment_ids: [],
        };
        apiList.push(
          this.questionnaire.bulkResolveComments(
            params.duediligence_id,
            params.responseId,
            payload
          )
        );
      }
      delete params.bulkResolveComments;
      delete params.responseId;
      params.response.is_validation_required = false; // No explicit user validation required, once it's valid.
      triggerReview = triggerReview || params.response.trigger_review;
      apiList.push(this.questionnaire.updateQuestionResponse(params));
    }
    let delNestedQuestionAct = this.deleteNestedQuestionResponses(apiData);
    if (Object.keys(updatedSequenceMap).length > 0) {
      this.store.dispatch(
        new UpdateSequenceIdInLocalGridMap(updatedSequenceMap)
      );
    }
    return {
      apiList,
      questionIDMap,
      isSequenceMap,
      delNestedQuestionAct,
      triggerReview,
    };
  }

  async getSequenceId(sequenceID, params) {
    let section = this.store.selectSnapshot(
      (state) => state.questionnaire.activeSection
    );
    let apiparams = {
      duediligence_id: this.store.selectSnapshot(
        (state) => state.questionnaire.diligenceId
      ),
      SectionID: section.id,
    };
    try {
      let res;
      if (!section.data.isMultiple) {
        res = await this.questionnaire
          .updateQuestionSequenceId(apiparams)
          .toPromise();
        this.sequenceIdMap[sequenceID] = res.id;
      } else {
        res = await this.questionnaire
          .createQuestionSequenceId(apiparams)
          .toPromise();
        this.sequenceIdMap[sequenceID] = res.id;
      }
    } catch (error) {
      console.error('Got error while creating sequence id');
      throw new Error('Got error while creating sequence id');
    }
  }

  showErrorAlert() {
    this.SweetAlert.error({
      title: 'Something went wrong',
      text: `Error occured while saving the response please try again.`,
    });
  }

  getDraftCount() {
    let draft = this.store.selectSnapshot(
      (state) => state.questionnaire.draftData
    );
    let questionsCount = 0;
    draft &&
      Object.keys(draft).map((key) => {
        if (Object.values(draft[key]).length) {
          questionsCount += 1;
        }
      });
    return questionsCount;
  }

  getCurrentQuestionDraftStatus(questionKey) {
    let draft = this.store.selectSnapshot(
      (state) => state.questionnaire.draftData
    );
    let isValid = false;
    draft &&
      Object.keys(draft).map((key) => {
        if (questionKey == key) isValid = draft[key];
      });
    return isValid;
  }

  saveCurrentDraftQuestion(questionKey, callback) {
    let draft: any = this.getCurrentQuestionDraftStatus(questionKey);
    if (draft && draft?.response) {
      this.questionnaire
        .updateQuestionResponse(draft.response)
        .subscribe((res) => {
          this.store.dispatch(new DeleteDraftQuestionData([questionKey]));
          callback(res);
        });
    } else callback(null);
  }

  deleteNestedQuestionResponses(apiData) {
    let allSequenceQuestions = this.store.selectSnapshot(
      (state) => state.questionnaire.sequenceSectionQuestionMap
    );
    let deleteRequests = [];
    if (!allSequenceQuestions) return deleteRequests;

    let { questions: questionsState, localQuestionMap } = JSON.parse(
      JSON.stringify(this.store.selectSnapshot((state) => state.questionnaire))
    );

    apiData.forEach((apiRequest) => {
      let { SectionID, questionID, response } = apiRequest;
      let currentQuestion = [];
      let updateSequence = {};
      let nestedQuestionsResponses: any = [];
      if (
        response.sequenceID in allSequenceQuestions &&
        SectionID in allSequenceQuestions[response.sequenceID]
      ) {
        Object.values(allSequenceQuestions[response.sequenceID][SectionID]).map(
          (ques: any) => {
            if (ques.sequenceID == ques.sequenceID) {
              updateSequence[ques.id] = ques;
            }
          }
        );
      }

      questionsState[SectionID] = updateSequence;
      if (questionID in questionsState[SectionID]) {
        currentQuestion = [questionsState[SectionID][questionID]];
      } else {
        Object.values(questionsState[SectionID]).map((ques: any) => {
          if (ques.nestedQuestions?.length) {
            getCurrentQuestion(
              ques.nestedQuestions,
              { id: questionID, sequenceID: response.sequenceID },
              currentQuestion
            );
          }
        });
      }

      if (currentQuestion?.length) {
        currentQuestion = JSON.parse(JSON.stringify(currentQuestion));
        const id = `${currentQuestion[0].sequenceID}-${currentQuestion[0].sectionID}-${currentQuestion[0].id}`;
        currentQuestion[0].answer.attributes = {
          ...currentQuestion[0].answer.attributes,
          ...localQuestionMap[id],
        };
        getAllNestedQuestionResponse(
          currentQuestion[0].nestedQuestions,
          nestedQuestionsResponses,
          SectionID,
          this.store,
          true,
          currentQuestion[0]
        );
      }
      deleteRequests.push(...nestedQuestionsResponses);
    });
    return deleteRequests;
  }

  showCountAlert(
    callback,
    cancelCallBack?,
    title = 'Are you sure you want to leave this page? You have unsaved changes.',
    text = null,
    confirmButtonText = 'Save & Continue',
    cancelButtonText = 'Do not Save'
  ) {
    let count = this.getDraftCount();
    if (!text)
      text = `You have ${count} unsaved change${count > 1 ? 's' : ''}.`;
    let draft = this.store.selectSnapshot(
      (state) => state.questionnaire.draftData
    );
    let apiData = [];
    draft &&
      Object.keys(draft).map((key) => {
        Object.values(draft[key]).map((api: any) => {
          apiData.push(JSON.parse(JSON.stringify(api)));
        });
      });
    if (count)
      this.SweetAlert.confirm({
        title: title,
        text: text,
        confirmButtonText: confirmButtonText,
        cancelButtonText: cancelButtonText,
        showCloseButton: true,
        focusCancel: false,
        showLoaderOnConfirm: true,
        preConfirm: () => {
          return new Promise<void>(async (resolve) => {
            const { apiList, delNestedQuestionAct } =
              await this.updateDraftData(apiData, false);
            forkJoin(apiList).subscribe(
              async (res: any[]) => {
                this.updateReviewNotes(res);
                await forkJoin(
                  delNestedQuestionAct.map((action) =>
                    this.store.dispatch(action)
                  )
                ).toPromise();
                this.getDraftDataForUpdatation(res);
                await this.store.dispatch(new GetTrackChanges()).toPromise();
                this.store.dispatch([
                  new GetQuestionCount(),
                  new UpdateDraftData(null, true),
                ]);
                callback();
                resolve();
              },
              (err) => this.SweetAlert.close()
            );
          });
        },
      }).then((alert) => {
        if (alert.dismiss && alert.dismiss == 'cancel') {
          // when cancel button is clicked
          cancelCallBack();
          this.SweetAlert.close();
        }
      });
    else callback();
  }

  updateReviewNotes(res: QuestionAttributeType[]) {
    let { diligence, diligenceId } = this.store.selectSnapshot(
      (state) => state.questionnaire
    );
    res
      .filter((res) => res) // filter null responses
      .forEach((quesRes) => {
        if (
          quesRes.responseDisplay !== quesRes.response_with_notes_attributes
        ) {
          if (
            !(quesRes.response_type in UnsupportedResponseTypes) &&
            quesRes.response_type != ResponseType.TextMultiLine &&
            (diligence.isReadonlyEditable || diligence.isReadonlyNotEditable)
          ) {
            const id = `${quesRes.sequenceID}-${quesRes.sectionId}-${quesRes.questionID}`;
            // Only make this API calls if editor used is TinyMce
            if (diligence.editor_version === 1) {
              this.questionnaire
                .responseSelectedMarkTextRemove({
                  diligenceId,
                  id: quesRes?.id,
                })
                .subscribe();
              this.notesAttributeUpdateMap[id] = {
                response_with_notes_attributes: null,
                response_comments_counts: 0,
                response_unresolved_comments_counts: 0,
              };
              this.questionnaire
                .responseNoteAttribute(diligence.id, quesRes?.id, {
                  response_with_notes_attributes: quesRes.responseDisplay,
                })
                .subscribe();
            }
          }
        }

        if (diligence.editor_version === 2) {
          // Only execute this if its a CK EDITOR
          if (quesRes.is_NA && quesRes.response_unresolved_comments_counts) {
            // Resolve all the comments if the response is marked as NA
            this.questionnaire
              .responseSelectedMarkTextRemove({
                diligenceId,
                id: quesRes?.id,
              })
              .subscribe();
          }
        }
      });
  }

  getDraftDataForUpdatation(res, isDraft = false) {
    let map: any = {};
    res
      .filter((res) => res) // filter null responses
      .map((response) => {
        const id = `${response.sequenceID}-${response.sectionId}-${response.questionID}`;
        map[id] = response;
        if (this.notesAttributeUpdateMap[id]) {
          map[id] = { ...map[id], ...this.notesAttributeUpdateMap[id] };
        }
        map[id].isDeleted = !response.active;
      });
    map = { ...map, ...JSON.parse(JSON.stringify(deleteMap.nestedMap)) };
    deleteMap.nestedMap = {};
    this.store.dispatch(new IsSavingDraft(map));
  }
}
