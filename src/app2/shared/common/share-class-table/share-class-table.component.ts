import { HttpClient } from '@angular/common/http';
import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import * as moment from 'moment';
import { ToastrService } from 'ngx-toastr';
import { BaseDataService } from 'src/app2/services/base-data.service';
import { ShareClassTableService } from 'src/app2/services/share-class-table.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import Handsontable from 'handsontable';
import { isNumeric } from 'src/app2/shared/common/hands-on-table/validators/numericValidator';
import { ErrorStatusCode, ProprietoryLicenses } from '../../constants/constant';

function customRenderer(
  instance: any,
  td: any,
  row: any,
  col: any,
  prop: any,
  value: string | number,
  cellProperties: any
) {
  Handsontable.renderers.NumericRenderer.apply(this, arguments);
  if (value == null || value === '') {
    return;
  }
  value = Number(value);
  if (isNaN(value)) {
    return;
  }
  if (value < 0) {
    td.classList.remove('text-success');
    td.classList.add('text-danger');
  } else if (value > 0) {
    td.classList.remove('text-danger');
    td.classList.add('text-success');
  }
  //using the '%' in format attribute will multiply by 100
  td.innerText = `${value.toFixed(2)} %`;
  return td;
}
Handsontable.renderers.registerRenderer('percentageRenderer', customRenderer);

@Component({
  selector: 'app-share-class-table',
  templateUrl: './share-class-table.component.html',
  styleUrls: ['./share-class-table.component.css'],
})
export class ShareClassTableComponent implements OnInit {
  @Input() resource;
  @Input() shareClass;
  @Input() readonly;
  @Input() shareClassTableId;
  @Input() additionalHandsonTableSettings: any = {};
  @Input() restrictHeight: boolean = false;
  datarows;
  hotInstance;
  handsontable_settings;
  rows;
  columns = [];
  // rowHeaders = [];
  instance_id;
  share_class_table;
  @ViewChild('container') container;
  start_index: { row: number; col: number };
  end_index: { row: number; col: number };
  is_saving_table: boolean = false;
  initial_state: string;
  is_table_state_changed: boolean = false;
  @Output() has_unsaved_changes = new EventEmitter();
  constructor(
    private readonly toaster: ToastrService,
    private readonly BaseDataService: BaseDataService,
    private readonly SweetAlert: SweetAlertService,
    private readonly ShareClassTableFactory: ShareClassTableService,
    private readonly http: HttpClient
  ) {}

  onAfterChange = (changes) => {
    if (changes) {
      let is_revalidation_required = false;
      let hot_data = this.hotInstance.getData();
      changes.forEach((change) => {
        const [row_idx, val_prop, old_value, new_value] = change;
        let col_idx = this.hotInstance.propToCol(val_prop);

        if (this.isEmptyValue(old_value) && !this.isEmptyValue(new_value)) {
          // If the new value entered is for a cell before the starting cell in current range of values
          // then consider the new cell as the starting cell.
          if (
            this.start_index == null ||
            this.start_index.row == -1 ||
            this.start_index.row < row_idx ||
            (this.start_index.row == row_idx && this.start_index.col > col_idx)
          ) {
            this.start_index = { row: row_idx, col: col_idx };
            is_revalidation_required = true;
          }

          // If the new value entered is for a cell after the ending cell in current range of values
          // then consider the new cell as the ending cell.
          if (
            this.end_index == null ||
            this.end_index.row == -1 ||
            this.end_index.row > row_idx ||
            (this.end_index.row == row_idx && this.end_index.col < col_idx)
          ) {
            this.end_index = { row: row_idx, col: col_idx };
            is_revalidation_required = true;
          }
        } else if (this.isEmptyValue(new_value)) {
          // If the cell being cleared is the current starting cell, compute the new starting cell
          if (
            row_idx == this.start_index.row &&
            col_idx == this.start_index.col
          ) {
            this.start_index = this.getStartIndex(hot_data);
            is_revalidation_required = true;
          }

          // If the cell being cleared is the current ending cell, compute the new ending cell
          if (row_idx == this.end_index.row && col_idx == this.end_index.col) {
            this.end_index = this.getEndIndex(hot_data);
            is_revalidation_required = true;
          }
        }

        if (this.isEmptyValue(new_value) || isNumeric(new_value)) {
          // Recompute the row total if the cell is cleared or if the updated value is a number
          const row = this.hotInstance.getSourceDataAtRow(row_idx);
          this.ShareClassTableFactory.computeTotal(row, this.share_class_table);
        }
      });

      // If starting or ending cells have changed due to the table changes, trigger validation again.
      if (is_revalidation_required) {
        this.hotInstance.validateCells();
      }

      // Render is required to apply the new totals that are computed
      this.hotInstance.render();

      let hot_data_with_years = hot_data.concat(
        this.hotInstance.getRowHeader()
      );

      this.handleStateChange(hot_data_with_years);
    }
  };

