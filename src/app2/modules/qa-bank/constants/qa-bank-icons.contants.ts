import { ColorTheme } from 'src/app2/shared/themes/color.themes';
import { Questions, buttonList } from '../types/qa-bank.model';
import { CurrentUserModel } from 'src/app2/store/user/user.model';

export const questionCardIcons = (
  type:
    | 'notes'
    | 'copy'
    | 'ban'
    | 'edit'
    | 'viewSimilarQuestion'
    | 'viewInProjectFormat'
    | 'add'
    | 'unarchive'
    | 'refresh',
  question?: Questions,
  user?: CurrentUserModel,
  firmPreference = null,
  diligenceStatus = null
): buttonList => {
  switch (type) {
    case 'notes':
      const notes = {
        key: 'notes',
        name: 'notepad',
        label: 'Internal notes',
        disabled: false,
        color: ColorTheme.questionnaireIconDarkGrey,
        count: question.note_count ?? question.notes?.length,
        type: 'transparent',
        tooltip: 'View internal notes',
        icon: true,
      };
      return notes;
    case 'copy':
      const copy = {
        key: 'copy',
        name: 'copy',
        label: 'Copy',
        disabled: false,
        color: ColorTheme.questionnaireIconDarkGrey,
        type: 'transparent',
        tooltip: 'Copy the response',
        icon: true,
      };
      return copy;
    case 'ban':
      const ban = {
        key: 'ban',
        name: 'ban',
        label: 'Archive',
        disabled: user?.isFreeSubscription,
        color: ColorTheme.questionnaireIconDarkGrey,
        hoverColor: 'red',
        type: 'transparent',
        tooltip: `${
          user?.isFreeSubscription
            ? 'Archive this Q/A with a premium subscription'
            : 'Archive this Q/A'
        }`,
        icon: true,
      };
      return ban;
    case 'edit':
      const edit = {
        key: 'edit',
        name: 'pencil',
        label: 'Edit',
        disabled: false,
        color: ColorTheme.questionnaireIconDarkGrey,
        type: 'transparent',
        tooltip:
          firmPreference?.enable_auto_review_again &&
          [diligenceStatus.ReviewPassed.toLowerCase()].includes(
            question.response_status?.toLowerCase()
          )
            ? 'Editing the response will re-trigger the review for the assigned reviewers.' // auto re-trigger review applies only for completed reviews, and only when firm preference is enabled
            : diligenceStatus &&
              [
                diligenceStatus.ReviewPassed.toLowerCase(),
                diligenceStatus.ReviewFailed.toLowerCase(),
                diligenceStatus.InReview.toLowerCase(),
              ].includes(question.response_status?.toLowerCase())
            ? 'After making an edit and saving, you can click review again to reset the review process.'
            : 'Edit the response',
        icon: true,
      };
      return edit;
    case 'viewSimilarQuestion':
      const viewSimilarQuestion = {
        key: 'viewSimilarQuestion',
        name: 'list-search',
        fontSize: 18,
        marginTop: 3,
        label: 'View similar questions',
        disabled: false,
        color: ColorTheme.questionnaireIconDarkGrey,
        type: 'transparent',
        tooltip: 'View similar questions',
        icon: true,
      };
      return viewSimilarQuestion;
    case 'viewInProjectFormat':
      const viewInProjectFormat = {
        key: 'viewInProjectFormat',
        fontSize: 18,
        marginTop: 1,
        name: 'file-out',
        label: 'View in project format',
        disabled: false,
        color: ColorTheme.questionnaireIconDarkGrey,
        type: 'transparent',
        isLink: true,
        tooltip: 'View in project format',
        icon: true,
      };
      return viewInProjectFormat;
    case 'add':
      const add = {
        key: 'add',
        name: 'plus-circle',
        label: 'Add to library',
        disabled: user?.isFreeSubscription,
        color: ColorTheme.questionnaireIconDarkGrey,
        type: 'transparent',
        tooltip: `${
          user?.isFreeSubscription
            ? 'Add Q/A to your Library with a premium subscription'
            : 'Add Q/A to your Library'
        }`,
        icon: true,
      };
      return add;
    case 'unarchive':
      const unarchive = {
        key: 'unarchive',
        name: 'move-in',
        label: 'Unarchive',
        disabled: false,
        color: ColorTheme.questionnaireIconDarkGrey,
        type: 'transparent',
        tooltip: 'Unarchive',
        hoverColor: 'green',
        fontSize: 18,
        icon: true,
      };
      return unarchive;
    case 'refresh':
      return {
        key: 'refresh',
        name: 'refresh',
        disabled: false,
        label: 'Review again',
        color: ColorTheme.questionnaireIconDarkGrey,
        tooltip: question?.is_verified
          ? 'Review again'
          : 'Reset the review process for this response.',
        type: 'transparent',
        icon: true,
      };
  }
};
