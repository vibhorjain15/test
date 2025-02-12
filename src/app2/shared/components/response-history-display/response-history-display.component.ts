import { Component, Input, OnInit } from '@angular/core';
import { Audit, ReviewHistory } from '../../models/responseHistory.model';
import { ResponseType } from 'src/app2/modules/questionnaire/constants/Response-type.constant';
import { responseType } from 'src/app2/modules/template-builder/constants/responseType.constant';
import { CacheUtil } from 'src/app2/modules/questionnaire/service/cache.service';
import { GridDataType } from 'src/app2/modules/questionnaire/types/grid.type';
import { ClipboardService } from 'ngx-clipboard';
import { ToastrService } from 'ngx-toastr';
import { copyHtml } from 'src/app2/modules/questionnaire/util/copy-html.util';
@Component({
  selector: 'response-history-display',
  templateUrl: './response-history-display.component.html',
  styleUrls: ['./response-history-display.component.css'],
})
export class ResponseHistoryDisplayComponent implements OnInit {
  @Input() currentResponse: ReviewHistory & Audit;
  @Input() prevResponse: ReviewHistory & Audit;
  @Input() response_type;
  @Input() grid_id: number = 0;
  @Input() grid_version: number = 0;
  @Input() gridData: GridDataType;

  ResponseTypes = ResponseType;
  groupedColRowData;
  gridLoaded;
  data: any[][] = [];
  constructor(
    private cache: CacheUtil,
    private clipboardService: ClipboardService,
    private toaster: ToastrService
  ) {}

  ngOnInit(): void {
    this.getResponseDisplay(this.currentResponse);
    this.getResponseDisplay(this.prevResponse);
  }

  getResponseDisplay(response: ReviewHistory & Audit) {
    if (!response) return;
    if (response.is_na) {
      response.responseDisplay = !!response.text_value
        ? `Comment : ${response.text_value}`
        : '';
      return;
    }

    switch (this.response_type) {
      case ResponseType.Text:
      case ResponseType.TextEmail:
      case ResponseType.TextMultiLine:
        response.responseDisplay = response.text_value;
        break;
      case responseType.Date:
        if (!response.dateTime_value) {
          response.responseDisplay = '';
        } else {
          let date = new Date(response.dateTime_value)
            .toDateString()
            .split(' ')
            .slice(1); // Getting date without the day
          [date[0], date[1]] = [date[1], date[0]]; // Swap date and month to get (dd MMM YYYY)
          response.responseDisplay = date.join(' ');
        }
        if (response.text_value)
          response.responseDisplay =
            response.responseDisplay +
            (response.responseDisplay ? '<br>' : '') +
            `Comment : ${response.text_value}`;
        break;
      case ResponseType.Boolean:
      case ResponseType.NoPlus:
      case ResponseType.BooleanPlus:
        if (response.bool_value === null || response.bool_value === undefined)
          response.responseDisplay = '';
        else response.responseDisplay = response.bool_value ? 'Yes' : 'No';
        if (response.text_value)
          response.responseDisplay =
            response.responseDisplay +
            '<br>' +
            `Comment : ${response.text_value}`;
        break;
      case ResponseType.Dropdown:
      case responseType.CheckBox:
        response.responseDisplay =
          response.selected_options
            ?.map((option) => option.dropdown_option_text)
            ?.join(' |') ?? '';
        if (response.text_value)
          response.responseDisplay =
            response.responseDisplay +
            '<br>' +
            `Comment : ${response.text_value}`;

        break;
      case ResponseType.Integer:
      case ResponseType.Identifier:
      case ResponseType.Numeric:
      case ResponseType.TextPhone:
        response.responseDisplay =
          response.numeric_value_a !== null
            ? JSON.stringify(response.numeric_value_a)
            : '';
        if (response.text_value)
          response.responseDisplay =
            response.responseDisplay +
            '<br>' +
            `Comment : ${response.text_value}`;

        break;
      case ResponseType.Percentage:
        response.responseDisplay =
          response.numeric_value_a !== null
            ? response.numeric_value_a + '%'
            : '';
        if (response.text_value)
          response.responseDisplay =
            response.responseDisplay +
            '<br>' +
            `Comment : ${response.text_value}`;

        break;
      case ResponseType.Bookends:
        response.responseDisplay =
          response.numeric_value_a !== null && response.numeric_value_b !== null
            ? response.numeric_value_a + ' - ' + response.numeric_value_b
            : '';
        if (response.text_value)
          response.responseDisplay =
            response.responseDisplay +
            '<br>' +
            `Comment : ${response.text_value}`;

        break;
      case ResponseType.DynamicGrid:
        response.responseDisplay = ' ';
        if (!this.data.length) {
          let expandedId = `${this.currentResponse.sequence_id}-${this.currentResponse.section_id}-${this.currentResponse.question_id}-columnData`;
          if (
            expandedId in this.cache.GRIDCACHE &&
            this.currentResponse.grid_responses
          ) {
            this.gridData = this.cache.GRIDCACHE[expandedId];
            this.initDynamicGrid();
          }
        }
        if (response.text_value)
          response.responseDisplay =
            '<br>' + `Comment : ${response.text_value}`;
        break;
      case ResponseType.Grid:
        response.responseDisplay = ' ';
        if (!this.data.length) {
          let expandedIdGrid = `${this.currentResponse.sequence_id}-${this.currentResponse.section_id}-${this.currentResponse.question_id}`;
          if (
            expandedIdGrid in this.cache.GRIDCACHE &&
            this.currentResponse.grid_responses
          ) {
            this.gridData = this.cache.GRIDCACHE[expandedIdGrid];
            this.initGrid();
          }
        }
        if (response.text_value)
          response.responseDisplay =
            '<br>' + `Comment : ${response.text_value}`;
        break;
      case ResponseType.ReturnTable:
      case ResponseType.aumTable:
      case ResponseType.Attachment:
        if (response.text_value)
          response.responseDisplay = `Comment : ${response.text_value}`;
        break;
    }
  }

