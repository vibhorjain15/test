import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { QuestionnaireService } from 'src/app2/apis/questionnaire/questionnaire.service';
import { ResponseType } from '../../constants/Response-type.constant';
import { GridDataType } from '../../types/grid.type';
import { CacheUtil } from '../../service/cache.service';

@Component({
  selector: 'response-track-change',
  templateUrl: './response-track-change.component.html',
})
export class ResponseTrackChangeComponent implements OnInit {
  @Input() type = null;
  @Input() current = '';
  @Input() previous = '';
  @Input() question;
  @Input() previousGrid;
  @Input() isTemplatePreview = false;
  @Input() isTrackChange = true;
  @Input() isReadOnly = false;
  instance;
  tinyMceInit;
  @Output() onValueChange = new EventEmitter();
  @Output() onTrackChange = new EventEmitter();
  ResponseType = ResponseType;
  value;
  gridData;
  colHeaders;
  rowHeaders;
  data;
  dataset;
  constructor(
    private questionnaire: QuestionnaireService,
    private cache: CacheUtil
  ) {}
  ngOnInit() {
    if (
      this.question.responseType === ResponseType.Grid ||
      this.question.responseType === ResponseType.DynamicGrid
    ) {
      let id = this.question.grid_id;
      let version = this.question.grid_version;
      let response_id = this.question.answer.attributes?.id;
      let expandedId = `${this.question.sequenceID}-${this.question.sectionID}-${this.question.id}`;
      if (expandedId in this.cache.GRIDCACHE) {
        this.gridData = this.cache.GRIDCACHE[expandedId];
        this.getGridData();
      } else
        this.questionnaire
          .getQuestionGridData(id, version, response_id)
          .subscribe((rowData: GridDataType) => {
            this.cache.GRIDCACHE[expandedId] = rowData;
            this.gridData = rowData;
            this.getGridData();
          });
    }
  }

  getGridData() {
    let rows = [];
    let columns = [];
    this.gridData.rows_columns.forEach((item) => {
      if (item.elementType === 'Row') {
        rows.push(item);
      } else if (item.elementType === 'Column') {
        columns.push(item);
      }
    });
    let dataset = [];
    let Prevset = [];
    let gridResponse = this.question?.answer?.attributes?.localgrid_responses;

    let formula = [];
    let formulaMap = {};
    if (this.isTemplatePreview) {
      formula = JSON.parse(this.gridData?.formulas_json) || [];
      formula.forEach((forData) => {
        formulaMap[`${forData.row_id}-${forData.column_id}`] = {
          value: forData?.value || '',
        };
      });
    }

    rows?.forEach((row, rowIndex) => {
      let dataRow = {};
      let PrevRow = {};
      columns.forEach((column, columnIndex) => {
        let cell = gridResponse?.find(
          (cell) => cell.row_id == row.id && cell.column_id == column.id
        );
        let previousCell = this.previousGrid?.find(
          (cell) => cell.row_id == row.id && cell.column_id == column.id
        );

        dataRow[`column_${columnIndex}`] = cell
          ? JSON.parse(JSON.stringify(cell))
          : {
              row_id: row?.id,
              column_id: column?.id,
              value: null,
            };
        if (this.isTemplatePreview && formula.length) {
          dataRow[`column_${columnIndex}`] =
            formulaMap[`${rowIndex}-${columnIndex}`];
        }

        PrevRow[`column_${columnIndex}`] = previousCell
          ? JSON.parse(JSON.stringify(previousCell))
          : {
              row_id: row?.id,
              column_id: column?.id,
              value: null,
            };
      });
      dataset.push(dataRow);
      Prevset.push(PrevRow);
    });
    this.dataset = dataset;

    this.rowHeaders = rows?.map((row) => row.name) ?? [];
    this.colHeaders = columns?.map((column) => column.name) ?? [];
    this.data =
      this.dataset?.map((row, index) => {
        let rowArray = [];
        for (let i = 0; i < columns?.length ?? 0; i++) {
          if (this.isTemplatePreview) {
            rowArray.push(row[`column_${i}`]?.value);
          } else
            rowArray.push({
              current: row[`column_${i}`]?.value,
              previous: Prevset[index][`column_${i}`]?.value,
            });
        }
        return rowArray;
      }) ?? [];
  }

  handleValueChange(val) {
    this.value = val;
    this.onValueChange.emit(this.value);
  }

  handleTrackChange(flite) {
    this.onTrackChange.emit(flite);
  }
}
