import { ResponseType } from './Response-type.constant';

export const NoCommentResponseTypes = [
  ResponseType.TextMultiLine,
  ResponseType.Text,
  ResponseType.TextEmail,
];
export const preApprovedUnsupportedTypes = [
  ResponseType.aumTable,
  ResponseType.CheckBox,
  ResponseType.Dropdown,
  ResponseType.Bookends,
  ResponseType.ReturnTable,
  ResponseType.Attachment,
];

export const UnsupportedResponseTypes = [
  ResponseType.Attachment,
  ResponseType.ReturnTable,
  ResponseType.aumTable,
  ResponseType.Grid,
  ResponseType.DynamicGrid,
];
export const UnsupportedTrackChangeTypes = [
  ResponseType.Attachment,
  ResponseType.ReturnTable,
  ResponseType.aumTable,
];

export const TaskType = {
  Evaluation: 1701,
  Inreview: 1702,
};

export const ReviewType = {
  Evaluation: 'Review',
  InReview: 'Approve',
};
