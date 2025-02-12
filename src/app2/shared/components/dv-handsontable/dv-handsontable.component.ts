import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { HotTableRegisterer } from '@handsontable/angular';
import Handsontable from 'handsontable';
import { HyperFormula } from 'hyperformula';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { ProprietoryLicenses } from '../../constants/constant';

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
  @Input() mergeCells;
  @Input() rowWidth: number = 150;
  @Input() columWidth: number = 150;
  @Input() additionalHandsOnTableSettings = {};
  @Input() isFormulaEnabled: boolean = true;
  @Input() rowHeaders: any;
  @Input() autoRowsize: boolean = true;
  @Output() onChange = new EventEmitter();
  @Output() onRowDeletion = new EventEmitter();
  hotSettings: Handsontable.GridSettings;
  rowsToBeDeleted = [];
  formulaValidator = (value, callback) => {
    callback(
      !value ||
        (value.toString().indexOf('ERROR.TYPE') === -1 &&
          !value.toString().startsWith('#'))
    );
  };

  constructor(private readonly SweetAlert: SweetAlertService) {}

  ngOnInit(): void {
    this.updateHotSettings();
  }

  updateHotSettings() {
    this.hotSettings = {
      renderAllRows: false,
      colHeaders: true,
      allowEmpty: true,
      height: 'auto',
      autoRowSize: this.autoRowsize,
      rowHeaderWidth: this.rowWidth,
      colWidths: this.columWidth,
      maxCols: this.columns.length,
      maxRows: this.rows.length ? this.rows.length : 1,
      mergeCells: this.mergeCells,
      width: '100%',
      placeholder: 'Sample text',
      licenseKey: ProprietoryLicenses.HANDSONTABLE,
      rowHeaders:
        this.rowHeaders != null
          ? this.rowHeaders
          : this.rows.map((val) => val.name),
      formulas: this.isFormulaEnabled
        ? {
            engine: HyperFormula,
          }
        : undefined,
      copyPaste: true,
      afterValidate: (isValid, value, row, prop, source) => {
        if (!this.validator[row]) this.validator[row] = [];
        this.validator[row][prop] = isValid;
      },
      afterChange: (changes) => {
        if (changes && changes?.length > 0) {
          let hotInstance = this.getHotInstance();
          setTimeout(() => {
            this.onChange.emit({
              data: !hotInstance.isDestroyed && hotInstance?.getData(),
              sourceData:
                !hotInstance.isDestroyed && hotInstance?.getSourceData(),
            });
          }, 100);
        }
      },
      beforeRemoveRow: this.onBeforeRemoveRow,
      ...this.additionalHandsOnTableSettings,
      afterOnCellMouseDown: this.adjustDatepickerPosition.bind(this),
      datePickerConfig: {
        onOpen: this.adjustDatepickerPosition.bind(this),
      },
    };

    try {
      let hotInstance = this.getHotInstance();
      hotInstance?.updateSettings(this.hotSettings);
      hotInstance?.render();
    } catch (err) {}
  }

  adjustDatepickerPosition(event, coords, TD) {
    setTimeout(() => {
      const datePickerContainerEl = document.querySelector<HTMLElement>(
        '.htDatepickerHolder'
      );
      const datePickerCloneMasterEl =
        document.querySelector<HTMLElement>('.ht_clone_master');
      const pikaDayCalenderEl =
        document.querySelector<HTMLElement>('.pika-single');

      if (
        datePickerContainerEl &&
        datePickerCloneMasterEl &&
        pikaDayCalenderEl
      ) {
        const containerRect = datePickerCloneMasterEl.getBoundingClientRect();
        const datePickerRect = datePickerContainerEl.getBoundingClientRect();
        const DATE_PICKER_CONTAINER_WIDTH = 150;

        if (datePickerRect.right > window.innerWidth) {
          const offset = containerRect.left - pikaDayCalenderEl.clientWidth;
          datePickerContainerEl.style.left = `${Math.max(
            0,
            offset + DATE_PICKER_CONTAINER_WIDTH
          )}px`;
        }
      }
      // getting editor parent 
      const editorParent =
        document.getElementsByClassName('ht_editor_visible')[0];

      document.documentElement.style.setProperty(
        '--auto-complete-max-height',
        coords.row >= 5 ? 'auto' : '80px'
      );
      if (editorParent && editorParent?.firstChild['clientWidth']) {
        // setting up options widht and 
        const textareaEditorWidth = editorParent.firstChild['clientWidth'];
        document.documentElement.style.setProperty(
          '--auto-complete-max-width',
          `${textareaEditorWidth + 'px' || 'auto'}`
        );
      }
    }, 0);
  }

  ngAfterViewInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    if (
      (changes.dataset &&
        changes.dataset.currentValue !== changes.dataset.previousValue &&
        JSON.stringify(changes.dataset.currentValue) !=
          JSON.stringify(changes.dataset.previousValue)) ||
      (changes.additionalHandsOnTableSettings &&
        changes.additionalHandsOnTableSettings.currentValue !==
          changes.additionalHandsOnTableSettings.previousValue &&
        JSON.stringify(changes.additionalHandsOnTableSettings.currentValue) !=
          JSON.stringify(changes.additionalHandsOnTableSettings.previousValue))
    ) {
      this.updateHotSettings();
    } else if (
      changes.rows &&
      changes.rows.currentValue !== changes.rows.previousValue
    ) {
      this.updateHotSettings();
    } else if (
      changes.mergeCells &&
      changes.mergeCells.currentValue !== changes.mergeCells.previousValue
    ) {
      this.updateHotSettings();
    }
  }

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

  getHotInstance() {
    return this.hotRegisterer.getInstance(this.id);
  }

  getSourceData() {
    return this.getHotInstance()?.getSourceData();
  }

  getData() {
    return this.getHotInstance()?.getData();
  }

  onBeforeRemoveRow = (rowIdx, amount, physicalRows) => {
    if (physicalRows?.length > 0) {
      let hotInstance = this.getHotInstance();
      let sourceData: any = hotInstance?.getSourceDataAtRow(physicalRows[0]);
      if (sourceData.isDeleted) {
        return true;
      }
      this.rowsToBeDeleted = [...this.rowsToBeDeleted, ...physicalRows];
      this.confirmRowDeletion(this.rowsToBeDeleted);
    }
    return false;
  };

  confirmRowDeletion(rows) {
    this.SweetAlert.confirm({
      title: 'Are you sure you want to delete the selected row(s)?',
      showLoaderOnConfirm: true,
      focusCancel: true,
      preConfirm: () => {
        this.commitRowDeletion(rows);
        this.rowsToBeDeleted = [];
        this.SweetAlert.close();
      },
    }).then((response) => {
      if (response && response.dismiss == 'cancel') {
        this.rowsToBeDeleted = [];
      }
    });
  }

  commitRowDeletion(rows) {
    const toDelete = [];
    const deletionsToEmit = [];
    let hotInstance = this.getHotInstance();
    let changes = [];
    hotInstance?.batch(() => {
      let sourceData = hotInstance?.getSourceData();
      rows.forEach((rowIndex) => {
        let rowSourceData = sourceData[rowIndex];
        //added extra condition to not delete the aggregation row
        let deleteAllowed = Object.values(rowSourceData).some((cell: any) => {
          return !cell.is_aggregated;
        });
        if (deleteAllowed) {
          changes.push([rowIndex, 'isDeleted', true]);
          toDelete.push([rowIndex, 1]);
          deletionsToEmit.push({ rowIndex, sourceData: rowSourceData });
        }
      });
      if (toDelete?.length) {
        hotInstance.setSourceDataAtCell(changes);
        hotInstance.alter('remove_row', toDelete);
      }
    });
    if (deletionsToEmit?.length) {
      this.onRowDeletion.emit(deletionsToEmit);
    }
  }

  copyTable() {
    let col = this.hotRegisterer.getInstance(this.id).countCols();
    let row = this.hotRegisterer.getInstance(this.id).countRows();
    this.hotRegisterer.getInstance(this.id).selectCell(0, 0, row - 1, col - 1);
    document.execCommand('copy');
  }
}