  handleStateChange(hot_data_with_years) {
    if (
      !this.is_table_state_changed &&
      this.initial_state != JSON.stringify(hot_data_with_years)
    ) {
      this.is_table_state_changed = true;
      this.has_unsaved_changes.emit(this.is_table_state_changed);
    } else if (
      this.is_table_state_changed &&
      this.initial_state == JSON.stringify(hot_data_with_years)
    ) {
      this.is_table_state_changed = false;
      this.has_unsaved_changes.emit(this.is_table_state_changed);
    }
  }

  saveTable(hot_instance) {
    let source_data = hot_instance.getSourceData();
    hot_instance.validateCells((isValid) => {
      if (isValid) {
        let values = [];
        let missing_years = [];
        let current_year;
        source_data.reverse().forEach((row) => {
          Object.keys(row).forEach((col) => {
            if (
              row[col] != null &&
              row[col].value != null &&
              row[col].value != undefined &&
              !row[col].is_total_cell
            ) {
              values.push({
                start_date: row[col].start_date,
                end_date: row[col].end_date,
                value: row[col].value,
              });

              let new_value_year = moment(row[col].start_date).year();
              if (
                current_year &&
                new_value_year != current_year &&
                new_value_year != current_year + 1
              ) {
                for (
                  let year = current_year + 1;
                  year < new_value_year;
                  year++
                ) {
                  missing_years.push(year);
                }
              }

              current_year = new_value_year;
            }
          });
        });

        if (values && values.length > 0 && missing_years.length == 0) {
          this.is_saving_table = true;
          this.http
            .put(
              `AumTrackRecordDefinitions/${this.share_class_table.id}/bulk_update_values`,
              values
            )
            .subscribe(
              (response) => {
                this.toaster.success('', 'Your changes have been saved', {
                  timeOut: 1500,
                });
                this.is_saving_table = false;
                this.is_table_state_changed = false;
                this.has_unsaved_changes.emit(this.is_table_state_changed);
                this.initial_state = JSON.stringify(
                  this.hotInstance
                    .getData()
                    .concat(this.hotInstance.getRowHeader())
                );
              },
              (err) => {
                if (
                  !(
                    err &&
                    err.status &&
                    Object.values(ErrorStatusCode).includes(err.status)
                  )
                ) {
                  this.toaster.error(
                    '',
                    'Something went wrong while saving values. Please try again.',
                    {
                      timeOut: 1500,
                    }
                  );
                }
                this.is_saving_table = false;
              }
            );
        } else if (missing_years.length > 0) {
          this.SweetAlert.error({
            title: 'Invalid input',
            text:
              'The data for year(s) ' +
              missing_years.join(', ') +
              ' is missing. Please enter the missing data and try again.',
          });
        } else {
          this.SweetAlert.error({
            title: 'Invalid input',
            text: 'The table cannot be empty.',
          });
        }
      } else {
        this.SweetAlert.error({
          title: 'Invalid input',
          text: 'The provided data is invalid. Please resolve the errors and try again.',
        });
      }
    });
  }

  isEmptyValue(value) {
    return !(
      value != null &&
      ((typeof value == 'string' && value.trim().length > 0) ||
        typeof value != 'string')
    );
  }

