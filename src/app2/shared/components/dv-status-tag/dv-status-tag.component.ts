import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import {
  ICellRendererParams,
} from 'ag-grid-community';

type typeStatus =
  | 'default'
  | 'inProgress'
  | 'completed'
  | 'danger'
  | 'warning'
  | 'info'
  | 'success'
  | 'orange';
@Component({
  selector: 'dv-status-tag',
  templateUrl: './dv-status-tag.component.html',
  styleUrls: ['./dv-status-tag.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DvStatusTagComponent
  implements OnInit, ICellRendererAngularComp, OnChanges
{
  @Input() label: string = '';
  @Input() type: typeStatus = 'default';

  params: any;
  constructor() {}
  refresh(): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.label = params.value;
    if (params.value === 'draft') {
      this.type = 'inProgress';
    } else {
      this.type = getStatusType(this.label);
    }
  }

  ngOnInit(): void {
    if (
      ![
        'default',
        'inProgress',
        'completed',
        'danger',
        'warning',
        'info',
        'orange',
        'success',
      ].includes(this.type)
    ) {
      this.type = getStatusType(this.type);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes?.type &&
      changes.type.currentValue !== changes.type.previousValue
    ) {
      this.ngOnInit();
    }
  }
}

const getStatusType = (status) => {
  if (
    [
      'Completed',
      'Approved',
      'APPROVED',
      'Unanswered',
      'ExtensionApproved',
      'ReviewPassed',
      'Registered',
    ].includes(status)
  ) {
    return 'success';
  }
  if (
    [
      'NotApproved',
      'Deleted',
      'Answered',
      'ReviewFailed',
      'Withdrawn',
      'ExtensionDeclined',
      'Retired',
    ].includes(status)
  ) {
    return 'danger';
  }
  if (
    ['Started', 'Following', 'Scheduled', 'ACTIVE', 'UnAssigned'].includes(
      status
    )
  ) {
    return 'default';
  }
  if (
    [
      'Reminded',
      'Restarted',
      'RestartApproved',
      'InReview',
      'Evaluation',
    ].includes(status)
  ) {
    return 'info';
  }
  if (
    [
      'Followup',
      'Invested',
      'Invited',
      'PendingRestart',
      'APPROVED-120',
      'WIP',
      'Extension Requested',
      'ExtensionRequested',
      'ERA',
    ].includes(status)
  ) {
    return 'warning';
  }

  if (status === 'Sent') return 'orange';
  return 'default';
};
