import { AfterViewInit, Component, Input, OnInit } from '@angular/core';
import { HotTableRegisterer } from '@handsontable/angular';
import Handsontable from 'handsontable';
import { HyperFormula } from 'hyperformula';
import { UtilsService } from 'src/app2/services/utils.service';

@Component({
  selector: 'dv-handsontable',
  templateUrl: './dv-handsontable.component.html',
  styleUrls: ['./dv-handsontable.component.css'],
})
export class DvHandsontableComponent implements OnInit, AfterViewInit {
  hotRegisterer = new HotTableRegisterer();
  @Input() id;
  @Input() dataset = [];
  validator: any[] = [];
  @Input() rows;
  @Input() columns;
  @Input() excelFormulaOnly: boolean = false;
  @Input() rowWidth: number = 150;
  @Input() columWidth: number = 150;
  @Input() validatorFunction: (value, instance) => boolean;
  @Input() isValidator: boolean;
  @Input() columnHeaders?: any;
  @Input() rowHeaders?: any;
  hotSettings: Handsontable.GridSettings;
  constructor(private readonly utils: UtilsService) {}
  ngOnInit(): void {
    let dynamicColWidth = 700 / this.columns.length;
    let that = this;
    this.hotSettings = {
      data: [],
      height: this.rows.length * 21 + 60,
      width: 'auto',
      autoRowSize: true,
      rowHeaderWidth: this.rowWidth,
      colWidths:
        dynamicColWidth > this.columWidth ? dynamicColWidth : this.columWidth,
      colHeaders: true,
      rowHeaders: this.rowHeaders
        ? this.rowHeaders.map((data, index) => data + ` (${index + 1})`)
        : true,
      maxRows: this.rows.length,
      columns: this.columns.map((column, index) => {
        return {
          data: `column_${index}`,
          type: column.datatype,
          readOnly: column.readOnly,
          title:
            (this.columnHeaders[index] ? this.columnHeaders[index] : '') +
            ` (${this.utils.getExcelColumnName(index)})`,
          renderer: this.excelFormulaOnly ? this.renderer : '',
          validator: function (value, callback) {
            if (!that.isValidator) callback(true);
            else callback(that.validatorFunction(value, this));
          },
        };
      }),
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
      licenseKey: 'non-commercial-and-evaluation',
      formulas: {
        engine: HyperFormula,
      },
      copyPaste: true,
      afterValidate: (isValid, value, row, prop, source) => {
        if (!this.validator[row]) this.validator[row] = [];
        this.validator[row][prop] = isValid;
      },
      beforeChange: function (changes) {
        let row = changes[0][0];
        let col = changes[0][1];
        this.setSourceDataAtCell(row, col, changes[0][3]);
      },
    };
  }
  ngAfterViewInit(): void {}

  isValid() {
    for (const row of Object.values(this.validator)) {
      for (const col of Object.values(row)) {
        if (!col) {
          return false;
        }
      }
    }
    return true;
  }

  renderer(instance, td, row, col, prop, value, cellProperties) {
    Handsontable.renderers.TextRenderer.apply(this, arguments);
    let sourceData = instance.getSourceDataAtCell(row, col);
    if (
      sourceData != null &&
      sourceData != undefined &&
      value != null &&
      (!value.toString().startsWith('#') ||
        value.toString() == '#VALUE!' ||
        value.toString() == '#DIV/0!' ||
        value.toString() == '#N/A')
    ) {
      td.innerHTML = sourceData;
    }
    return td;
  }

  getSourceData() {
    return this.hotRegisterer.getInstance(this.id).getSourceData();
  }

  copyTable() {
    let col = this.hotRegisterer.getInstance(this.id).countCols();
    let row = this.hotRegisterer.getInstance(this.id).countRows();
    this.hotRegisterer.getInstance(this.id).selectCell(0, 0, row - 1, col - 1);
    document.execCommand('copy');
  }
}