  // Returns the row and column index of the first cell in chronological order with value
  getStartIndex(data) {
    let row = -1;
    let col = -1;

    if (data) {
      for (let i = data.length - 1; i >= 0 && row == -1; i--) {
        if (data[i]) {
          for (let j = 0; j < data[i].length; j++) {
            if (!this.isEmptyValue(data[i][j]) && !this.columns[j].readOnly) {
              row = i;
              col = j;
              break;
            }
          }
        }
      }
    }

    return { row, col };
  }

  // Returns the row and column index of the last cell in chronological order with value
  getEndIndex(data) {
    let row = -1;
    let col = -1;

    if (data) {
      for (let i = 0; i < data.length && row == -1; i++) {
        if (data[i]) {
          for (let j = data[i].length - 1; j >= 0; j--) {
            if (!this.isEmptyValue(data[i][j]) && !this.columns[j].readOnly) {
              row = i;
              col = j;
              break;
            }
          }
        }
      }
    }

    return { row, col };
  }

  beforeValidate = (val, row_idx, prop) => {
    let col_idx = this.hotInstance.propToCol(prop);

    // Only validate the cells within the starting cell to ending cell range (cells with values)
    if (
      !(
        (row_idx < this.start_index.row ||
          (row_idx == this.start_index.row &&
            col_idx >= this.start_index.col)) &&
        (row_idx > this.end_index.row ||
          (row_idx == this.end_index.row && col_idx <= this.end_index.col))
      )
    ) {
      return 0;
    } else {
      if (this.columns[col_idx].readOnly) {
        return 0;
      }
    }
  };

  rowHeaders = (idx) => {
    if (this.hotInstance) {
      return this.hotInstance.getSourceDataAtRow(idx).year;
    }
    return '';
  };

  onBeforeRemoveRow = (rowIdx, amount, physicalRows) => {
    const removable_rows = [];
    physicalRows.forEach((rowIndex) => {
      const removable_row = this.hotInstance.getSourceDataAtRow(rowIndex);
      removable_row.idx = rowIndex;
      removable_rows.push(removable_row);
    });
    if (removable_rows[0].is_deleted) {
      return true;
    }
    this.confirmRowDeletion(
      removable_rows,
      this.share_class_table,
      this.hotInstance
    );
    return false;
  };

  cells = (row_idx, col_idx) => {
    let cell_properties;
    if (this.share_class_table.type === 'track_record') {
      cell_properties = { renderer: 'percentageRenderer' };
    } else {
      cell_properties = {};
    }
    const today = moment();
    const row = this.hotInstance.getSourceDataAtRow(row_idx);
    if (!row) {
      return;
    }
    if (row.year !== today.year()) {
      return cell_properties;
    }
    const { columns } = this.hotInstance.getSettings();
    const column = columns[col_idx];
    // column is usually not available when the nghandontable directive is being destroyed
    if (!column) {
      return;
    }
    const cell = this.hotInstance.getSourceDataAtCell(row_idx, column.title);
    if (moment(cell.end_date).month() > today.month()) {
      cell_properties.editor = false;
      cell_properties.className = 'htDimmed';
    }
    return cell_properties;
  };

  beforeChange = (changes, source) => {
    for (let i = 0; i < changes.length; i++) {
      let [row, prop,] = changes[i];
      // prevent creation of new rows when data posted is more than rows available in the table
      if (row >= this.hotInstance.countRows()) {
        changes[i] = null;
        continue;
      }
      let cellMeta = this.hotInstance.getCellMeta(
        row,
        this.hotInstance.propToCol(prop)
      );
      // prevent pasting or any other change to disabled cells (typically, future date range cells)
      if (cellMeta.readOnly || !cellMeta.editor) {
        changes[i] = null;
        continue;
      }

      if (
        changes[i].length > 3 &&
        (changes[i][3] == '' || changes[i][3] == null)
      ) {
        changes[i][3] = undefined;
      }
    }
  };

