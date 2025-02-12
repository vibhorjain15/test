import { Component, Input, OnInit, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-status-legend',
  templateUrl: './status-legend.component.html',
  styleUrls: ['./status-legend.component.css'],
})
export class StatusLegendComponent implements OnInit {
  @Input() isInvestor: boolean;
  @Input() type: string;
  legends: { label_type: string; status: string; desc: string }[];

  constructor() {}

  ngOnInit(): void {
    this.getLegends();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['type'] && changes['type'].currentValue) {
      this.getLegends();
    }
  }

  getLegends() {
    this.legends = [];
    if (this.isInvestor) {
      switch (this.type) {
        case 'in-progress':
        case 'my projects':
          this.legends = [
            {
              label_type: 'warning',
              status: 'Invited',
              desc: 'New request',
            },
            {
              label_type: 'default',
              status: 'Started',
              desc: 'Response being populated',
            },
            {
              label_type: 'success',
              status: 'Completed',
              desc: 'Project completed, pending acceptance/approval action',
            },
            {
              label_type: 'warning',
              status: 'Pending Restart',
              desc: 'Restart request pending your action',
            },
            {
              label_type: 'warning',
              status: 'Extension Requested',
              desc: 'Extension for due date requested',
            },
            {
              label_type: 'info',
              status: 'In Review',
              desc: 'Review before completing a project',
            },
            {
              label_type: 'info',
              status: 'Evaluation',
              desc: 'Review and evaluation of a completed project',
            },
          ];
          break;
        case 'all':
          this.legends = [
            {
              label_type: 'warning',
              status: 'Invited',
              desc: 'New request',
            },
            {
              label_type: 'default',
              status: 'Started',
              desc: 'Response being populated',
            },
            {
              label_type: 'success',
              status: 'Completed',
              desc: 'Project completed, pending acceptance/approval action',
            },
            {
              label_type: 'warning',
              status: 'Pending Restart',
              desc: 'Restart request pending your action',
            },
            {
              label_type: 'warning',
              status: 'Extension Requested',
              desc: 'Extension for due date requested',
            },
            {
              label_type: 'info',
              status: 'In Review',
              desc: 'Review before completing a project',
            },
            {
              label_type: 'info',
              status: 'Evaluation',
              desc: 'Review and evaluation of a completed project',
            },
            {
              label_type: 'orange',
              status: 'Sent',
              desc: 'New request sent but not started',
            },
            {
              label_type: 'success',
              status: 'Approved',
              desc: 'Project accepted and closed',
            },
            {
              label_type: 'danger',
              status: 'Not Approved',
              desc: 'Project not accepted and closed',
            },
            {
              label_type: 'danger',
              status: 'Deleted',
              desc: 'Project deleted',
            },
            {
              label_type: 'danger',
              status: 'Withdrawn',
              desc: 'Project withdrawn',
            },
          ];
          break;
        case 'closed':
          this.legends = [
            {
              label_type: 'success',
              status: 'Approved',
              desc: 'Project accepted and closed',
            },
            {
              label_type: 'danger',
              status: 'Not Approved',
              desc: 'Project not accepted and closed',
            },
          ];
          break;
      }
    } else {
      switch (this.type) {
        case 'in-progress':
        case 'my projects':
          this.legends = [
            {
              label_type: 'warning',
              status: 'Invited',
              desc: 'New request',
            },
            {
              label_type: 'default',
              status: 'Started',
              desc: 'Response being populated',
            },
            {
              label_type: 'success',
              status: 'Completed',
              desc: 'Project completed, pending acceptance/approval action',
            },
            {
              label_type: 'warning',
              status: 'Pending Restart',
              desc: 'Restart pending by the project sender',
            },
            {
              label_type: 'warning',
              status: 'Extension Requested',
              desc: 'Extension for due date requested',
            },
            {
              label_type: 'info',
              status: 'In Review',
              desc: 'Review before completing a project',
            },
            {
              label_type: 'info',
              status: 'Evaluation',
              desc: 'Under review by recipient',
            },
          ];
          break;
        case 'all':
          this.legends = [
            {
              label_type: 'warning',
              status: 'Invited',
              desc: 'New request',
            },
            {
              label_type: 'default',
              status: 'Started',
              desc: 'Response being populated',
            },
            {
              label_type: 'success',
              status: 'Completed',
              desc: 'Project completed, pending acceptance/approval action',
            },
            {
              label_type: 'warning',
              status: 'Pending Restart',
              desc: 'Restart pending by the project sender',
            },
            {
              label_type: 'warning',
              status: 'Extension Requested',
              desc: 'Extension for due date requested',
            },
            {
              label_type: 'info',
              status: 'In Review',
              desc: 'Review before completing a project',
            },
            {
              label_type: 'info',
              status: 'Evaluation',
              desc: 'Under review by recipient',
            },
            {
              label_type: 'orange',
              status: 'Sent',
              desc: 'Project shared, not accepted by the recipient',
            },
            {
              label_type: 'success',
              status: 'Approved',
              desc: 'Project accepted and closed',
            },
            {
              label_type: 'danger',
              status: 'Not Approved',
              desc: 'Project not accepted and closed',
            },
          ];
          break;
        case 'closed':
          this.legends = [
            {
              label_type: 'success',
              status: 'Approved',
              desc: 'Project accepted and closed',
            },
            {
              label_type: 'danger',
              status: 'Not Approved',
              desc: 'Project not accepted and closed',
            },
            {
              label_type: 'success',
              status: 'Completed',
              desc: 'Project completed, pending acceptance/approval action',
            },
          ];
          break;
      }
    }
    this.legends = this.legends.sort((a, b) =>
      a.status.localeCompare(b.status)
    );
  }
}
