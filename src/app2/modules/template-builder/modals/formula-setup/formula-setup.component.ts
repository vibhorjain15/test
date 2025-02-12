import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { RouterService } from 'src/app2/services/router.service';
import { TemplateService } from 'src/app2/apis/template/template.service';
import { ToastrService } from 'ngx-toastr';
import { Store } from '@ngxs/store';
import {
  UpdateLocalQuestion,
  UpdateQuestion,
} from '../../store/template-builder.action';
import { DvHandsontableComponent } from 'src/app2/shared/components';
import customFormulaRenderer from 'src/app2/shared/common/hands-on-table/renderers/formulaRenderer';
import { customFormulaValidatorFunction } from 'src/app2/shared/common/hands-on-table/validators/formulaValidator';
import { UtilsService } from 'src/app2/services/utils.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { catchError } from 'rxjs/operators';
import { handelConflict } from '../../store/template-builder.util';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { NEVER } from 'rxjs';
import { responseTypeList } from '../../constants/responseType.constant';
import { CacheUtil } from 'src/app2/modules/questionnaire/service/cache.service';
@Component({
  selector: 'formula-setup',
  templateUrl: './formula-setup.component.html',
  styleUrls: ['./formula-setup.component.css'],
})
export class FormulaSetupComponent implements OnInit, AfterViewInit {
  loading = false;
  @Input() question: any;
  rows: any[] = [];
  columns: any[] = [];
  grid_values: any[] = [];
  aggregation_values: any[] = [];
  grid_responses: any = [];
  dynamic_element: any;
  gridData: any[] = [];
  rowHeaders: any[];
  columnHeaders: any[];
  dataset: any[] = [];
  additionalHandsOnTableSettings: any = {
    height: 'auto',
  };
  enable_aggregration: boolean = false;
  aggregation_form;
  rows_and_columns_backup;
  @ViewChild(DvHandsontableComponent) handsontable: DvHandsontableComponent;
  @ViewChild('formulaTable') formulaTableRef: ElementRef;

  id = 'hotInstance';
  constructor(
    private readonly templateService: TemplateService,
    private readonly toast: ToastrService,
    private readonly store: Store,
    private readonly utils: UtilsService,
    private routerService: RouterService,
    private sweetAlertService: SweetAlertService,
    private toaster: ToastrService,
    private cache: CacheUtil
  ) {}
  ngOnInit(): void {
    this.aggregation_form = new FormGroup({
      aggregation_name: new FormControl(null, [Validators.required]),
    });
    this.templateService
      .getQuestionsGrid(this.question.grid_id, this.question.grid_version)
      .subscribe((res: any) => {
        this.rows_and_columns_backup = res;
        this.rows = res.rows_columns.filter(
          (data) => data.elementType == 'Row'
        );
        this.columns = res.rows_columns.filter(
          (data) => data.elementType == 'Column'
        );
        this.grid_values = res.formulas_json
          ? JSON.parse(res.formulas_json)
          : [];

        if (res.aggregation_json) {
          this.enable_aggregration = true;
          let aggregation_json = JSON.parse(res.aggregation_json);
          let aggregation_row_name = aggregation_json.row_name;
          this.aggregation_form.patchValue({
            aggregation_name: aggregation_row_name,
          });
          this.aggregation_values = aggregation_json.values;
        } else {
          this.enable_aggregration = false;
          this.aggregation_values = [];
        }

        if (this.rows.length == 0) {
          this.rows = [
            {
              id: 1,
              name: 'Row 1',
              elementType: 'Row',
              grid_id: this.question.grid_id,
              order: 1,
            },
          ];
        }

        if (
          this.grid_values.length &&
          this.rows.length * this.columns.length === this.grid_values.length
        ) {
          this.grid_values.forEach((data) => {
            if (!this.gridData[data.row_id]) this.gridData[data.row_id] = {};
            this.gridData[data.row_id]['column_' + data.column_id] = data.value
              ? data.value
              : null;
          });
        } else {
          this.rows.forEach((row, rowId) => {
            this.columns.forEach((col, colid) => {
              if (!this.gridData[rowId]) this.gridData[rowId] = {};
              if (this.grid_values.length) {
                const grid_response = this.grid_values.find(
                  (gridValue) =>
                    gridValue.row_id === rowId && gridValue.column_id === colid
                );
                this.gridData[rowId]['column_' + colid] =
                  grid_response?.value ?? null;
              } else {
                this.gridData[rowId]['column_' + colid] = null;
              }
            });
          });
        }

        if (this.enable_aggregration) {
          this.updateAggregationRows(this.gridData);
        }

        this.columnHeaders = this.columns.map((data) => data.name);
        this.rowHeaders = this.rows.map((data) => data.name);

        this.columns.forEach((col) => {
          col['datatype'] = 'text';
          col['readOnly'] =
            col.type == 'dropdown' || col.type == 'date' ? true : false;
        });
        this.dynamic_element = res.dynamic_element;
        this.dataset = this.gridData;
        let handsOnTableColumns = this.getHandsOnTableColumns();
        let columnWidth =
          this.columns.length < 6 &&
          this.formulaTableRef?.nativeElement &&
          this.formulaTableRef?.nativeElement?.clientWidth > 0
            ? (this.formulaTableRef.nativeElement.clientWidth - 155) /
              (this.columns.length || 1)
            : 150;
        this.additionalHandsOnTableSettings = {
          ...this.additionalHandsOnTableSettings,
          columns: handsOnTableColumns,
          rowHeaders: this.rowHeaders.map((row, index) => {
            if (row != 'Aggregation') return row + ` (${index + 1})`;
            else return row;
          }),
          colWidths: columnWidth,
        };
        this.addAfterCopy();
        this.beforeChangeFunction();
      });
  }
  ngAfterViewInit(): void {}