  ngOnInit() {
    // directive render
    this.share_class_table = this.resource;
    this.instance_id =
      this.shareClassTableId || `share-class-table-${this.resource.id}`;
    this.getShareClassTableValues(this.resource).subscribe((table_values) => {
      this.rows = this.ShareClassTableFactory.getRows(
        this.resource,
        table_values,
        this.shareClass
      ).reverse();
      const columns = this.ShareClassTableFactory.getColumns(
        this.resource,
        false,
        this.readonly
      );
      // this.rows.forEach((row) => {
      //   this.rowHeaders.push(row.year.toString());
      // });
      columns.forEach((column) => {
        this.columns.push({
          data: `${column.name}.value`,
          type: 'numeric',
          title: column.name,
          readOnly: column.readonly,
          numericFormat: {
            pattern: '0,0.00',
            culture: 'en-US',
          },
          className: 'htCenter',
          validator: (query, callback) => {
            let isValid =
              query != null &&
              query != undefined &&
              query.toString().length > 0;

            if (isValid) {
              isValid = isNumeric(query);
            }

            if (isValid) {
              let decimalPart = query.toString().split('.')[1];
              if (decimalPart && decimalPart.length > 4) isValid = false;
            }

            callback(isValid);
          },
        });
      });
      this.handsontable_settings = {
        data: this.rows,
        hotId: this.instance_id,
        columns: this.columns,
        licenseKey: ProprietoryLicenses.HANDSONTABLE, // for non-commercial use only
        contextMenu: this.readonly
          ? null
          : ['remove_row', '---------', 'undo', 'redo'],
        stretchH: 'all',
        colHeaders: true,
        afterChange: this.onAfterChange,
        rowHeaders: this.rowHeaders,
        beforeValidate: this.beforeValidate,
        beforeChange: this.beforeChange,
        ...this.additionalHandsonTableSettings,
      };

      if (this.restrictHeight) {
        this.handsontable_settings.height =
          this.rows?.length > 20 ? '500' : 'auto';
      }

      this.hotInstance = new Handsontable(
        this.container.nativeElement,
        this.handsontable_settings
      );
      this.hotInstance.updateSettings({
        rowHeaders: this.rowHeaders,
        cells: this.cells,
      });
      this.hotInstance.addHook('beforeRemoveRow', this.onBeforeRemoveRow);
      let hot_data = this.hotInstance.getData();
      this.start_index = this.getStartIndex(hot_data);
      this.end_index = this.getEndIndex(hot_data);
      this.initial_state = JSON.stringify(
        hot_data.concat(this.hotInstance.getRowHeader())
      );
    });
  }

  getShareClassTableValues(share_class_table: { id: any }) {
    return this.BaseDataService.getShareClassTableValues(share_class_table.id);
  }

  initializeRowWithCells(row, share_class_table) {
    const columns = this.ShareClassTableFactory.getColumns(share_class_table);
    const { year } = row;
    columns.forEach((column) => {
      const { start_month_idx } = column;
      const { end_month_idx } = column;
      const cell: any = this.ShareClassTableFactory.createNewCell(
        year,
        start_month_idx,
        end_month_idx,
        share_class_table.id
      );
      if (cell.is_total_cell) {
        row.total_cell = cell;
      }
      row[column.name] = cell;
    });
  }

  generateInsertionArray(rowIdx, row) {
    const list = [];
    Object.entries(row).forEach(([key, item]) => {
      list.push([rowIdx, key, item]);
    });
    return list;
  }

  confirmRowDeletion(rows, share_class_table, hot_instance) {
    let title;
    switch (share_class_table.type) {
      case 'aum':
        title = `Are you sure you want to remove aum values for the years ${
          rows[0].year
        } to ${rows[rows.length - 1].year}?`;
        break;
      case 'track_record':
        title = `Are you sure you want to remove track record values for the years ${
          rows[0].year
        } to ${rows[rows.length - 1].year}?`;
        break;
    }
    this.SweetAlert.confirm({
      title,
      showLoaderOnConfirm: true,
      focusCancel: true,
      preConfirm: () => {
        this.commitRowDeletion(rows, share_class_table, hot_instance);
      },
    });
  }

