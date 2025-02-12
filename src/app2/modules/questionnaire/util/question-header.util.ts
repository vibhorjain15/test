import { DiligenceType } from 'src/app2/apis/questionnaire/type/diligence.type';
import { diligenceStatusConstant } from '../constants/quick-view-headers.constant';
import { StateDiligenceUpdateType } from '../store/questionnaire.modal';
import { DiligenceTypeEnum } from '../types/diligence-enum.type';

export const getQuestionHeaderDropdownList = (
  userType,
  is_freeSubscription: boolean,
  is_admin: boolean,
  canStartReview: boolean,
  reviewStartedForUser: boolean,
  diligence: DiligenceType & StateDiligenceUpdateType,
  firmPreference: any,
  addedDisclaimer: any,
  reviewers: any,
  currentUser: any
) => {
  const list: any = [];
  if (userType == 'manager') {
    list.push({
      label: 'Print / Preview',
      key: 'printPreview',
      params: '^.print_preview',
    });
    list.push({
      key: 'divider',
    });
    if (
      diligence.is_internal &&
      diligence.template_firm_id == currentUser.firmInfo.id
    ) {
      list.push({
        label: 'Modify Questionnaire',
        key: 'modifyQuestionnaire',
      });
      list.push({
        key: 'divider',
      });
    }
    if (!(diligence.isLocked || diligence.isReadOnly) && is_freeSubscription) {
      list.push({
        label: addedDisclaimer?.id > 0 ? 'Update Disclaimer' : 'Add Disclaimer',
        key: 'addDisclaimer',
      });
      list.push({
        key: 'divider',
      });
    }
    if (
      diligence.review_allowed &&
      !diligence.isLocked &&
      diligence.status !== diligenceStatusConstant.Evaluation &&
      diligence.status !== diligenceStatusConstant.InReview &&
      !diligence.alwaysOpen &&
      !(diligence.review_mandatory && canStartReview)
    ) {
      list.push({
        label: `${canStartReview ? 'Disable' : 'Enable'} Review Mode`,
        key: 'reviewWorkflow',
        tooltip: `${
          canStartReview
            ? ''
            : 'Assign or copy reviewers who can edit, comment, approve, or request revisions.'
        }`,
      });
    }
    if (!diligence.isLocked) {
      list.push({
        label: 'Start a Workflow',
        key: 'startWorkflowProcess',
        tooltip:
          'Start a workflow process for your team to complete specific steps.',
      });
      list.push({
        key: 'divider',
      });
    }
    if (!(diligence.isLocked || diligence.isReadOnly) && !is_freeSubscription) {
      list.push({
        label: addedDisclaimer?.id > 0 ? 'Update Disclaimer' : 'Add Disclaimer',
        key: 'addDisclaimer',
      });
      list.push({
        key: 'divider',
      });
    }
    if (
      diligence.is_internal &&
      is_admin &&
      (diligence.status == diligenceStatusConstant.Approved ||
        diligence.status == diligenceStatusConstant.Completed ||
        diligence.status == diligenceStatusConstant.NotApproved)
    ) {
      list.push({
        label: 'Restart Internal Project',
        key: 'restartInternalProject',
      });
    }

    if (
      (!diligence.isLocked &&
        (diligence.status === diligenceStatusConstant.Evaluation ||
          diligence.status === diligenceStatusConstant.InReview) &&
        reviewStartedForUser) ||
      (userType == 'manager' && diligence.alwaysOpen)
    ) {
      list.push({
        label: reviewers.size > 0 ? 'Add Reviewers' : 'Assign Reviewers',
        key: 'assignReviewers',
      });
    }
    if (
      !diligence.isLocked &&
      (diligence.status === diligenceStatusConstant.Evaluation ||
        diligence.status === diligenceStatusConstant.InReview) &&
      reviewStartedForUser &&
      !diligence.alwaysOpen
    ) {
      list.push({
        label: 'Cancel Review',
        key: 'cancelReview',
      });
      list.push({
        key: 'divider',
      });
    }
  }

  if (userType == 'investor' && !diligence.notVisible) {
    if (diligence.alwaysOpen)
      list.push({
        label: 'Auto-fill',
        key: 'autoFill',
      });

    if (
      diligence.review_allowed &&
      !diligence.isLocked &&
      diligence.status !== diligenceStatusConstant.Evaluation &&
      diligence.status !== diligenceStatusConstant.InReview &&
      !diligence.alwaysOpen &&
      !(diligence.review_mandatory && canStartReview)
    ) {
      list.push({
        label: `${canStartReview ? 'Disable' : 'Enable'} Review Mode`,
        key: 'reviewWorkflow',
        tooltip: `${
          canStartReview
            ? ''
            : 'Assign or copy reviewers who can edit, comment, approve, or request revisions.'
        }`,
      });
    }
    if (!diligence.isLocked) {
      list.push({
        label: 'Start a Workflow',
        key: 'startWorkflowProcess',
        tooltip:
          'Start a workflow process for your team to complete specific steps.',
      });
    }
    list.push({
      key: 'divider',
    });
    list.push({
      label: 'Print / Preview',
      key: 'printPreview',
    });
    list.push({
      key: 'divider',
    });
    if (
      !diligence.isLocked &&
      (diligence.status === diligenceStatusConstant.Evaluation ||
        diligence.status === diligenceStatusConstant.InReview) &&
      reviewStartedForUser &&
      !diligence.alwaysOpen
    ) {
      list.push({
        label: reviewers.size > 0 ? 'Add Reviewers' : 'Assign Reviewers',
        key: 'assignReviewers',
      });
    }
    if (
      !diligence.isLocked &&
      (diligence.status === diligenceStatusConstant.Evaluation ||
        diligence.status === diligenceStatusConstant.InReview) &&
      reviewStartedForUser &&
      !diligence.alwaysOpen
    ) {
      list.push({
        label: 'Cancel Review',
        key: 'cancelReview',
      });
    }
    if (
      diligence.is_internal &&
      diligence.template_firm_id == currentUser.firmInfo.id
    ) {
      list.push({
        label: 'Modify Questionnaire',
        key: 'modifyQuestionnaire',
      });
    }
    if (
      diligence.is_internal &&
      is_admin &&
      (diligence.status == diligenceStatusConstant.Approved ||
        diligence.status == diligenceStatusConstant.Completed ||
        diligence.status == diligenceStatusConstant.NotApproved)
    ) {
      list.push({
        label: 'Restart Internal Project',
        key: 'restartInternalProject',
      });
    }
    if (
      !diligence.is_internal &&
      is_admin &&
      (diligence.status == diligenceStatusConstant.Approved ||
        diligence.status == diligenceStatusConstant.NotApproved)
    ) {
      list.push({
        label: 'Change Status to Completed',
        key: 'changeStatustoCompleted',
      });
    }
    if (
      !diligence.is_internal &&
      is_admin &&
      (diligence.status == diligenceStatusConstant.Approved ||
        diligence.status == diligenceStatusConstant.NotApproved)
    ) {
      list.push({
        label: 'Change Status to Started',
        key: 'changeStatustoStarted',
      });
    }
    if (!diligence.alwaysOpen)
      list.push({
        key: 'divider',
      });

    if (
      diligence.is_internal &&
      diligence.diligence_type != DiligenceTypeEnum.dd_profile &&
      diligence.diligence_type != DiligenceTypeEnum.dd_review &&
      firmPreference.enable_internal_project_to_external_option
    ) {
      list.push({
        label: 'Send to Manager',
        key: 'sendtoManager',
      });
      list.push({
        key: 'divider',
      });
    }
  }

  list.push({
    label: `${diligence.isQuickFilter ? 'Hide' : 'Show'} Filters`,
    key: 'quickFilter',
  });
  list.push({
    label: 'Project Information',
    key: 'templateInfo',
  });
  if (diligence.canDelete) {
    list.push({
      key: 'divider',
    });
    list.push({
      label: 'Delete',
      key: 'delete',
    });
  }
  list.push({
    key: 'divider',
  });
  list.push({
    label: 'Back to All Projects',
    key: 'backtoallprojects',
    params: "app.diligence.projects.activity({type: 'in-progress'})",
  });

  return list;
};