  handle409Error = catchError((error) => {
    this.loading = false;
    handelConflict(
      error,
      this.routerService.getState().params.templateId,
      this.sweetAlertService,
      this.routerService,
      () => this.toaster.error(error.message.errorMessage)
    );
    return NEVER;
  });

  handleSave(close) {
    this.loading = true;
    let flag = this.handsontable.isValid();
    let aggValid = this.aggregationValid();
    this.aggregation_form.markAllAsTouched();
    if (!flag) {
      this.toast.error('Please enter valid formulas');
      this.loading = false;
    } else if (!aggValid) {
      this.loading = false;
    } else {
      let payload = [];
      let flag = 0;
      let data = this.handsontable.getSourceData();
      data.forEach((row, RowIndex) => {
        Object.values(row).forEach((col, ColIndex) => {
          if (col) {
            flag = 1;
            payload.push({
              row_id: RowIndex,
              column_id: ColIndex,
              value: col,
            });
          } else
            payload.push({
              row_id: RowIndex,
              column_id: ColIndex,
            });
        });
      });
      let payload1 = {
        formulas_json: null,
        aggregation_json: null,
      };
      let hasAggregationData = false;
      if (flag) {
        if (this.enable_aggregration) {
          let aggregation_json = [];
          let aggIndex = payload.length - this.columns.length;
          this.columns.forEach((column) => {
            if (payload[aggIndex].value) hasAggregationData = true;
            aggregation_json.push(payload[aggIndex]);
            payload.splice(aggIndex, 1);
          });
          if (hasAggregationData)
            payload1.aggregation_json = JSON.stringify({
              values: aggregation_json,
              row_name: this.aggregation_form.value['aggregation_name'],
            });
          else this.toast.error('Please add aggregation formulas.');
        }
        payload1.formulas_json = JSON.stringify(payload);
      }
      if (!hasAggregationData && this.enable_aggregration) {
        this.loading = false;
        return;
      }
      if (
        this.rows_and_columns_backup.formulas_json != payload1.formulas_json ||
        this.rows_and_columns_backup.aggregation_json !=
          payload1.aggregation_json
      ) {
        let gridParams = {
          template_id: this.routerService.getState().params.templateId,
          dataType: this.rows_and_columns_backup.dataType,
          dynamic_element: this.rows_and_columns_backup.dynamic_element,
          formulas_json: payload1.formulas_json,
          aggregation_json: payload1.aggregation_json,
          id: this.rows_and_columns_backup.id,
          version: this.rows_and_columns_backup.version,
          question_id: this.question.id,
          rows_columns: this.rows_and_columns_backup.rows_columns,
        };
        this.templateService
          .createQuestionsGrid(gridParams)
          .pipe(this.handle409Error)
          .subscribe(
            (res: any) => {
              let has_formulas = !(res.formulas_json == null);
              this.store.dispatch(
                new UpdateLocalQuestion(this.question.id, {
                  has_formulas: has_formulas,
                })
              );
              // Update grid structure in the cache if available
              let accessId = `${this.question.sequenceID}-${this.question.sectionID}-${this.question.id}`;
              this.cache.GRIDCACHE[accessId] = res;
              let params = {
                is_mandatory: this.question.is_mandatory,
                response_word_limit: this.question.response_word_limit,
                hint_text: this.question.hint_text,
                responseType: responseTypeList.filter(
                  (val) => val.text == this.question.responseType
                )[0].id,
                text: this.question.text,
                grid_id: res.id,
                grid_version: res.version,
                sectionID: this.question.sectionID,
                has_responses: res.has_responses,
              };
              this.toast.success('Formulas saved successfully');
              let apiCall = this.question.parentID
                ? this.templateService.updateQuestions(this.question.id, params)
                : this.store.dispatch(
                    new UpdateQuestion(this.question.id, params)
                  );
              apiCall.pipe(this.handle409Error).subscribe((res: any) => {
                if (params.has_responses)
                  this.toaster.info(
                    "Kindly review and validate responses in questionnaires containing this grid, particularly those with a 'started' status.",
                    'Action Required: Validate Responses'
                  );
                this.toaster.success('Question saved successfully');
                this.loading = false;
                close();
              });
            },
            (error) => {
              this.loading = false;
            }
          );
      } else {
        this.toast.success('Nothing to save');
        this.loading = false;
        close();
      }
    }
  }

