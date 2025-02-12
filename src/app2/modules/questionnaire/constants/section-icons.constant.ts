import { ColorTheme } from 'src/app2/shared/themes/color.themes';
import { IconTypes } from '../types/card-icons.type';

export const sectionCardIcons = (
  type:
    | 'autofill'
    | 'notes'
    | 'assign'
    | 'userCheck'
    | 'rating'
    | 'remove'
    | 'approve'
    | 'SendBackToAuthor'
    | 'ban',
  section = null,
  util = null
): IconTypes => {
  switch (type) {
    case 'notes':
      const notes = {
        key: 'notes',
        name: 'notepad',
        label: 'Internal notes',
        disabled: false,
        color: section?.note_count ? ColorTheme.primary : ColorTheme.black,
        count: section?.note_count ?? 0,
        tooltip: 'Add an internal note',
      };
      notes.color = notes.disabled ? ColorTheme.grey : notes.color;
      return notes;

    case 'userCheck':
      const userCheck = {
        key: 'userCheck',
        name: 'user-check',
        label: 'Assign Reviewer',
        color: ColorTheme.default,
        isDisable: false,
        tooltip: `Assign Reviewer${util.isFreeSubscription() ? '' : '(s)'}`,
      };
      userCheck.color = userCheck.isDisable ? ColorTheme.grey : userCheck.color;
      return userCheck;

    case 'assign':
      const assign = {
        key: 'assign',
        name: 'add-user-4',
        label: 'Assign team member',
        disabled: false,
        color: ColorTheme.primary,
        tooltip: 'Assign to a team member / user role',
      };
      return assign;

    case 'rating':
      return {
        key: 'rating',
        label: 'Rating',
        name: 'rating',
        disabled: false,
        color: ColorTheme.black,
        tooltip: 'No responses available to score',
        isScoreband: false,
        rating: [],
      };
    case 'ban':
      const is_na = section.sectionRating?.is_na;
      return {
        key: 'ban',
        name: 'ban',
        label: is_na ? 'Include in Rating' : 'Exclude from Rating',
        disabled: false,
        color: is_na ? ColorTheme.red : ColorTheme.questionnaireIconDarkGrey,
        tooltip: is_na ? 'Include in Rating' : 'Exclude from Rating',
        ratingChange: null,
      };
    case 'approve':
      return {
        key: 'approve',
        name: 'thumbs-up',
        label: 'Approve',
        disabled: false,
        color: ColorTheme.questionnaireIconDarkGrey,
        tooltip: 'Approve all of your assigned responses in this sub-category',
      };
    case 'SendBackToAuthor':
      return {
        key: 'SendBackToAuthor',
        name: 'mail-forward',
        label: 'Send back to author',
        disabled: false,
        color: ColorTheme.questionnaireIconDarkGrey,
        tooltip:
          'Request revisions for all of your assigned responses in this sub-category',
      };
    case 'remove':
      return {
        key: 'remove',
        name: 'times',
        label: 'Reject responses',
        disabled: false,
        color: ColorTheme.questionnaireIconDarkGrey,
        tooltip: 'Reject all of your assigned responses in this sub-category',
      };
  }
};
