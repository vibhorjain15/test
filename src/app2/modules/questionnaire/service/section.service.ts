import { Injectable } from '@angular/core';
import { Store } from '@ngxs/store';
import { ToastrService } from 'ngx-toastr';
import { QuestionnaireService } from 'src/app2/apis/questionnaire/questionnaire.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { responseStatus } from 'src/app2/shared/constants/constant';
import { callbackify } from 'util';
import {
  diligenceStatusConstant,
  trackChangeStatusConstant,
} from '../constants/quick-view-headers.constant';
import {
  GetQuestionCount,
  GetSubSectionData,
  UpdateActiveSection,
  UpdateSubCatData,
} from '../store/questionnaire.action';
import { DiligenceTypeEnum } from '../types/diligence-enum.type';
import { DvDraftService } from './draft.service';
import { SidePanelService } from 'src/app2/services/side-panel.service';

@Injectable({
  providedIn: 'root',
})
export class SectionService {
  sequenceIdMap = {};
  storeSequenceData;
  sectionLevelSequence = null;
  diligence;
  subCatData;
  user;
  trackChangesResponseType = [
    'Attachment',
    'ReturnTable',
    'aumTable',
    'TextMultiLine',
  ];
  constructor(
    private questionnaire: QuestionnaireService,
    private store: Store,
    private readonly SweetAlert: SweetAlertService,
    private draftService: DvDraftService,
    private toast: ToastrService,
    private newModal: CustomModalService,
    private sidePanel: SidePanelService
  ) {}

  updateData(diligence, user, subCatData) {
    this.diligence = diligence;
    this.user = user;
    this.subCatData = subCatData;
  }

  showUnSavedResponseAlert(message) {
    this.SweetAlert.error({
      title: 'You have unsaved responses under this Subcategory',
      text: `Please resolve these before marking this section as ${message}.`,
    });
  }
  showAlertForUnresolvedComments() {
    this.SweetAlert.error({
      title: 'You have unresolved comments',
      text: `Some of your responses have unresolved comments. Please resolve them before marking as reviewed.`,
    });
  }
  showAlertforTrackChanges() {
    this.SweetAlert.error({
      title: 'You have pending tracking changes',
      text: `Some of your responses have pending tracking changes. Please edit these responses and accept or reject the changes before marking them as reviewed.`,
    });
  }

  getResponsesWithDeclinedStatus() {
    let count = 0;
    let localCategories = this.store.selectSnapshot(
      (state) => state.questionnaire.questions
    );
    let response_status_attr = 'response_status';
    if (this.diligence.isReadonlyNotEditable)
      response_status_attr = 'post_response_status';
    let allSectionQuestion = localCategories[this.subCatData.id];
    Object.keys(allSectionQuestion).map((val) => {
      if (allSectionQuestion[val].answer.id) {
        if (
          allSectionQuestion[val].answer.attributes[response_status_attr] ==
          diligenceStatusConstant.ReviewFailed
        ) {
          count++;
        }
      }
    });
    return count;
  }

  handleAssignReviewers(subData, callback) {
    this.newModal.invoke('assign-reviewer', {
      initialState: {
        type: 'Section',
        response: subData,
        success: (response) => {
          callback();
        },
      },
      class: 'modal-xl',
    });
  }

  //TODO:
  checkResponsesHaveTrackChanges() {
    let count = 0;
    let localCategories = this.store.selectSnapshot(
      (state) => state.questionnaire.questions
    );
    let allSectionQuestion = localCategories[this.subCatData.id];
    Object.keys(allSectionQuestion).map((val) => {
      if (allSectionQuestion[val].answer.id) {
        if (
          allSectionQuestion[val].answer.attributes['response_status_attr'] ==
          diligenceStatusConstant.ReviewFailed
        ) {
          count++;
        }
      }
    });
    return count;
  }

  //TODO:
  checkResponsesHaveUnResolvedComments() {
    let count = 0;
    let localCategories = this.store.selectSnapshot(
      (state) => state.questionnaire.questions
    );
    let allSectionQuestion = localCategories[this.subCatData.id];
    Object.keys(allSectionQuestion).map((val) => {
      if (allSectionQuestion[val].answer.id) {
        if (
          allSectionQuestion[val].answer.attributes['response_status_attr'] ==
          diligenceStatusConstant.ReviewFailed
        ) {
          count++;
        }
      }
    });
    return count;
  }

  handleStatusUpdate(section, status, questions, callback, reason?) {
    let params = {
      status: status,
      note: reason,
      reviews: [],
    };

    this.addQuestions(questions, params, status);

    this.questionnaire
      .patchSectionResponse(this.diligence.id, section.id, params)
      .subscribe((res) => {
        this.sidePanel.close();
        this.store.dispatch(new GetQuestionCount());
        if (status === diligenceStatusConstant.ReviewFailed) {
          if (this.diligence.status === diligenceStatusConstant.Evaluation)
            this.toast.success('Responses rejected successfully');
          else this.toast.success('Revision requested successfully');
        } else if (status === diligenceStatusConstant.ReviewPassed)
          this.toast.success('Responses approved successfully');
        callback();
      });
  }

