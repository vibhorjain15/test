import { DiligenceType } from 'src/app2/apis/questionnaire/type/diligence.type';
import { UtilsService } from 'src/app2/services/utils.service';
import { ColorTheme } from 'src/app2/shared/themes/color.themes';
import { StateDiligenceUpdateType } from '../store/questionnaire.modal';
import { IconTypes } from '../types/card-icons.type';
import { DiligenceTypeEnum } from '../types/diligence-enum.type';
import { QuestionAttributeType } from '../types/questions.type';
import { diligenceStatusConstant } from './quick-view-headers.constant';
import { ResponseType } from './Response-type.constant';
import { getProperTooltip } from 'src/app2/shared/components/ai-text-generator/ai-dropdown.constants';

export const NAOptions = [
  { label: 'Information is not yet available', key: '3' },
  { label: 'This question is not applicable for us', key: '4' },
  { label: 'We do not collect this information', key: '2' },
  { label: 'We do not provide this information', key: '1' },
  { label: 'Other', key: 'other' },
];

export const questionCardIcons = (
  type:
    | 'autofill'
    | 'assign'
    | 'draft'
    | 'na'
    | 'notes'
    | 'followup'
    | 'todo'
    | 'userAssigned'
    | 'addToPreapproved'
    | 'flag'
    | 'standard-text'
    | 'rating'
    | 'calendar'
    | 'userCheck'
    | 'pencil'
    | 'pencil-edit-in-review'
    | 'approve'
    | 'refresh'
    | 'sendForReview'
    | 'mail-forward'
    | 'recommendation'
    | 'remove'
    | 'tableValidation'
    | 'viewRules'
    | 'review-comments'
    | 'submitRevisions'
    | 'edit-after-approve'
    | 'ai'
    | 'ck-comments'
    | 'ban',
  question?: QuestionAttributeType,
  diligence?: DiligenceType & StateDiligenceUpdateType,
  util?: UtilsService,
  isInvestor?: any,
  draftData?: any,
  isError?: any
): IconTypes => {
  let isResponseUnsubmitted = false;
  if (
    question?.answer?.id &&
    isInvestor &&
    [
      diligenceStatusConstant.Completed,
      diligenceStatusConstant.Evaluation,
      diligenceStatusConstant.PendingRestart,
    ].includes(diligence.status) &&
    !question.answer.attributes.is_submitted
  ) {
    // disable few icons for investors in post-completion statuses if question has a followup with allow response revision and submission is pending
    isResponseUnsubmitted = true;
  }

  switch (type) {
    case 'autofill':
      const autofill = {
        key: 'autofill',
        label: 'Autofill',
        name: 'bolt',
        disabled: false,
        color: ColorTheme.primary,
        tooltip: 'See suggested response for this question',
      };
      return autofill;
    case 'userAssigned':
      const userAssigned = {
        key: 'user',
        name: 'user',
        label: 'Assigned users',
        disabled: false,
        color: ColorTheme.primary,
        tooltip: 'Assigned users',
      };
      return userAssigned;
    case 'assign':
      const assign = {
        key: 'assign',
        name: 'add-user-4',
        label: 'Assign to a team member/user role',
        disabled: false,
        color: ColorTheme.questionnaireIconDarkGrey,
        tooltip: 'Assign to a team member/user role',
      };
      return assign;
    case 'draft':
      const draft = {
        key: 'draft',
        label: 'Draft',
        name: 'under-construction-2',
        disabled: !question?.answer?.id,
        color: question?.answer?.attributes?.localis_WIP
          ? ColorTheme.primary
          : ColorTheme.questionnaireIconDarkGrey,
        tooltip: question?.answer?.attributes?.localis_WIP
          ? 'Mark as final'
          : question?.answer?.id
          ? 'Mark response as draft'
          : 'No response available to mark as draft',
      };
      draft.color = draft.disabled ? ColorTheme.grey : draft.color;
      return draft;
    case 'na':
      const na = {
        key: 'na',
        name: 'na-narrow',
        label: 'Not applicable',
        disabled: false,
        color: question?.answer?.attributes?.localis_NA
          ? ColorTheme.primary
          : ColorTheme.questionnaireIconDarkGrey,
        tooltip: question.is_mandatory
          ? 'The requestor has marked this question as mandatory. Please provide a response if available. If not, please select an option from the dropdown and add a comment explaining why it is not applicable.'
          : question?.answer?.attributes?.localis_NA
          ? 'Add response'
          : 'Mark as not applicable',
        canShowDropdown: !question?.answer?.attributes?.localis_NA,
        list: NAOptions,
        value: { label: '', key: '' },
      };
      na.color = na.disabled ? ColorTheme.grey : na.color;
      return na;
    case 'notes':
      const notes = {
        key: 'notes',
        name: 'notepad',
        label: 'Internal notes',
        disabled: false,
        color: question?.note_count
          ? ColorTheme.primary
          : ColorTheme.questionnaireIconDarkGrey,
        count: question?.note_count ?? 0,
        tooltip: 'Add internal notes',
      };
      notes.color = notes.disabled ? ColorTheme.grey : notes.color;
      return notes;
    case 'followup':
      let tooltipF = '';
      if (diligence.is_internal)
        tooltipF = `Cannot create a follow-up for internal projects`;
      else if (isInvestor) tooltipF = 'Follow-up with the responder';
      else tooltipF = 'Follow-up with the requestor';

      const obj =
        question.followup_count &&
        question.sequenceID in question.followup_count
          ? question.followup_count[question.sequenceID]
          : null;

      const count = obj?.count ?? 0;
      return {
        key: 'followup',
        name: 'followup',
        label: 'Follow up',
        count: count,
        size: 'big',
        disabled:
          diligence.is_internal || diligence.diligence_type == 'shared_profile',
        color:
          count || obj?.all_are_resolved
            ? ColorTheme.primary
            : ColorTheme.questionnaireIconDarkGrey,
        countColor: count || obj?.all_are_resolved ? ColorTheme.blue : '',
        countIcon: obj?.all_are_resolved ? 'check' : '',
        showProgressDot: count && obj?.last_is_received,
        tooltip: tooltipF,
      };
    case 'submitRevisions':
      const id = `${question.sequenceID}-${question.sectionID}-${question.id}`;
      const disableIcon =
        question?.answer?.attributes?.localis_WIP ||
        isError ||
        !!(draftData && id in draftData && Object.values(draftData[id]).length);
      const submitRevisions = {
        key: 'submitRevisions',
        name: 'check',
        label: 'Submit Response Revisions',
        disabled: disableIcon,
        color: disableIcon ? ColorTheme.grey : ColorTheme.orange,
        tooltip: disableIcon
          ? 'Please finalize the response before submitting to requestor'
          : 'Submit to Requestor',
      };
      return submitRevisions;
    case 'todo':
      let tooltipT = 'No response available to assign todo';
      if (question?.answer?.id) tooltipT = 'Add / edit todo';
      const todo = {
        key: 'todo',
        name: 'tasks',
        label: 'To-do',
        disabled: !question?.answer?.id,
        color: question?.answer?.id
          ? ColorTheme.questionnaireIconDarkGrey
          : ColorTheme.grey,
        count: question?.answer?.attributes?.toDoCount ?? 0,
        tooltip: tooltipT,
      };
      todo.color = todo.disabled ? ColorTheme.grey : todo.color;
      return todo;
    case 'addToPreapproved':
      const addToPreapproved = {
        key: 'addToPreapproved',
        label: 'Q/A Library',
        name: 'plus-circle',
        disabled: question?.answer?.attributes?.localis_WIP,
        color: ColorTheme.questionnaireIconDarkGrey,
        tooltip: question?.answer?.attributes?.localis_WIP
          ? 'This is a draft response'
          : 'Add Q/A to Library',
      };
      addToPreapproved.color = addToPreapproved.disabled
        ? ColorTheme.grey
        : addToPreapproved.color;
      return addToPreapproved;
    case 'flag':
      let tooltipflag = '';
      if (!question?.answer?.id || question?.answer.attributes.localis_WIP)
        tooltipflag = 'No response available to set flag';
      else if (question?.answer.attributes.is_flagged)
        tooltipflag = 'This response is flagged';
      else tooltipflag = 'Flag this response';

      const flag = {
        key: 'flag',
        name: 'flag',
        label: 'Flag',
        disabled:
          !question?.answer?.id ||
          question?.answer.attributes.localis_WIP ||
          isResponseUnsubmitted,
        color: question?.answer.attributes.is_flagged
          ? ColorTheme.red
          : ColorTheme.questionnaireIconDarkGrey,
        tooltip: isResponseUnsubmitted ? '' : tooltipflag,
        keepColorWithDisableMode: isResponseUnsubmitted,
      };
      flag.color =
        flag.disabled && !isResponseUnsubmitted ? ColorTheme.grey : flag.color;
      if (diligence) {
        flag.tooltip =
          diligence?.status === diligenceStatusConstant.Approved ||
          diligence?.status === diligenceStatusConstant.NotApproved
            ? 'Cannot flag response in a closed project'
            : flag.tooltip;
      }
      return flag;
    case 'standard-text':
      const standardText = {
        key: 'standard-text',
        name: 'standard-text',
        label: 'Smart text',
        disabled: !question?.has_standardized_text,
        color: question?.has_standardized_text
          ? ColorTheme.primary
          : ColorTheme.questionnaireIconDarkGrey,
        tooltip: question?.has_standardized_text
          ? 'Generate response from smart text'
          : 'No smart text found',
      };
      standardText.color = standardText.disabled
        ? ColorTheme.grey
        : standardText.color;
      return standardText;
    case 'rating':
      return {
        key: 'rating',
        name: 'rating',
        label: 'Rating',
        disabled: !question.answer?.id,
        color: ColorTheme.questionnaireIconDarkGrey,
        tooltip: question.answer?.id
          ? question?.questionRating.rating_value
          : 'No responses available to rate / score',
        isScoreband: false,
        rating: [],
      };
    case 'ban':
      const is_na = question.questionRating?.is_na;
      const ban = {
        key: 'ban',
        name: 'ban',
        label: is_na ? 'Include in Rating' : 'Exclude from Rating',
        disabled: false,
        color: is_na ? ColorTheme.red : ColorTheme.questionnaireIconDarkGrey,
        tooltip: is_na ? 'Include in Rating' : 'Exclude from Rating',
        ratingChange: null,
      };
      return ban;
    case 'calendar':
      let minDate = new Date();
      minDate.setHours(0, 0, 0, 0);
      const calendar = {
        key: 'calendar',
        name: 'calendar',
        label: 'Expiry date',
        minDate: new Date(),
        color: question?.answer?.attributes?.expiry_date
          ? new Date(question?.answer?.attributes?.expiry_date) < minDate
            ? ColorTheme.red
            : ColorTheme.primary
          : ColorTheme.questionnaireIconDarkGrey,
        tooltip: question?.answer?.attributes?.expiry_date
          ? `Expiry date: ${new Date(
              question?.answer?.attributes?.expiry_date
            ).toLocaleDateString()}`
          : 'Set expiry date',
        disabled: !question?.answer?.id,
      };
      calendar.color = calendar.disabled ? ColorTheme.grey : calendar.color;
      return calendar;
    case 'userCheck':
      let tooltipuser = '';
      if (!question?.answer?.id)
        tooltipuser = 'No response available to assign a reviewer';
      else if (question?.answer.attributes.localis_WIP)
        tooltipuser = 'This is a draft response';
      else if (question.answer.attributes.assignments)
        tooltipuser = `Update reviewer${
          util.isFreeSubscription() ? '' : '(s)'
        }`;
      else
        tooltipuser = `Assign Reviewer${
          util.isFreeSubscription() ? '' : '(s)'
        }`;
      const userCheck = {
        key: 'userCheck',
        name: 'user-check',
        label: 'Add reviewer',
        color: ColorTheme.questionnaireIconDarkGrey,
        disabled:
          !question?.answer?.id ||
          question?.answer.attributes.localis_WIP ||
          isResponseUnsubmitted,
        tooltip: tooltipuser,
      };
      userCheck.color = userCheck.disabled
        ? ColorTheme.grey
        : question.answer.attributes.assignments
        ? ColorTheme.primary
        : userCheck.color;
      return userCheck;
    case 'sendForReview':
      return {
        key: 'sendForReview',
        name: 'arrow-back',
        label: 'Send back to review',
        disabled: question.answer.attributes.localis_WIP,
        color: ColorTheme.questionnaireIconDarkGrey,
        tooltip: 'Send back to review',
      };
    case 'pencil':
      return {
        key: 'pencil',
        name: 'pencil',
        label: 'Edit',
        disabled: false,
        color: ColorTheme.questionnaireIconDarkGrey,
        tooltip:
          'After making an edit and saving, you can click review again to reset the review process.',
      };
    case 'edit-after-approve':
      return {
        key: 'edit-after-approve',
        name: 'pencil',
        label: 'Edit',
        disabled: false,
        color: ColorTheme.questionnaireIconDarkGrey,
        tooltip:
          'After making an edit and saving, you can click review again to reset the review process.',
      };
    case 'pencil-edit-in-review':
      return {
        key: 'pencil-edit-in-review',
        name: 'pencil',
        label: 'Edit',
        disabled: false,
        color: ColorTheme.questionnaireIconDarkGrey,
        tooltip:
          'Editing the response will re-trigger the review for the assigned reviewers.',
      };
    case 'approve':
      return {
        key: 'approve',
        name: 'thumbs-up',
        label: 'Approve response',
        disabled: isResponseUnsubmitted,
        color: ColorTheme.questionnaireIconDarkGrey,
        tooltip: 'Approve response',
        isSection: false,
      };
    case 'mail-forward':
      return {
        key: 'mail-forward',
        name: 'mail-forward',
        label: 'Send back to author',
        disabled: false,
        color: ColorTheme.questionnaireIconDarkGrey,
        tooltip: 'Request revision',
        isSection: false,
      };
    case 'refresh':
      return {
        key: 'refresh',
        name: 'refresh',
        disabled:
          question.answer.attributes.localis_WIP || isResponseUnsubmitted,
        label: 'Review again',
        color: ColorTheme.questionnaireIconDarkGrey,
        tooltip: question.answer.attributes.assignments?.is_completed
          ? 'Review again'
          : 'Reset the review process for this response.',
      };
    case 'recommendation':
      return {
        key: 'recommendation',
        name: 'recommendation',
        label: `${
          question?.issue_count ||
          util.isFreeSubscription() ||
          [
            'approved',
            'notapproved',
            'withdrawn',
            'deleted',
            'invited',
            'sent',
          ].includes(diligence.status.toLowerCase())
            ? 'View '
            : 'Add '
        }${util.getIssueTrackerName()?.toLowerCase() ?? 'recommendation'}`,
        disabled: false,
        color: question?.issue_count
          ? ColorTheme.primary
          : ColorTheme.questionnaireIconDarkGrey,
        count: question?.issue_count ?? 0,
        tooltip:
          `${
            question?.issue_count ||
            util.isFreeSubscription() ||
            [
              'approved',
              'notapproved',
              'withdrawn',
              'deleted',
              'invited',
              'sent',
            ].includes(diligence.status.toLowerCase())
              ? 'View '
              : 'Add '
          }` + (util.getIssueTrackerName()?.toLowerCase() ?? 'recommendation'),
      };
    case 'remove':
      const remove = {
        key: 'remove',
        name: 'remove',
        label: 'Reject response',
        disabled: isResponseUnsubmitted,
        tooltip: question?.answer.attributes.is_WIP
          ? 'This is a draft response'
          : 'Reject response',
      };
      return remove;
    case 'review-comments':
      return {
        key: 'review-comments',
        name: 'notepad',
        label: 'Review comments',
        tooltip: 'Add review comments (visible only to your firm)',
        color: question.answer.attributes.response_unresolved_comments_counts
          ? ColorTheme.primary
          : ColorTheme.questionnaireIconDarkGrey,
        count:
          question.answer.attributes.response_unresolved_comments_counts ?? 0,
      };
    case 'tableValidation':
      return {
        key: 'tableValidation',
        name: 'table-validate',
        label: 'Mark response as valid',
        tooltip: 'Mark response as valid',
        color: question.answer.attributes.is_validation_required
          ? ColorTheme.primary
          : ColorTheme.black,
        disabled: !question.answer?.attributes?.is_valid,
      };
    case 'viewRules':
      return {
        key: 'viewRules',
        name: 'view-rules',
        label: 'View Rules',
        tooltip: 'View all rules of the question',
        color: ColorTheme.black,
      };
    case 'ck-comments':
      return {
        key: 'ck-comments',
        name: 'flatten-folder',
        label: 'Review comments',
        tooltip: 'Review comments',
        color: question.answer.attributes.response_unresolved_comments_counts
          ? ColorTheme.primary
          : ColorTheme.questionnaireIconDarkGrey,
        count:
          question.answer.attributes.response_unresolved_comments_counts ?? 0,
      };
    case 'ai':
      return {
        key: 'ai',
        name: 'Ai',
        label: 'AI',
        tooltip: getProperTooltip(util, util.getFirmPreferences(), false),
        noHoverEffect: true,
        isSvg: true,
        path: '/assets/images/ai.svg',
        class: `aiClass ${
          !question.answer.attributes.textResponse ||
          !util.getFirmPreferences().enable_gen_ai ||
          !util.getFirmPreferences().enable_system_gen_ai
            ? 'disabled'
            : ''
        }`,
      };
  }
};
