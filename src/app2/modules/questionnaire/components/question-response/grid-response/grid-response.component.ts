import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  QueryList,
  SimpleChanges,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';

import CustomMultiSelectRenderer from 'src/app2/shared/common/hands-on-table/renderers/multiselectRenderer';
import CustomPercentageRenderer from 'src/app2/shared/common/hands-on-table/renderers/percentageRenderer';
import CustomTextRenderer from 'src/app2/shared/common/hands-on-table/renderers/textRenderer';
import CustomNumericRenderer from 'src/app2/shared/common/hands-on-table/renderers/numericRenderer';
import MultiSelectEditor from 'src/app2/shared/common/hands-on-table/editors/multiselectEditor';
import { DvHandsontableComponent } from 'src/app2/shared/components';
import { customGridNumericValidator } from 'src/app2/shared/common/hands-on-table/validators/customGridNumericValidator';
import { customGridIntegerValidator } from 'src/app2/shared/common/hands-on-table/validators/customGridIntegerValidator';
import { GridNumericEditor } from 'src/app2/shared/common/hands-on-table/editors/customGridNumericEditor';
import { takeUntil } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';
import { index } from 'handsontable/helpers/dom';
import { UtilsService } from 'src/app2/services/utils.service';
import { QuestionState } from '../../../store/questionnaire.state';
import { Select } from '@ngxs/store';
import pikadayRenderer from 'src/app2/shared/common/hands-on-table/renderers/dateRenderer';
import { GridDateEditor } from 'src/app2/shared/common/hands-on-table/editors/customGridDateEditor';

