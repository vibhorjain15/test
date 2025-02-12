import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Store } from '@ngxs/store';
import { ColDef } from 'ag-grid-community';
import { ToastrService } from 'ngx-toastr';
import { MfwGridService } from 'src/app2/services/mfw-grid.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { DvDatePipe } from 'src/app2/shared/pipes/dv-date.pipe';
import { SetDefaultColumnDef } from 'src/app2/store/grid/grid.action';

@Component({
  selector: 'app-mfw',
  templateUrl: './mfw.component.html',
  styleUrls: ['./mfw.component.css'],
})
export class MfwComponent implements OnInit {
  mfwData: any;
  columnDefs: ColDef[];
  render_grid: boolean = false;
  feedbackTypeid: number;
  gridName: string = 'mfw';

  constructor(
    private readonly mfwGridService: MfwGridService,
    private readonly ModalFactory: CustomModalService,
    private readonly toaster: ToastrService,
    private readonly http: HttpClient,
    private readonly store: Store,
    private readonly dvDatePipe: DvDatePipe
  ) {}

  ngOnInit(): void {
    this.columnDefs = this.mfwGridService.getMfwGridColDef();
    this.store.dispatch(
      new SetDefaultColumnDef({ [this.gridName]: this.columnDefs })
    );
    this.initGrid();
    this.getFeedbackTypeId();
  }

  initGrid() {
    this.mfwGridService.getMfwGridData().subscribe((response: any) => {
      this.mfwData = response;
      this.ModifyDataForDisplay();
      this.render_grid = true;
    });
  }

  ModifyDataForDisplay() {
    // change date format
    this.mfwData.forEach((mfw: any) => {
      mfw.created_at = mfw.created_at
        ? this.dvDatePipe.transform(mfw.created_at, ['isLocaleDate'])
        : '';
    });

    // sort data by ISIN and Fund name
    this.mfwData.sort(
      (a, b) =>
        a.identifier.localeCompare(b.identifier) ||
        a.fund_name.localeCompare(b.fund_name)
    );
  }

  requestResearch() {
    this.ModalFactory.invoke('mfw-request', {
      initialState: {
        feedbackTypeid: this.feedbackTypeid,
      },
    });
  }

  onRowClicked = (row) => {
    this.toaster.clear();
    this.toaster.success(
      'Success',
      'Download request received and is being processed',
      { timeOut: 3000 }
    );
    this.openRatingDocument(row);
  };

  openRatingDocument(row: any) {
    const payload = {
      provider: 'mfw',
      fund_id: row.data.rating_service_fund_id,
    };
    this.http
      .post('service/dvapi_service/rating_document', payload)
      .subscribe((response: any) => {
        window.open(response.url, '_blank');
      });
  }

  getFeedbackTypeId() {
    const params: any = {
      show_only_fund_research: true,
    };
    this.http
      .get(`feedback_types`, { params: params })
      .subscribe((response: any) => {
        if (response && response[0]) {
          this.feedbackTypeid = +response[0].id;
        }
      });
  }
}