  addQuestions(questions, params, status) {
    questions.forEach((question) => {
      this.checkApproveReject(question.nestedID ?? question, params, status);

      if ((question.nestedID ?? question).nestedQuestions?.length)
        this.addQuestions(
          (question.nestedID ?? question).nestedQuestions,
          params,
          status
        );
    });
  }

  checkApproveReject(question, params, status) {
    if (
      question.answer.attributes.currentReviewer &&
      ((status !== diligenceStatusConstant.InReview &&
        question.icons.rightIcons.find((x) => x.key === 'approve')) ||
        (status === diligenceStatusConstant.InReview &&
          question.icons.rightLinks.find((x) => x.key === 'undo')))
    ) {
      params['reviews'].push({
        response_id: question.answer.id,
        review_id: question.answer.attributes.assignments.id,
        review_step_id: question.answer.attributes.activeReviewStep.id,
        review_step_assignment_id:
          question.answer.attributes.currentReviewer.id,
      });
    }
  }

  markedAsReviewed(callback) {
    if (
      this.diligence.isReadonlyEditable &&
      this.checkResponsesHaveTrackChanges()
    ) {
      this.showAlertforTrackChanges();
    } else if (
      this.diligence.isReadonlyEditable &&
      this.checkResponsesHaveUnResolvedComments()
    ) {
      this.showAlertForUnresolvedComments();
    } else if (this.draftService.getDraftCount()) {
      this.showUnSavedResponseAlert('reviewed');
    } else {
      callback();
    }
  }

  showRejectDialogue(callback, reject = false) {
    let title =
      'Are you sure you want to request revision(s) for all your assigned responses in this sub-category?';
    let text = '';
    if (reject) {
      title =
        'Provide a reason for rejecting all the responses in this sub-category';
      if (!this.diligence.is_internal)
        text =
          'Please note that rejecting responses is internal to your team and is not visible externally';
    }

    this.SweetAlert.freeInput({
      title: title,
      input: 'textarea',
      text: text,
      icon: 'warning',
      customClass: 'danger',
      reverseButtons: true,
      inputPlaceholder: 'Enter reason for rejecting',
      inputAttributes: {
        'aria-label': 'Reason for rejecting',
        style: 'resize: none',
      },
      showCancelButton: true,
      confirmButtonText:
        'Yes, ' + (reject ? 'Reject Response' : 'Request Revision'),
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        const reason = result.value;
        callback(reason);
      }
    });
  }

  showTrackChangesButtons(responseHistory) {
    let showButton = false;
    let localCategories = this.store.selectSnapshot(
      (state) => state.questionnaire.questions
    );
    let allSectionQuestion = localCategories[this.subCatData.id];
    let localQuestionMap = this.store.selectSnapshot(
      (state) => state.questionnaire.localQuestionMap
    );

    Object.keys(allSectionQuestion).map((key: any) => {
      let question = allSectionQuestion[key];
      let ques =
        localQuestionMap[
          `${question.sequenceID}-${question.sectionID}-${question.id}`
        ];
      if (
        !this.trackChangesResponseType.includes(question.responseType) &&
        question.answer.attributes.response_status ==
          diligenceStatusConstant.ReviewFailed &&
        question.answer.attributes.track_change_status ==
          trackChangeStatusConstant.Started &&
        responseHistory &&
        question.answer.id in responseHistory &&
        !(question?.answer?.attributes?.localis_NA || ques.is_NA)
      ) {
        showButton = true;
      }
    });
    return showButton;
  }

  checkForTrackChanges() {
    let handleTrackChange = false;
    let sequenceMap = this.store.selectSnapshot(
      (state) => state.questionnaire.sequenceMap
    );
    let activeSection = JSON.parse(
      JSON.stringify(
        this.store.selectSnapshot((state) => state.questionnaire.activeSection)
      )
    );
    let questions = this.store.selectSnapshot(
      (state) => state.questionnaire.questions[activeSection.id]
    );
    if (sequenceMap)
      Object.values(sequenceMap).forEach((sequence: any) => {
        Object.values(sequence.responses).forEach((response: any) => {
          if (
            response.attributes.response_type == 'TextMultiLine' &&
            response.attributes.textResponse &&
            response.attributes.textResponse.indexOf('<span class="ice') > -1
          )
            handleTrackChange = true;
        });
      });
    if (!handleTrackChange)
      Object.values(questions).forEach((response: any) => {
        if (
          response.responseType == 'TextMultiLine' &&
          response.answer.attributes.textResponse &&
          response.answer.attributes.textResponse.indexOf('<span class="ice') >
            -1
        )
          handleTrackChange = true;
      });

    return handleTrackChange;
  }
}
