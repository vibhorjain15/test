import {
  Component,
  Input,
  OnInit,
  ViewChild,
  NgZone,
  Renderer2,
} from '@angular/core';
import { HotTableRegisterer } from '@handsontable/angular';
import Handsontable from 'handsontable';
import { HyperFormula } from 'hyperformula';
import { ToastrService } from 'ngx-toastr';
import { copyHtml } from '../../../../app2/modules/questionnaire/util/copy-html.util';
import { ClipboardService } from 'ngx-clipboard';
import { deepCopy } from '@angular-devkit/core/src/utils/object';
import tippy from 'tippy.js';
import { ProprietoryLicenses } from '../../constants/constant';
// import Popper from 'popper.js';

@Component({
  selector: 'dv-table-view-grid',
  templateUrl: './dv-table-view-grid.component.html',
  styleUrls: ['./dv-table-view-grid.component.css'],
})
export class DvTableViewGridComponent implements OnInit {
  hotRegisterer = new HotTableRegisterer();
  @Input() id;
  @Input() dataset = [];
  validator: any[] = [];
  @Input() rows;
  @Input() columns;
  @Input() excelFormulaOnly: boolean = false;
  @Input() rowWidth: number = 150;
  @Input() columWidth: number = 300;
  @Input() validatorFunction: (value, instance) => boolean;
  @Input() isValidator: boolean;
  @Input() columnHeaders?: any;
  @Input() rowHeaders?: any;
  dynaID = '';
  genDynaID = '';
  hotSettings: Handsontable.GridSettings;
  cellData: any = [];
  @ViewChild('tagsTable') tagsTable;

  constructor(
    private readonly toaster: ToastrService,
    private readonly clipboard: ClipboardService,
    private readonly ngZone: NgZone,
    private renderers: Renderer2
  ) {
    this.renderer = this.renderer.bind(this);
  }

  ngOnInit(): void {
    // this.renderer = this.renderer.bind(this);
    this.dataset.forEach((el: any, i: any) => {
      var e = Object.values(el);
      this.cellData.push(e);
    });
    this.dynaID = `${this.id}_1`;
    this.genDynaID = `#${this.id}_1`;
    let dynamicColWidth =
      this.columns.length == 1
        ? 600
        : this.columns.length == 2
        ? 300
        : 700 / this.columns.length;
    this.hotSettings = {
      data: [],
      height: this.getHeight(),
      width: '100%',
      rowHeaderWidth: this.rowWidth,
      colWidths:
        dynamicColWidth > this.columWidth ? dynamicColWidth : this.columWidth,
      colHeaders: true,
      rowHeaders: this.rowHeaders,
      maxRows: this.rows.length,
      columns: this.columns.map((column, index) => {
        return {
          data: `column_${index}`,
          type: column.datatype,
          readOnly: column.readOnly,
          title: this.columnHeaders[index],
          renderer: this.renderer,
          editor: false,
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
      licenseKey: ProprietoryLicenses.HANDSONTABLE,
      formulas: {
        engine: HyperFormula,
      },
      copyPaste: true,
      beforeChange: function (changes) {
        let row = changes[0][0];
        let col = changes[0][1];
        this.setSourceDataAtCell(row, col, changes[0][3]);
      },
    };
  }

  renderer(instance, td, row, col, prop, value, cellProperties) {
    const self = this;
    Handsontable.renderers.TextRenderer.apply(this, arguments);
    let sourceData = instance.getSourceDataAtCell(row, col);
    const button = this.renderers.createElement('button');
    button.className = ' btn';
    button.className += ' btn-default';
    button.className += ' space-on-right-lg';
    button.className += ' sm copyTable';
    button.innerHTML =
      "<icon appicon='' name='copy' class='dvi dvi-copy'></icon>";

    button.addEventListener('click', (e) => {
      navigator.clipboard.writeText(sourceData);
      this.ngZone.run(() => {
        self.toaster.success('Response copied to clipboard');
      });
    });

    const tooltipContent = 'Copy Cell';
    tippy(button, {
      content: tooltipContent,
    });

    // Initialize Popper.js for the tooltip
    // const tooltip = new Popper(button, button.nextElementSibling, {
    //   placement: 'bottom',
    // });

    // Clean up the tooltip when the cell is destroyed
    // instance.addHookOnce('afterDestroy', () => {
    //   tooltip.destroy();
    // });

    td.innerHTML = `${sourceData}`;
    td.appendChild(button);

    return td;
  }

  getHeight() {
    let height;
    if (this.rows.length == 0) {
      height = 50;
    } else if (this.rows.length > 0 && this.rows.length < 6) {
      height = this.rows.length * 25 + 150;
    } else if (this.rows.length < 20 && this.rows.length > 5) {
      height = this.rows.length * 25;
    } else {
      height = 500;
    }
    return height;
  }

  getSimpleTable(data, alldata) {
    let gridData = data;
    // Create an HTML string representing the table structure
    let html = '<table border="1">';
    html += '<tr><td></td>';
    for (let k = 0; k < alldata.settings.columns.length; k++) {
      html += '<td>' + alldata.settings.columns[k].title + '</td>';
    }
    html += '</tr>';
    for (let i = 0; i < gridData.length; i++) {
      html += '<tr>';
      let rowheader = alldata.settings.rowHeaders[i];
      html += '<td>' + rowheader + '</td>';
      // }
      gridData[i] = Object.values(gridData[i]);
      for (let j = 0; j < gridData[i].length; j++) {
        let data = gridData[i][j] || '';
        html += '<td>' + data + '</td>';
      }
      html += '</tr>';
    }
    html += '</table>';
    return html;
  }

  copyTable() {
    let data = deepCopy(this.tagsTable.data);
    copyHtml(
      this.getSimpleTable(data, this.tagsTable),
      this.clipboard,
      this.toaster
    );
  }
}