  aggregationValid() {
    return (
      (this.enable_aggregration && this.aggregation_form.valid) ||
      !this.enable_aggregration
    );
  }
  handleCopy(close) {
    this.handsontable?.copyTable();
  }

  getHandsOnTableColumns() {
    let is_dynamic = this.question.responseType == 'DynamicGrid';
    let cols = this.columns.map((column, index) => {
      let data: any = {
        data: `column_${index}`,
        type: column.datatype,
        title:
          (column.name ? column.name : '') +
          ` (${this.utils.getExcelColumnName(index)})`,
        readOnly: column.readOnly,
        validator: function (value, callback) {
          callback(customFormulaValidatorFunction(value, this, is_dynamic));
        },
        renderer: customFormulaRenderer,
      };
      data.placeholder = !column.readOnly ? 'Please enter formula' : '';
      return data;
    });
    return cols;
  }

  // this function is to copy and paste raw formula data and not the data computed by that formula (default behaviour is copy pasting computed value  )
  addAfterCopy() {
    this.additionalHandsOnTableSettings = {
      ...this.additionalHandsOnTableSettings,
      beforeCopy: function (data, coords) {
        let dataArray = [];
        let coordinates = coords[0];
        let i = coordinates.startRow;
        while (i <= coordinates.endRow) {
          let rows = [];
          let j = coordinates.startCol;
          while (j <= coordinates.endCol) {
            rows.push(this.getSourceDataAtCell(i, j));
            j++;
          }
          dataArray.push(rows);
          i++;
        }
        dataArray.forEach((row, rowIndex) => {
          row.forEach((col, colIndex) => {
            data[rowIndex][colIndex] = col;
          });
        });
        data;
      },
    };
  }

  beforeChangeFunction() {
    this.additionalHandsOnTableSettings = {
      ...this.additionalHandsOnTableSettings,
      beforeChange: function (changes) {
        let row = changes[0][0];
        let col = changes[0][1];
        this.setSourceDataAtCell(row, col, changes[0][3]);
      },
    };
  }

  updateAggregationRows(gridData) {
    if (this.enable_aggregration) {
      this.rows.push({
        id: 2,
        name: 'Aggregate Row',
        elementType: 'Row',
        grid_id: this.question.grid_id,
        order: 1,
      });
      this.columns.forEach((col, colid) => {
        if (!gridData[this.rows.length - 1])
          gridData[this.rows.length - 1] = {};
        if (this.aggregation_values.length) {
          const grid_response = this.aggregation_values.find(
            (gridValue) =>
              gridValue.row_id === this.rows.length - 1 &&
              gridValue.column_id === colid
          );
          gridData[this.rows.length - 1]['column_' + colid] =
            grid_response?.value ?? null;
        } else {
          gridData[this.rows.length - 1]['column_' + colid] = null;
        }
      });
    } else {
      this.rows.pop();
      gridData.splice(this.rows.length, 1);
    }
    return gridData;
  }

  toggleAggregation(event) {
    let gridData = [...this.gridData];
    gridData = this.updateAggregationRows(gridData);
    this.rowHeaders = this.rows.map((data) => data.name);
    this.dataset = gridData;
    this.additionalHandsOnTableSettings = {
      ...this.additionalHandsOnTableSettings,
      rowHeaders: this.rowHeaders.map((row, index) => {
        if (row != 'Aggregation') return row + ` (${index + 1})`;
        else return row;
      }),
    };
  }
}