@Component({
  selector: 'grid-response',
  templateUrl: './grid-response.component.html',
  styleUrls: ['./grid-response.component.css'],
})
export class GridResponseComponent
  implements OnInit, OnDestroy, AfterViewInit, OnChanges
{
  @Input() id;
  @Input() isNotApplicable: boolean = false;
  @Input() isReadOnly: boolean = false;
  @Input() gridData;
  @Input() gridResponse: {
    column_id: any;
    row_id: any;
    value: any;
    column_group_id: any;
    row_group_id: any;
    formula?: any;
    is_aggregated?: boolean;
  }[];
  @Input() isDynamic: boolean = false;
  @Input() isPlainRendering: boolean = false;
  @Input() enableHeaders: boolean = true;
  @Input() isPrintPreview: boolean = false;
  @Input() container = 'body';
  @Input() reload$ = new Observable();
  @Input() isGridValidated: boolean = false;

  @Input() isLite: boolean = false;
  @Output() onValueChange = new EventEmitter();
  @Output() onInsertRow = new EventEmitter();
  @Output() onDeleteRow = new EventEmitter();

  dataset = [];
  hasDropdown = false;
  rows: {
    id: number;
    name: string;
    group_id: number;
    is_aggregated?: boolean;
  }[] = [];
  columns: any[] = [];
  rowIdMap: any = {};
  columnIdMap: any = {};
  clickInsideComponent: boolean = false; // Var to check if component was clicked
  formulas: any[] = null;
  aggregationJson = null;
  rowFocusIndex: number;
  colFocusIndex: number;
  customRowCountEntered: boolean = false;
  gridHasError: boolean = false;
  rowInsertionDropdownOptions = [
    { label: 'Insert 1 Row', key: '1' },
    { label: 'Insert 10 Rows', key: '10' },
    { label: 'Insert 50 Rows', key: '50' },
    { label: 'Insert 100 Rows', key: '100' },
    { label: 'Insert 200 Rows', key: '200' },
    { label: 'Enter number of rows', key: 'more' },
  ];

  existingData;

  destroy$: Subject<boolean> = new Subject<boolean>();

  @Select(QuestionState.getDraftData) draftData;

  validateCells = () => {
    let promise = new Promise((resolve) => {
      try {
        let hotInstance = this.handsOnTable?.getHotInstance();
        let data = hotInstance?.getData();
        let sourceData = hotInstance?.getSourceData();
        let isError = false;
        let validatedRowCount = 0;
        hotInstance.batch(() => {
          if (data && sourceData) {
            sourceData.forEach((row, rowIndex) => {
              let rowNeedsValidation = false;
              Object.values(row).forEach((cell: any, columnIndex) => {
                rowNeedsValidation = rowNeedsValidation || cell.value != null;
                if (
                  cell.formula ||
                  hotInstance
                    ?.getSourceDataAtCell(rowIndex, columnIndex)
                    ?.toString()
                    ?.startsWith('=')
                ) {
                  rowNeedsValidation = true;
                  if (cell.formula) {
                    hotInstance?.setCellMeta(
                      rowIndex,
                      columnIndex,
                      'readOnly',
                      true
                    );
                  }
                  if (!this.isFormulaCellValid(data[rowIndex][columnIndex])) {
                    hotInstance?.setCellMeta(
                      rowIndex,
                      columnIndex,
                      'className',
                      'htDangerBackground'
                    );
                    isError = true;
                  } else {
                    hotInstance?.removeCellMeta(
                      rowIndex,
                      columnIndex,
                      'className'
                    );
                  }
                }
              });
              if (isError) {
                resolve(isError);
              }
              if (!rowNeedsValidation) {
                validatedRowCount++;
                if (validatedRowCount >= sourceData.length) {
                  resolve(isError);
                }
              } else {
                hotInstance.validateRows([rowIndex], (valid) => {
                  isError = isError || !valid;
                  validatedRowCount++;

                  if (isError) {
                    resolve(true);
                  } else if (validatedRowCount >= sourceData.length) {
                    resolve(false);
                  }
                });
              }
            });
          }
        });
      } catch (ex) {
        // Catch exception from getHotInstance in case of handsontable destroy
        resolve(false);
      }
    });
    promise.then(() => {
      setTimeout(() => this.handsOnTable?.getHotInstance()?.render(), 10);
    });
    return promise;
  };

  additionalHandsOnTableSettings: any = {
    height: 'auto',
    afterCellMetaReset: () => {
      setTimeout(() => this.validateCells(), 0);
    },
  };

  columnValuePropertyName = 'value';

  // used for plain rendering
  rowHeaders: string[] = [];
  colHeaders: string[] = [];
  data: any[][] = [];

  handsOnTableId = 'grid-handsontable-' + Math.random();

  @ViewChildren('grid') handsOnTables: QueryList<DvHandsontableComponent>;
  @ViewChildren('gridContainer') gridContainers: QueryList<ElementRef>;

  handsOnTable: DvHandsontableComponent;
  gridContainer: ElementRef;
  mergeCells: any;
  resizeObserver: ResizeObserver;

  constructor(
    private readonly sweetAlert: SweetAlertService,
    private elementRef: ElementRef<HTMLElement>,
    private readonly Utils: UtilsService
  ) {}

  ngOnInit(): void {
    this.draftData.pipe(takeUntil(this.destroy$)).subscribe((val) => {
      if (!val) {
        // resetting existing data on save to pass all data when the next change is made
        // when sequence id is created for the section, any unsaved changes (due to error in grid) get lost from localQuestionMap and localGridMap
        // by resetting existing data, we can send the full grid data when the next change is made.
        this.existingData = null;
      }
    });
    if (!this.isReadOnly && this.isDynamic) {
      this.additionalHandsOnTableSettings = {
        ...this.additionalHandsOnTableSettings,
        contextMenu: {
          items: {
            remove_row: {
              disabled() {
                let selectedIndex = this.getSelected();
                let rowIndex = selectedIndex ? selectedIndex[0][0] : null;
                let sourceData = this.getSourceData();
                let aggregationIndex = sourceData.findIndex((row) => {
                  let columns: any = Object.values(row);
                  return columns[0]?.is_aggregated;
                });
                return aggregationIndex > -1 && aggregationIndex == rowIndex;
              },
            },
            undo: {
              disabled() {
                return !this.isUndoAvailable();
              },
            },
            redo: {
              disabled() {
                return !this.isRedoAvailable();
              },
            },
          },
        },
      };
    } else if (!this.isReadOnly) {
      this.additionalHandsOnTableSettings = {
        ...this.additionalHandsOnTableSettings,
        contextMenu: ['undo', 'redo'],
      };
    } else {
      this.additionalHandsOnTableSettings = {
        ...this.additionalHandsOnTableSettings,
        height: 'auto',
      };
    }
    this.subscribeGridreload();

    document.addEventListener('click', this.handleDocumentClick);

    if (this.isLite) {
      this.isPlainRendering = true;
      this.plainRenderingFormatting();
    }
  }

  ngAfterViewInit(): void {
    if (this.handsOnTables?.first) {
      this.handsOnTable = this.handsOnTables.first;
      this.validateOnInit(this.handsOnTable.getHotInstance());
    }
    this.handsOnTables.changes
      .pipe(takeUntil(this.destroy$))
      .subscribe((items: QueryList<DvHandsontableComponent>) => {
        if (!this.handsOnTable && items?.first) {
          this.validateOnInit(items.first.getHotInstance());
        }
        this.handsOnTable = items?.first;
        if (this.rowFocusIndex != null && this.colFocusIndex != null)
          this.handsOnTable
            ?.getHotInstance()
            .selectCell(this.rowFocusIndex, this.colFocusIndex);
      });
    this.gridContainers.changes
      .pipe(takeUntil(this.destroy$))
      .subscribe((items: QueryList<ElementRef>) => {
        this.gridContainer = items?.first;
        setTimeout(() => this.registerResizeObserver(), 1000);
      });
  }

  validateOnInit(hotInstance) {
    setTimeout(async () => {
      try {
        if (hotInstance) {
          let isError = await this.validateCells();
          this.gridHasError = isError ? true : false;
          if (isError) {
            this.onValueChange.emit({
              error: true,
            });
          }
        }
      } catch (e) {
        // Empty try catch to prevent handsontable getHotInstance function from throwing error on destroy
      }
    }, 1000);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes.isPlainRendering &&
      changes.isPlainRendering.currentValue !==
        changes.isPlainRendering.previousValue
    ) {
      this.ngOnInit();
    }
    if (
      changes.isGridValidated &&
      changes.isGridValidated.currentValue &&
      changes.isGridValidated.previousValue === false
    ) {
      this.validateCells().then((error) => {
        let data = this.handsOnTable?.getData();
        this.gridHasError = error ? true : false;
        let formattedData = [];
        if (data) {
          data.forEach((row, rowIndex) => {
            row.forEach((cellValue, columnIndex) => {
              formattedData.push({
                rowIndex: rowIndex,
                columnIndex: columnIndex,
                newValue: cellValue,
              });
            });
          });

          let sourceData = this.handsOnTable?.getSourceData();
          this.gridHasError = error ? true : false;
          this.onValueChange.emit({
            isError: error,
            value: { data: formattedData, sourceData },
          });
        }
      });
    }
    if (
      changes &&
      this.Utils.checkIfValidAndSameOrNotSame(
        changes?.isNotApplicable?.previousValue,
        changes?.isNotApplicable?.currentValue,
        false
      ) &&
      !changes?.isNotApplicable?.currentValue
    ) {
      this.updateDataset();
      this.plainRenderingFormatting();
    }
  }

  subscribeGridreload(): void {
    this.reload$.pipe(takeUntil(this.destroy$)).subscribe((reload) => {
      this.initializeHandsOnTable();

      if (this.isPlainRendering) {
        this.plainRenderingFormatting();
      }
    });
  }

  updateFormulas() {
    if (this.isDynamic && this.formulas && this.rows.length > 0) {
      let formulas = [];
      for (let i = 0; i < this.rows.length; i++) {
        let formulas_json: any[] = [];
        for (let j = 0; j < this.columns.length; j++) {
          let customFormula = null;
          if (this.dataset[i][`column_${j}`].formula) {
            customFormula = this.dataset[i][`column_${j}`].formula;
          }
          let formula_obj = {};
          formula_obj = {
            row_id: i,
            column_id: j,
            value: customFormula,
          };
          formulas_json.push(formula_obj);
        }
        formulas = [...formulas, ...formulas_json];
      }
      this.formulas = formulas;
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.destroy$?.next(true);
    this.destroy$?.unsubscribe();
    document.removeEventListener('click', this.handleDocumentClick);
  }

  registerResizeObserver() {
    if (this.gridContainer) {
      this.resizeObserver?.disconnect();
      this.resizeObserver = new ResizeObserver((entries) => {
        if (
          !this.isNotApplicable &&
          this.gridData !== undefined &&
          !this.isPlainRendering
        ) {
          setTimeout(() => {
            try {
              this.handsOnTable?.getHotInstance()?.render();
            } catch (e) {
              // Empty try catch to prevent handsontable render function from throwing error on destroy
            }
          }, 10);
        }
      });
      this.resizeObserver.observe(this.gridContainer?.nativeElement);
    }
  }

  updateHeight() {
    let height: number | string = 'auto';
    if (this.isDynamic) {
      if (this.columns.some((column) => column.type == 'dropdown')) {
        if (this.rows.length == 0) {
          height = 50;
        } else if (this.rows.length > 0 && this.rows.length < 6) {
          height = this.rows.length * 25 + 150;
        } else if (this.rows.length < 20 && this.rows.length > 5) {
          height = this.rows.length * 25;
        } else {
          height = 500;
        }
      } else {
        if (this.rows.length == 0) {
          height = 50;
        } else if (this.rows.length < 20) {
          height = 'auto';
        } else {
          height = 500;
        }
      }
    } else {
      if (this.columns.some((column) => column.type == 'dropdown')) {
        if (!this.rows.length) {
          height = 50;
        } else if (this.rows.length < 6) {
          height = this.rows.length * 25 + 150;
        } else if (this.rows.length < 20) {
          height = this.rows.length * 25;
        } else {
          height = 500;
        }
      } else {
        if (this.rows.length == 0) {
          height = 50;
        } else if (this.rows.length < 20) {
          height = 'auto';
        } else {
          height = 500;
        }
      }
    }
    this.additionalHandsOnTableSettings = {
      ...this.additionalHandsOnTableSettings,
      height,
    };
  }

  updateDataset() {
    let dataset = [];
    // use setTimeout to delay the change in mergeCells until handsontable is initialised
    setTimeout(
      () =>
        (this.mergeCells = !this.isDynamic
          ? this.gridData?.metadata?.mergeCells
          : null),
      1000
    );
    let existingData: any[] = [];
    this.rows?.forEach((row, rowIndex) => {
      let dataRow = {};
      existingData.push([]);
      this.columns.forEach((column, columnIndex) => {
        let cell = this.gridResponse?.find(
          (cell) => cell.row_id == row.id && cell.column_id == column.id
        );
        let newCell;
        if (cell) {
          newCell = JSON.parse(JSON.stringify(cell));
          newCell.row_group_id = row.group_id;
          newCell.column_group_id = column.group_id;
          newCell.formula = null; //set to null, formula will be applied later based on the formula_json
        } else {
          newCell = {
            row_id: row.id,
            column_id: column.id,
            value: '',
            row_group_id: row.group_id,
            column_group_id: column.group_id,
          };
        }

        existingData[rowIndex].push(newCell.value ?? '');

        if (this.formulas && !this.isPlainRendering && !row.is_aggregated) {
          let formula = this.formulas.find(
            (item) => item.row_id == rowIndex && item.column_id == columnIndex
          );
          if (formula && formula.value) {
            //get formula from the saved formula json applicable for both static and dynamic grid
            newCell.value = formula.value;
            newCell.formula = formula.value;
          } else if (this.isDynamic) {
            let newFormula = this.getCustomGridFormula(
              this.formulas,
              rowIndex,
              columnIndex,
              dataset
            );
            if (newFormula) newCell.formula = newCell.value = newFormula;
          }
        }
        //set is_aggregated cell attribute as true for the aggregation row
        if (row.is_aggregated && !this.isPlainRendering) {
          newCell.is_aggregated = true;
          let aggFormula = this.generateAggregateFormula(
            this.aggregationJson?.values[columnIndex]?.value
          );
          if (aggFormula) newCell.formula = newCell.value = aggFormula;
        }
        dataRow[`column_${columnIndex}`] = newCell;
      });
      dataset.push(dataRow);
    });
    this.existingData = existingData;
    if (!this.compareDataset(this.dataset, dataset)) {
      this.dataset = dataset;
      this.updateHeight();
    }
  }

  async handleChange({ data, sourceData }) {
    let dataChanges = [];
    if (data?.length) {
      for (var i = 0; i < data.length; i++) {
        for (var j = 0; j < data[i].length; j++) {
          // push the cell as a change if there is no existing hotData or
          // existing hotData doesn't have the current row or current column (should not occur) or
          // if the existing data doesn't match the new data
          if (
            !this.existingData ||
            this.existingData?.length <= i ||
            this.existingData[i].length <= j ||
            (this.existingData[i][j] !== data[i][j] &&
              !(
                (this.existingData[i][j] === null ||
                  this.existingData[i][j] === '') &&
                (data[i][j] === null || data[i][j] === '')
              ))
          ) {
            dataChanges.push({
              rowIndex: i,
              columnIndex: j,
              newValue: data[i][j],
            });
          }

          data[i][j] = data[i][j] ?? '';
        }
      }
    }

    this.existingData = data;
    this.validateCells().then((isError) => {
      this.gridHasError = isError ? true : false;
      this.onValueChange.emit({
        error: isError,
        value: { data: dataChanges, sourceData },
      });
    });
  }

  async handleRowDeletion(deletedRows: { rowIndex; sourceData }[]) {
    let deletedRowIds = [];
    let startIndex = deletedRows[0].rowIndex;
    //remove all the fomulas from the formulasjson starting from the deleted row
    if (this.formulas) this.formulas.splice(startIndex * this.columns.length);
    deletedRows.forEach((deletedRow) => {
      let cells: any = Object.values(deletedRow?.sourceData);
      if (cells?.length) {
        deletedRowIds.push(cells[0].row_id);
        this.rows.splice(
          this.rows.findIndex((row) => row.id == cells[0].row_id),
          1
        );
      }
    });
    let dataset = JSON.parse(JSON.stringify(this.dataset));
    let formulas_json = this.gridData?.formulas_json
      ? JSON.parse(this.gridData.formulas_json)
      : null;
    if (formulas_json) {
      //Generate new formulas for the cells after the deleted rows based on the previous rows or using the formulas json
      if (startIndex == 0) {
        this.formulas = formulas_json;
      }
      for (let index = startIndex; index < dataset.length; index++) {
        this.columns.forEach((column, colIndex) => {
          let formula;
          if (index == 0) {
            formula = this.formulas[colIndex].value;
          } else {
            formula = dataset[index - 1][`column_${colIndex}`].formula;
          }

          let nextFormula = '';
          if (formula && !dataset[index][`column_${colIndex}`].is_aggregated) {
            if (index == 0) {
              nextFormula = formula;
            } else {
              nextFormula = this.getFormulaCurrentRow(formula);
            }
            dataset[index][`column_${colIndex}`].value = nextFormula;
            dataset[index][`column_${colIndex}`].formula = nextFormula;
          }
          if (index != 0) {
            //if its not the first row, update the formulas json with the new formula
            let formula_obj = {};
            formula_obj = {
              row_id: index,
              column_id: colIndex,
              value: nextFormula,
            };
            this.formulas.push(formula_obj);
          }
        });
      }
    }

    if (deletedRowIds?.length > 0) {
      let hotInstance = this.handsOnTable?.getHotInstance();
      if (this.aggregationJson?.values) {
        //update the aggregation row
        if (dataset.length == 1) {
          //remove the aggregation row if all the rows are deleted
          hotInstance.alter('remove_row', dataset.length - 1, 1);
          deletedRowIds.push(this.rows[0].id);
          dataset.pop();
          this.rows.pop();
        } else {
          //update the aggregation row formula based on the updated rows
          dataset = this.updateAggregationRows(dataset);
        }
      }
      this.onDeleteRow.emit(deletedRowIds);
      this.updateHeight();
      this.onValueChange.emit({
        isError: null,
        value: {
          deletedRowIds,
          columns: this.columns,
        },
      });
      this.dataset = dataset;
      //update the localgridresponse with the modified formula values
      setTimeout(async () => {
        let changedRows = [];
        if (this.gridData.formulas_json || this.gridData.aggregation_json) {
          this.dataset.forEach((row, rowIndex) => {
            let colIndex = 0;
            for (let columnKey in row) {
              let cell = {
                ...row[columnKey],
              };
              cell.row = cell.row_id;
              cell.column = cell.column_id;
              cell.newValue = hotInstance?.getDataAtCell(rowIndex, colIndex);
              changedRows.push(cell);
              colIndex++;
            }
          });
          hotInstance?.clearUndo();
        }
        let isError = await this.validateCells();
        this.gridHasError = isError ? true : false;
        this.onValueChange.emit({
          isError: isError,
          value: [...changedRows],
        });
      }, 1);
    }
    this.existingData = this.handsOnTable.getData();
    this.updateRowNames();
    this.updateHeight();
  }

  updateRowNames() {
    if (this.isDynamic) {
      this.rows = this.rows.map((row: any, rowIndex: number) => {
        if (!row.is_aggregated) {
          row.name = rowIndex + 1;
        }
        return row;
      });
    }
  }

  updateAggregationRows(dataset: any[]): any[] {
    let aggregationRowIndex = this.findAggregationRowIndex(dataset);
    //update the aggregation row formula based on the modified rows
    if (dataset[aggregationRowIndex]) {
      this.columns.forEach((column, colIndex) => {
        let aggCellValue = this.aggregationJson.values[colIndex]?.value;
        let aggFormula = this.generateAggregateFormula(aggCellValue);
        if (aggFormula?.toString()?.startsWith('=')) {
          dataset[aggregationRowIndex][`column_${colIndex}`].formula =
            aggFormula;

          dataset[aggregationRowIndex][`column_${colIndex}`].value = aggFormula;
        } else {
          dataset[aggregationRowIndex][`column_${colIndex}`].formula = null;
        }
        //update the new formula in the formula array as well
        let formulaCellIndex =
          aggregationRowIndex * this.columns.length + colIndex;
        this.formulas[formulaCellIndex] = {
          ...this.formulas[formulaCellIndex],
          value: dataset[aggregationRowIndex][`column_${colIndex}`].formula,
        };
      });
    }
    return dataset;
  }

  findAggregationRowIndex(dataset): number {
    return dataset.findIndex((row: any) => {
      let columns: any = Object.values(row);
      return columns[0]?.is_aggregated;
    });
  }

  insertRows(rowCount: number) {
    let maxRows = 2000;
    if (this.aggregationJson?.values && this.rows.length > 0) {
      maxRows = 2001;
    }
    if ((this.rows?.length ?? 0) + rowCount > maxRows) {
      this.sweetAlert.error({
        title: 'Maximum of 2000 rows supported',
        text: '',
      });
      return;
    }
    let removedAggregation = this.removeAggregationRows();
    let startIndex = this.dataset.length;
    let maxRowId = Math.max(...this.rows.map((row) => row.id));
    maxRowId = maxRowId > 0 ? maxRowId : 0;
    let dataset = [...(this.dataset ?? [])];
    //generate the formulas for the newly added rows base on the formulas json or the previous row formula
    for (let i = 1; i <= rowCount; i++) {
      let data = {};
      let formulas_json: any[] = [];
      for (let j = 0; j < this.columns.length; j++) {
        let customFormula = this.getCustomGridFormula(
          this.formulas,
          this.rows.length,
          j,
          dataset
        );
        let formula_obj = {};
        data[`column_${j}`] = {
          row_id: maxRowId + i,
          column_id: this.columns[j].id,
          row_group_id: maxRowId + i,
          column_group_id: this.columns[j].group_id,
          value: customFormula,
          formula: customFormula,
        };
        //update the formulas array with the new rows
        formula_obj = {
          row_id: this.rows.length,
          column_id: j,
          value: customFormula,
        };
        formulas_json.push(formula_obj);
      }
      this.rows.push({
        id: maxRowId + i,
        name: '' + (maxRowId + i),
        group_id: maxRowId + i,
      });
      dataset.push(data);
      //if new rows are added, then update the formulas array
      if (
        this.formulas &&
        this.rows.length > this.formulas.length / this.columns.length
      ) {
        this.formulas = [...this.formulas, ...formulas_json];
      }
    }
    if (this.aggregationJson?.values || removedAggregation) {
      //add back the aggregation row which contains the updated aggregation formula
      dataset = this.addAggregationRow(dataset, removedAggregation);
    }
    this.dataset = dataset;

    let changedRows = [];
    let hotInstance = this.handsOnTable?.getHotInstance();
    //modify the local grid response with the new rows
    setTimeout(async () => {
      for (let index = startIndex; index < dataset.length; index++) {
        Object.values(dataset[index]).forEach((cell: any, colIndex: number) => {
          let newCell = { ...cell };
          newCell.mode = null;
          newCell.row = cell.row_id;
          newCell.column = cell.column_id;
          newCell.newValue = hotInstance?.getDataAtCell(index, colIndex);
          changedRows.push(newCell);
        });
      }
      let isError = await this.validateCells();
      this.gridHasError = isError ? true : false;
      this.onValueChange.emit({
        isError: isError,
        value: [...changedRows],
      });
    }, 1);
    this.onInsertRow.emit({
      startIndex: maxRowId + 1,
      endIndex: maxRowId + rowCount,
      aggregationRowId: this.rows[this.rows.length - 1].id,
    });
    this.existingData = this.handsOnTable.getData();
    this.updateRowNames();
    this.updateHeight();
  }

  plainRenderingFormatting() {
    this.rowHeaders =
      this.rows?.map((row, index) => {
        return row.name;
      }) ?? [];
    this.colHeaders = this.columns?.map((column) => column.name) ?? [];
    this.data =
      this.dataset?.map((row, rowIndex) => {
        let rowArray = [];
        for (let i = 0; i < this.columns?.length ?? 0; i++) {
          let tempRow = row[`column_${i}`];
          let cellValue = tempRow?.value;
          if (tempRow?.formula && cellValue?.startsWith('='))
            cellValue = this.handsOnTable
              ?.getHotInstance()
              ?.getDataAtCell(rowIndex, i);
          if (
            cellValue &&
            Number.isFinite(+cellValue) &&
            (this.columns[i].type === 'numeric' ||
              this.columns[i].type === 'integer' ||
              this.columns[i].type === 'percentage')
          )
            cellValue =
              (window as any)
                .numbro(cellValue)
                .format({ thousandSeparated: true }) +
              (this.columns[i].type === 'percentage' ? '%' : '');
          rowArray.push(cellValue);
        }
        return rowArray;
      }) ?? [];
  }

  initializeHandsOnTable() {
    this.rows = [];
    this.columns = [];
    this.formulas = this.gridData?.formulas_json
      ? JSON.parse(this.gridData.formulas_json)
      : null;
    this.aggregationJson = this.gridData?.aggregation_json
      ? JSON.parse(this.gridData.aggregation_json)
      : null;
    if (this.gridData?.rows_columns?.length > 0) {
      let rowCount = 0;
      let columnCount = 0;
      this.gridData.rows_columns.forEach((item) => {
        if (item.elementType === 'Row') {
          //assign aggregation and other row name based on the index
          if (this.isDynamic) {
            if (item.is_aggregated && this.aggregationJson?.row_name) {
              item.name = this.aggregationJson.row_name;
            } else {
              item.name = rowCount + 1;
            }
          }
          this.rows.push(item);
          this.rowIdMap[rowCount++] = item.id;
        } else if (item.elementType === 'Column') {
          this.columns.push(item);
          this.columnIdMap['column_' + columnCount++] = item.id;
        }
      });
      let columnWidth =
        this.columns.length < 6 &&
        this.elementRef?.nativeElement &&
        this.elementRef?.nativeElement?.clientWidth > 0
          ? (this.elementRef.nativeElement.clientWidth - 155) /
            (this.columns.length || 1)
          : 150;
      let handsOnTableColumns = this.getHandsOnTableColumns();
      this.additionalHandsOnTableSettings = {
        ...this.additionalHandsOnTableSettings,
        columns: handsOnTableColumns,
        colWidths: columnWidth,
      };
    }
    if (!this.isGridValidated && this.gridResponse && this.gridData) {
      let aggregationIndex = this.gridData.rows_columns.findIndex(
        (row_column) => {
          return row_column.is_aggregated;
        }
      );
      if (this.aggregationJson && aggregationIndex == -1)
        this.addAggregationRow(this.dataset, null);
      else if (!this.aggregationJson && aggregationIndex > -1) {
        let deletedRowId = this.gridData.rows_columns[aggregationIndex].id;
        this.removeAggregationRows();
        this.onDeleteRow.emit([deletedRowId]);
        this.onValueChange.emit({
          isError: null,
          value: {
            deletedRowIds: [deletedRowId],
            columns: this.columns,
          },
          disableDraft: true,
        });
      }
    }
    this.updateDataset();
    //generate new formula json based on the generated or saved dataset
    this.updateFormulas();
  }
  removeAggregationRows() {
    if (this.rows.length > 1 && this.rows[this.rows.length - 1].is_aggregated) {
      this.rows.pop();
    }
    let aggIndex = this.dataset.findIndex((row) => {
      return (
        row[`column_${this.columns.length - 1}`].hasOwnProperty(
          'is_aggregated'
        ) && row[`column_${this.columns.length - 1}`].is_aggregated
      );
    });
    let aggRow;
    if (aggIndex > -1) {
      aggRow = this.dataset.splice(aggIndex, 1)[0];
    }
    if (this.formulas) {
      let index = this.formulas.length - this.columns.length;
      if (
        this.dataset.length > 0 &&
        this.formulas.length > this.dataset.length * this.columns.length &&
        index > -1
      )
        this.formulas.splice(index, this.columns.length);
    }
    return aggRow;
  }

  addAggregationRow(dataset: any[], removedAggregation: any): any[] {
    let lastRow = this.rows[this.rows.length - 1].id;
    let lastRowId = 1;
    if (
      lastRow &&
      removedAggregation &&
      Number(lastRow) < Number(removedAggregation[`column_${0}`].row_id)
    ) {
      lastRowId = removedAggregation[`column_${0}`].row_id;
    } else if (lastRow) {
      lastRowId = Number(lastRow) + 1;
    }

    this.rows.push({
      id: lastRowId,
      name: this.aggregationJson.row_name,
      is_aggregated: true,
      group_id: lastRowId,
    });
    let data = {};
    for (let colIndex = 0; colIndex < this.columns.length; colIndex++) {
      let aggCellValue;
      if (removedAggregation && removedAggregation[`column_${colIndex}`]) {
        aggCellValue = removedAggregation[`column_${colIndex}`].value;
      } else {
        aggCellValue = this.aggregationJson.values[colIndex]?.value;
      }
      let formula = this.generateAggregateFormula(aggCellValue);
      let newCell = {
        row_id: lastRowId,
        column_id: this.columns[colIndex].id,
        row_group_id: lastRowId,
        column_group_id: this.columns[colIndex].group_id,
        value: null,
        formula: null,
        is_aggregated: true,
      };
      let formula_obj = {
        row_id: this.rows.length,
        column_id: colIndex,
        value: null,
      };
      if (formula?.toString()?.startsWith('=')) {
        newCell.value = formula;
        newCell.formula = formula;
        formula_obj.value = formula;
      } else {
        newCell.value = aggCellValue;
      }
      data[`column_${colIndex}`] = newCell;
      if (!this.formulas) {
        this.formulas = [];
      }
      this.formulas.push(formula_obj);
    }
    dataset.push(data);
    return dataset;
  }

  generateAggregateFormula(formula: any) {
    if (formula) {
      let endIndex = this.rows.length - 1;
      let aggFormula = formula.replace(
        /([a-zA-Z]+)([\d]+)(:[a-zA-Z]+)([\d]+)/g,
        ($0, $1, $2, $3, $4) => {
          return $1 + '1' + $3 + endIndex;
        }
      );
      return aggFormula;
    } else return null;
  }

  getCustomGridFormula(
    formulas: any[],
    currentRowLength: any,
    colIndex: number,
    dataset: any[]
  ) {
    if (formulas) {
      let formula;
      //this condition checks the formula length since there might be some use case in the future where
      //some rows are static and they have formulas defined.
      if (currentRowLength * this.columns.length >= formulas.length) {
        formula = dataset[dataset.length - 1][`column_${colIndex}`].formula;
      } else {
        if (dataset.length > 0)
          formula =
            formulas[(dataset.length - 1) * this.columns.length + colIndex]
              .value;
        else formula = formulas[colIndex]?.value;
      }
      if (formula) {
        if (this.rows.length == 0) return formula;
        else return this.getFormulaCurrentRow(formula);
      } else return '';
    } else {
      return null;
    }
  }

  getFormulaCurrentRow(formula) {
    return formula?.replace(/([a-zA-Z]+)([\d]+)/g, ($0, $1, $2) => {
      return $1 + '' + (Number($2) + 1);
    });
  }

  handleInsertRowDropdownClick({ label, key }) {
    if (key === 'more') {
      this.sweetAlert
        .input({
          title: 'Enter number of rows',
          input: 'text',
          showCancelButton: true,
          closeOnConfirm: false,
        })
        .then(({ isConfirmed, value }) => {
          if (!isConfirmed) {
            return;
          }

          if (!value || typeof value !== 'string') {
            this.sweetAlert.error({
              title: 'Invalid input',
              text: 'Please enter a valid number',
            });
            return;
          }

          const rowCount = Number(value);

          if (Number.isInteger(rowCount) && rowCount > 0) {
            this.insertRows(rowCount);
            this.customRowCountEntered = true;
            return;
          }

          this.sweetAlert.error({
            title: 'Invalid input',
            text: 'Please enter a valid number',
          });
        });
    } else {
      this.insertRows(Number(key));
    }
  }

  getHandsOnTableColumns() {
    this.hasDropdown = false;
    let cols = this.columns.map((column, idx) => {
      let newColumn;
      if (column.type == 'dropdown') {
        this.hasDropdown = true;
        if (column.type_options.enable_multiselection) {
          let sourceMap = column.type_options.source.map((column, index) => {
            return {
              id: column,
              label: column,
            };
          });

          newColumn = {
            data: `column_${idx}.value`,
            editor: MultiSelectEditor,
            renderer: CustomMultiSelectRenderer,
            select: {
              config: {
                separator: ',',
                valueKey: 'id',
                labelKey: 'label',
              },
              options: sourceMap,
            },
            title: column.name,
          };
        } else {
          newColumn = {
            data: `column_${idx}.value`,
            type: 'dropdown',
            source: column.type_options.source,
            title: column.name,
            allowInvalid: false,
            strict: true,
            trimDropdown: false,
          };
        }

        newColumn.placeholder = !this.isReadOnly ? 'Select an option' : '';
      } else if (column.type == 'numeric') {
        column['format'] = '0,0';
        if (column.type_options.format == undefined) {
          column.type_options.format = null;
        }
        newColumn = {
          data: `column_${idx}.value`,
          renderer: CustomNumericRenderer,
          editor: GridNumericEditor,
          type: 'text',
          format: '0,0',
          title: column.name,
          validator: customGridNumericValidator,
        };
        newColumn.placeholder = !this.isReadOnly ? 'Numeric input' : '';
      } else if (column.type == 'percentage') {
        newColumn = {
          data: `column_${idx}.value`,
          renderer: CustomPercentageRenderer,
          validator: customGridNumericValidator,
          editor: GridNumericEditor,
          type: 'text',
          title: column.name,
        };
        newColumn.placeholder = !this.isReadOnly ? 'Percentage input' : '';
      } else if (column.type == 'integer') {
        newColumn = {
          data: `column_${idx}.value`,
          renderer: CustomNumericRenderer,
          editor: GridNumericEditor,
          type: 'text',
          title: column.name,
          validator: customGridIntegerValidator,
        };
        newColumn.placeholder = !this.isReadOnly ? 'Integer input' : '';
      } else if (column.type == 'date') {
        newColumn = {
          data: `column_${idx}.value`,
          type: 'date',
          dateFormat: column.type_options.dateFormat,
          correctFormat: true,
          defaultDate: column.type_options.defaultDate,
          title: column.name,
          // renderer: pikadayRenderer,
        };
        newColumn.placeholder = !this.isReadOnly ? 'Date input' : '';
      } else {
        newColumn = {
          data: `column_${idx}.value`,
          type: 'text',
          title: column.name,
          renderer: CustomTextRenderer,
        };
        newColumn.placeholder = !this.isReadOnly ? 'Text input' : '';
      }
      newColumn.readOnly = column.readOnly || this.isReadOnly;
      return newColumn;
    });
    return cols;
  }

  compareDataset(arr1, arr2) {
    if ((!arr1 || !arr2) && arr1 != arr2) {
      return false;
    } else if (arr1 == arr2) {
      return true;
    }

    if (arr1?.length != arr2?.length) {
      return false;
    }

    return arr1.every((element1, index) => {
      let element2 = arr2[index];
      return (
        Object.keys(element1).length == Object.keys(element2).length &&
        Object.keys(element1).every((key) => {
          let cell1 = element1[key];
          let cell2 = element2[key];
          return (
            Object.keys(cell1).length == Object.keys(cell2).length &&
            Object.keys(cell1).every(
              (cellProp) => cell1[cellProp] === cell2[cellProp]
            )
          );
        })
      );
    });
  }

  isFormulaCellValid(value) {
    return (
      !value ||
      (value.toString().indexOf('ERROR.TYPE') === -1 &&
        !value.toString().startsWith('#'))
    );
  }

  handleGirdClick() {
    this.clickInsideComponent = true;
  }

  //Event to listen any DOM click
  handleDocumentClick = (event: MouseEvent) => {
    if (
      !this.clickInsideComponent &&
      this.isLite &&
      !this.customRowCountEntered
    ) {
      setTimeout(() => {
        if (!this.isPlainRendering && !this.gridHasError) {
          this.plainRenderingFormatting();
          this.isPlainRendering = true;
          this.rowFocusIndex = null;
          this.colFocusIndex = null;
        }
      }, 1000);
    }
    this.customRowCountEntered = false;
    this.clickInsideComponent = false;
  };

  changeToHandsOnTable({ rowIndex, colIndex }) {
    if (this.isLite) {
      this.isPlainRendering = false;
      this.initializeHandsOnTable();
      this.ngAfterViewInit();
      this.rowFocusIndex = rowIndex;
      this.colFocusIndex = colIndex;
    }
  }
}