  commitRowDeletion(rows, share_class_table, hot_instance) {
    const toDelete = [];
    rows.forEach((row) => {
      hot_instance.setSourceDataAtCell(row.idx, 'is_deleted', true);
      toDelete.push([row.idx, 1]);
    });
    hot_instance.alter('remove_row', toDelete);
    let hot_data = this.hotInstance.getData();
    this.start_index = this.getStartIndex(hot_data);
    this.end_index = this.getEndIndex(hot_data);
    hot_instance.validateCells();
    let hot_data_with_years = hot_data.concat(this.hotInstance.getRowHeader());
    this.handleStateChange(hot_data_with_years);
  }

  addRowsSinceInception(hot_instance) {
    this.SweetAlert.input({
      title: 'Enter the inception year',
      input: 'text',
      showCancelButton: true,
      closeOnConfirm: false,
    }).then(async (response) => {
      if (response.value) {
        const regex = /^\d{4}$/;
        const is_valid_four_digit_number = regex.test(response.value);
        let inception_year = Number(response.value);
        const rows = hot_instance.getSourceData();
        const existing_years = rows.map((row) => row.year);
        if (!is_valid_four_digit_number) {
          this.SweetAlert.error({
            title: 'Invalid input',
            text: 'Enter a valid inception year',
          });
        } else if (inception_year > moment().year()) {
          this.SweetAlert.error({
            title: 'Imaginary input',
            text: 'You cannot enter returns for a future year',
            confirmButtonText: 'Okay',
          });
        } else {
          const current_year = moment().year();
          if (inception_year < 1940) {
            inception_year = 1940;
          }
          const total_years_to_add = current_year - inception_year;
          let i = 0;
          while (i <= total_years_to_add) {
            var year = inception_year + i;
            if (existing_years.includes(year)) {
              ++i;
            } else {
              let row_index = this.getRowIdxToInsert(existing_years, year);
              hot_instance.alter('insert_row', row_index);
              this.initializeRow(row_index, year);
              ++i;
            }
          }
          let hot_data = this.hotInstance.getData();
          this.start_index = this.getStartIndex(hot_data);
          this.end_index = this.getEndIndex(hot_data);
          hot_instance.validateCells();
        }
      }
    });
  }

  addRowForSpecificYear(hot_instance) {
    this.SweetAlert.input({
      title: 'Enter the year',
      input: 'text',
      showCancelButton: true,
      closeOnConfirm: false,
    }).then((response) => {
      if (response.value) {
        const regex = /^\d{4}$/;
        const is_valid_four_digit_number = regex.test(response.value);
        const year = Number(response.value);
        const rows = hot_instance.getSourceData();
        const existing_years = rows.map((row) => row.year);
        if (!is_valid_four_digit_number) {
          this.SweetAlert.error({
            title: 'Invalid input',
            text: 'Enter a valid year',
          });
        } else if (year > moment().year()) {
          this.SweetAlert.error({
            title: 'Imaginary input',
            text: 'You cannot enter returns for a future year',
            confirmButtonText: 'Okay',
          });
        } else if (existing_years.includes(year)) {
          this.SweetAlert.error({
            title: 'Duplicate input',
            text: 'You already have a row for this year',
            confirmButtonText: 'Okay',
          });
        } else {
          let row_index = this.getRowIdxToInsert(existing_years, year);
          hot_instance.alter('insert_row', row_index);
          this.initializeRow(row_index, year);
          let hot_data = this.hotInstance.getData();
          this.start_index = this.getStartIndex(hot_data);
          this.end_index = this.getEndIndex(hot_data);
          hot_instance.validateCells();
        }
      }
    });
  }

  initializeRow(row_index, year) {
    const inserted_row = this.hotInstance.getSourceDataAtRow(row_index);
    inserted_row.year = year;
    this.initializeRowWithCells(inserted_row, this.share_class_table);
    this.hotInstance.setSourceDataAtCell(
      this.generateInsertionArray(row_index, inserted_row)
    );
  }

  getRowIdxToInsert(years, year) {
    if (!years || years.length == 0) {
      return 0;
    }

    if (years[0] < year) {
      return 0;
    } else if (years[years.length - 1] > year) {
      return years.length;
    } else {
      for (let i = 0; i < years.length; i++) {
        if (years[i] < year && years[i - i] > year) {
          return i;
        }
      }
    }
  }
}
