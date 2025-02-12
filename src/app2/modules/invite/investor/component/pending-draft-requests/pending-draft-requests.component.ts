import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Store } from '@ngxs/store';
import { SetDefaultColumnDef } from 'src/app2/store/grid/grid.action';
import { PendingApprovalGridService } from '../../service/pending-approval.grid';

@Component({
  selector: 'dv-pending-draft-requests',
  templateUrl: './pending-draft-requests.component.html',
})
export class PendingDraftRequestsComponent implements OnInit {
  @Output() onClick = new EventEmitter();
  @Input() currentUserId;

  requestsList = [];
  loading_data: boolean;
  RequestsResource: any;
  legends: {};
  constructor(
    private readonly store: Store,
    private readonly PendingApprovalGridService: PendingApprovalGridService
  ) {
    this.handleRowClicked = this.handleRowClicked.bind(this);
  }

  ngOnInit() {
    this.requestsList = [];
    this.loading_data = true;
    this.PendingApprovalGridService.getData(this.currentUserId).subscribe(
      (res) => {
        this.requestsList = res;
        this.loading_data = false;
      }
    );
    const defaultColumnDef =
      this.PendingApprovalGridService.getMyApprovalGridColDef();
    defaultColumnDef.map((x) => (x.cellClass = 'my-permission-cursor-pointer'));
    this.store.dispatch(
      new SetDefaultColumnDef({ ['requests_grid']: defaultColumnDef })
    );

    this.legends = [
      {
        label_type: 'warning-light',
        status: 'Pending approval',
        desc: 'Request pending approval by the approver.',
      },
      {
        label_type: 'danger-light',
        status: 'Rejected',
        desc: 'Request rejected by approver',
      },
      {
        label_type: 'info-light',
        status: 'Waiting for approval',
        desc: ' Request waiting for approval by the approver.',
      },
    ];
  }

  handleRowClicked(grid) {
    this.onClick.emit(grid.data);
  }

  trackBylabelType(index: number, val: any): number {
    return val.label_type;
  }
}
