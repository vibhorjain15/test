import { Injectable } from '@angular/core';
import { diligenceStatusConstant } from '../modules/questionnaire/constants/quick-view-headers.constant';

@Injectable({
  providedIn: 'root',
})
export class ProjectStatusService {
  diligenceStatusConstant = diligenceStatusConstant;

  constructor() {}

  getStatusConfig(status: string, data: any = null) {
    let confirmText = '';
    let Subtext = '';
    let confirmButtonText = 'Confirm';

    if (
      (status === this.diligenceStatusConstant.Approved ||
        status === this.diligenceStatusConstant.NotApproved) &&
      data?.isInvestor &&
      data?.unsubmittedResponsesAfterCompletionCount
    ) {
      confirmText = `Closing this project will resolve ${data.unsubmittedResponsesAfterCompletionCount} follow-up(s) where revisions are enabled and will cancel any pending response revisions that the responder may be planning to submit.`;
      Subtext = 'Are you sure you want to proceed?';
    } else if (status === this.diligenceStatusConstant.Approved) {
      confirmText = 'Are you sure you want to Approve this project?';
      Subtext = '';
    } else if (status === this.diligenceStatusConstant.NotApproved) {
      confirmText =
        'Are you sure you want to mark this project as Not Approved?';
      Subtext =
        'The project will be moved to Not Approved Status. You can later Restart the project.';
    } else if (status === 'changeStatustoCompleted') {
      confirmText = 'Are you sure you want to move this project to Completed';
      Subtext = '';
    } else if (status == 'Restarted') {
      confirmText = 'Are you sure you want to Restart the project?';
      Subtext = 'This will move the project to started status.';
      confirmButtonText = 'Yes, Restart';
    }

    return {
      confirmText,
      Subtext,
      confirmButtonText,
    };
  }
}