  initGrid() {
    this.groupedColRowData = this.gridData.rows_columns.reduce(
      (result, item) => {
        const elementType = item.elementType;
        if (!result[elementType]) {
          result[elementType] = [];
        }
        result[elementType].push(item);
        return result;
      },
      {}
    );

    // Sort the grouped data by "order" within each group to set it in proper order
    for (const elementType in this.groupedColRowData) {
      this.groupedColRowData[elementType].sort((a, b) => a.order - b.order);
    }

    //Method for building data object
    this.groupedColRowData.Row?.forEach((row, index) => {
      let rowObj = [];
      this.groupedColRowData.Column?.forEach((col, index1) => {
        let cell = {
          current: this.currentResponse.grid_responses?.find(
            (data) => data.column_id === col.id && data.row_id === row.id
          ),
          previous: this.prevResponse?.grid_responses?.find(
            (data) => data.column_id === col.id && data.row_id === row.id
          ),
        };
        rowObj.push(cell);
      });

      this.data.push(rowObj);
    });
    this.gridLoaded = true;
  }

  copyGridData() {
    if (this.data.length)
      copyHtml(
        this.getSimpleTable(this.data),
        this.clipboardService,
        this.toaster
      );
  }

  getSimpleTable(data) {
    const gridData = data;

    // Create an HTML string representing the table structure
    let html = '<table>';
    for (let i = 0; i < gridData.length; i++) {
      html += '<tr>';

      for (let j = 0; j < gridData[i].length; j++) {
        let data =
          gridData[i][j] == null || gridData[i][j] == undefined
            ? ''
            : gridData[i][j];
        html +=
          '<td>' + (data.current?.value ? data.current?.value : '') + '</td>';
      }
      html += '</tr>';
    }
    html += '</table>';
    return html;
  }

  initDynamicGrid() {
    const colCount = this.gridData.rows_columns?.length;
    // grouping the data as per rowGroupId
    let groupedCurrColRowData = this.currentResponse?.grid_responses?.reduce(
      (result, item) => {
        const elementType = item.row_group_id;
        if (!result[elementType]) {
          result[elementType] = [];
        }
        result[elementType].push(item);
        return result;
      },
      {}
    );

    let groupedPrevRowData = this.prevResponse?.grid_responses?.reduce(
      (result, item) => {
        const elementType = item.row_group_id;
        if (!result[elementType]) {
          result[elementType] = [];
        }
        result[elementType].push(item);
        return result;
      },
      {}
    );

    let row_keys = [];
    if (groupedPrevRowData)
      row_keys =
        Object.keys(groupedCurrColRowData).length >=
        Object.keys(groupedPrevRowData).length
          ? Object.keys(groupedCurrColRowData).sort((a: any, b: any) => a - b)
          : Object.keys(groupedPrevRowData).sort((a: any, b: any) => a - b);
    else
      row_keys = Object.keys(groupedCurrColRowData).sort(
        (a: any, b: any) => a - b
      );
    row_keys.forEach((row: any) => {
      let row_data = [];
      this.gridData.rows_columns.forEach((col) => {
        let cell = {
          current: groupedCurrColRowData[row]?.find(
            (roww) => roww.column_group_id === col.group_id
          ),
          previous: groupedPrevRowData
            ? groupedPrevRowData[row]?.find(
                (roww) => roww.column_group_id === col.group_id
              )
            : '',
        };
        row_data.push(cell);
      });
      this.data.push(row_data);
    });
    this.gridLoaded = true;
  }
}