export const canStartReviewHelper = (diligence, currentuser) => {
  if (diligence.is_internal) {
    if (diligence.status == diligenceStatusConstant.Completed)
      return diligence.postsubmission_review_enabled;
    else return diligence.presubmission_review_enabled;
  } else {
    if (currentuser.firmInfo.id == diligence.fromfirm_id)
      return diligence.postsubmission_review_enabled;
    else if (currentuser.firmInfo.id == diligence.tofirm_id)
      return diligence.presubmission_review_enabled;
  }
};

export const reviewStartedForUserHelper = (diligence, currentuser) => {
  if (diligence.is_internal) {
    if (diligence.status == diligenceStatusConstant.InReview)
      return diligence.presubmission_review_enabled;
    else return diligence.postsubmission_review_enabled;
  } else {
    if (currentuser.firmInfo.id == diligence.fromfirm_id)
      return diligence.status == diligenceStatusConstant.Evaluation;
    else if (currentuser.firmInfo.id == diligence.tofirm_id)
      return diligence.status == diligenceStatusConstant.InReview;
  }
};

export const getFinishButtonToolTipText = (mandatorycount, wipCount) => {
  if (wipCount > 0 && mandatorycount > 0)
    return (
      mandatorycount +
      ' Mandatory Question(s) Pending and ' +
      wipCount +
      ' question(s) marked as draft. Please resolve these before submitting.'
    );
  if (wipCount > 0) {
    return (
      'You have ' +
      wipCount +
      ' questions marked as draft. Please unmark these before submitting.'
    );
  }
  if (mandatorycount > 0) {
    return mandatorycount + ' Mandatory Question(s) Pending';
  }
  return '';
};
