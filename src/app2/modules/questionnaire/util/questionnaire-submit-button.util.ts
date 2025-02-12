import { diligenceStatusConstant } from '../constants/quick-view-headers.constant';

export const getFinishToolTipText = (
  diligence,
  countMap,
  submittingRevisions
) => {
  let wip_count,
    mandatory_count,
    totalReviewPending,
    totalReviewFailed,
    totalTrackChangesCount,
    totalReviewAssignmentPending,
    totalRatingTrackChangesCount,
    totalRatingReviewPending,
    totalRatingReviewAssignmentPending,
    totalRatingReviewFailed,
    validationRequiredCount,
    totalUnResolvedComments;
  wip_count = countMap['WipTotal'];
  mandatory_count = countMap['MandatoryUnansweredTotal'];
  totalReviewPending = countMap['TotalReviewPending'];
  totalReviewFailed = countMap['ReviewFailed'];
  totalTrackChangesCount = countMap['WithTrackChangesCount'];
  totalReviewAssignmentPending = countMap['TotalReviewerAssignmentPending'];
  totalRatingTrackChangesCount = countMap['WithRatingTrackChangesCount'];
  totalRatingReviewPending = countMap['RatingReviewpendingCount'];
  totalRatingReviewAssignmentPending = countMap['RatingAssignmentpendingCount'];
  totalRatingReviewFailed = countMap['RatingReviewFailed'];
  totalUnResolvedComments = countMap['TotalUnresolvedCommentsCount'];
  validationRequiredCount = countMap['ValidationRequiredCount'];
  const countObj = {
    totalRatingReviewFailed,
    totalRatingReviewAssignmentPending,
    totalUnResolvedComments,
    totalRatingReviewPending,
    totalRatingTrackChangesCount,
    totalReviewAssignmentPending,
    wip_count,
    mandatory_count,
    totalReviewPending,
    totalReviewFailed,
    totalTrackChangesCount,
    validationRequiredCount,
  };
  let message = '';
  if (wip_count > 0 && mandatory_count > 0)
    message =
      mandatory_count +
      ' Mandatory Question(s) Pending and ' +
      wip_count +
      ' question(s) marked as draft. Please resolve these before submitting.';
  else if (wip_count > 0)
    message =
      'You have ' +
      wip_count +
      ' questions marked as draft. Please finalize these before submitting.';
  else if (mandatory_count > 0)
    message = mandatory_count + ' Mandatory Question(s) Pending.';
  else if (
    totalReviewFailed > 0 &&
    diligence.review_mandatory &&
    diligence?.status === diligenceStatusConstant.InReview
  )
    message =
      totalReviewFailed +
      ' Review(s) Failed. Please review them before submitting.';
  else if (
    diligence &&
    diligence.review_mandatory &&
    totalReviewAssignmentPending > 0
  )
    message =
      totalReviewAssignmentPending +
      ' Response(s) are not reviewed yet. Please review them before submitting.';
  else if (diligence && diligence.review_mandatory && totalReviewPending > 0)
    message =
      totalReviewPending +
      ' Review(s) Pending. Please review these before submitting.';
  else if (totalUnResolvedComments > 0)
    message =
      totalUnResolvedComments +
      ' Response(s) have review comments. Please resolve these before submitting.';
  else if (totalTrackChangesCount > 0)
    message =
      totalTrackChangesCount +
      ' Response(s) have tracking changes. Please resolve these before submitting.';
  else if (
    totalRatingReviewFailed > 0 &&
    diligence?.review_mandatory &&
    diligence?.status === diligenceStatusConstant.InReview
  )
    message =
      totalRatingReviewFailed +
      ' Rating Review(s) Failed. Please resolve these before submitting.';
  else if (
    diligence &&
    diligence.review_mandatory &&
    totalRatingReviewAssignmentPending > 0
  )
    message =
      totalRatingReviewAssignmentPending +
      ' Rating Review(s) are not reviewed yet. Please review them before submitting.';
  else if (
    diligence &&
    diligence.review_mandatory &&
    totalRatingReviewPending > 0
  )
    message =
      totalRatingReviewPending +
      ' Rating Review(s) Pending. Please review these before submitting.';
  else if (totalRatingTrackChangesCount > 0)
    message =
      totalRatingTrackChangesCount +
      ' Rating(s) have tracking changes. Please resolve these before submitting.';
  else if (validationRequiredCount > 0)
    message =
      validationRequiredCount +
      ' responses require validation. Please validate these before submitting.';
  else if (
    totalReviewFailed > 0 &&
    !diligence?.review_mandatory &&
    diligence?.status === diligenceStatusConstant.InReview
  )
    message =
      totalReviewFailed +
      ' Review(s) Failed. You might want to resolve these before submitting.';
  else if (
    totalRatingReviewFailed > 0 &&
    !diligence?.review_mandatory &&
    diligence?.status === diligenceStatusConstant.InReview
  )
    message =
      totalRatingReviewFailed +
      ' Rating Review(s) Failed. You might want to resolve these before submitting.';
  else if (submittingRevisions) message = 'Submit all revised responses';

  return { message, countObj };
};
