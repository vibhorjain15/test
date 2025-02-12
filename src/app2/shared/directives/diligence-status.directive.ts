import {
  Directive,
  ElementRef,
  Input,
  OnInit,
  Renderer2,
  SimpleChanges,
} from '@angular/core';
import { SentencizePipe } from '../pipes/sentencize.pipe';

@Directive({
  selector: '[diligenceStatus]',
})
export class DiligenceStatusDirective implements OnInit {
  @Input() status;
  existingClass: string = '';

  sentencizePipe = new SentencizePipe();
  constructor(
    private readonly renderer: Renderer2,
    private readonly elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    const nativeElement = this.elementRef.nativeElement;

    nativeElement.innerHTML = `<small class='project-status-label'>${this.sentencizePipe.transform(
      this.status
    )}</small>`;
    let type = '';
    switch (this.status) {
      case 'Completed':
      case 'Approved':
      case 'APPROVED':
      case 'Unanswered':
      case 'ExtensionApproved':
      case 'Extension Approved':
      case 'Registered':
        type = 'success';
        break;
      case 'NotApproved':
      case 'Not Approved':
      case 'Deleted':
      case 'Answered':
      case 'Withdrawn':
      case 'ExtensionDeclined':
      case 'Extension Declined':
      case 'Retired':
      case 'Followup':
      case 'Follow-up':
      case 'Revision Requested':
      case 'Rejected':
        type = 'danger';
        break;
      case 'Started':
      case 'Following':
      case 'Scheduled':
      case 'ACTIVE':
        type = 'default';
        break;

      case 'Invested':
      case 'Invited':
      case 'PendingRestart':
      case 'Pending Restart':
      case 'APPROVED-120':
      case 'WIP':
      case 'Extension Requested':
      case 'ExtensionRequested':
      case 'ERA':
      case 'Pending approval':
        type = 'warning';
        break;
      case 'Reminded':
      case 'Restarted':
      case 'RestartApproved':
      case 'Restart Approved':
      case 'InReview':
      case 'In Review':
      case 'Evaluation':
      case 'Waiting for approval':
        type = 'info';
        break;
      case 'Sent':
        type = 'orange';
        break;
    }
    const label_class = `label-${type}-light`;
    if (this.existingClass) {
      // if status gets changed, we need to reset the label and class so remove the earlier class
      this.renderer.removeClass(nativeElement, this.existingClass);
    }
    this.existingClass = label_class;
    this.renderer.addClass(nativeElement, 'label');
    //this.renderer.addClass(nativeElement, 'text-uppercase');
    this.renderer.addClass(nativeElement, `${label_class}`);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.status?.currentValue) {
      this.status = changes.status.currentValue;
      this.ngOnInit();
    }
  }
}
