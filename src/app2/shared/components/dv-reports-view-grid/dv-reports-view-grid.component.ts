import { Component, Input, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { TemplateService } from 'src/app2/apis/template/template.service';

@Component({
  selector: 'dv-reports-view-grid',
  templateUrl: './dv-reports-view-grid.component.html',
  styleUrls: ['./dv-reports-view-grid.component.css']
})
export class DvReportsViewGridComponent implements OnInit {
  @Input() template: any;
  @Input() tagDetail:any;
  currentResponse:any;
  rows: any[] = [];
  columns: any[] = [];
  grid_values: any[] = [];
  grid_responses: any = [];
  gridData: any[] = [];
  rowHeaders: any[];
  columnHeaders: any[];
  dataset: any[] = [];
  dynamic_element: any;
  idName = ''
  constructor(private templateService: TemplateService,private readonly toaster: ToastrService,) { }
  ngOnInit(): void {
    this.idName = `formulaSetup_${this.tagDetail.group_id}`
      this.templateService
      .getQuestionsGrid(this.tagDetail.grid_id, this.tagDetail.grid_version)
      .subscribe((res: any) => {
        this.rows = res.rows_columns.filter(
          (data) => data.elementType == 'Row'
        );
        this.columns = res.rows_columns.filter(
          (data) => data.elementType == 'Column'
        );
        this.rows.forEach((row, rowId) => {
          this.columns.forEach((col, colid) => {
            if (!this.gridData[rowId]) this.gridData[rowId] = {};
          this.gridData[rowId]['column_' + colid] = `{{${this.template.id}_${this.tagDetail.group_id}_${this.tagDetail.grid_id}_${col.group_id}_${row.group_id}_1}}`;
          });
        });

        this.columnHeaders = this.columns.map((data) => data.name);
        this.rowHeaders = this.rows.map((data) => data.name);

        this.columns.forEach((col) => {
          col['datatype'] = 'text';
          col['readOnly'] = false;
        });
        this.dynamic_element = res.dynamic_element;
        this.dataset = this.gridData;
      });
  }

  copyTags(type: string) {
    const message = type + ' tag(s) successfully copied';
    this.toaster.success('success', message);
  }
}
