import { HttpClient } from '@angular/common/http';
import { Component, OnInit, ViewChild } from '@angular/core';
import * as ExcelJS from 'exceljs';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { TemplatesDataService } from 'src/app2/services/template-data.service';
import { DvContextMenuComponent } from 'src/app2/shared/components/dv-context-menu/dv-context-menu.component';
import { keywordConstants } from 'src/app2/shared/constants/constant';
@Component({
  selector: 'app-excel-to-template',
  templateUrl: './excel-to-template.component.html',
  styleUrls: ['./excel-to-template.component.css'],
})
export class ExcelToTemplateComponent implements OnInit {
  @ViewChild('contextMenu') contextMenu: DvContextMenuComponent;
  td_tags: any = [];
  answersColCoordinate: any;
  answersObj: any = {};
  excelDataObj: any = {};
  tr_tags: any = [];
  use_sheet_name_as_section;
  isCellMarked;
  styleParams: any = {};
  markSheetAsSection = false;
  answer_columns = {};
  countsObject;
  stylesContainer = {};
  indexParams = {};
  comment_columns = {};
  excelData = [];
  workbook: any = {};
  styleClasses: any = [
    'questionsClass',
    'sectionsClass',
    'subSectionsClass',
    'answersClass',
    'commentClass',
  ];
  hoveredElement: any = null;
  selectionSteps: any;
  active_step = '';
  selectedItems: {
    Question: [];
    Section: [];
    // Instruction: [];
    SubSection: [];
    Comment: [];
    Answer: [];
  };
  document_id = null;
  originalExcelFile;
  templateParams;
  selectedSheet;
  loading = false;
  currentEvent: any = null;
  newFile: any;
  contextMenuConfig: any = {
    selector: '#element td',
    items: [
      {
        label: 'Mark as Category',
        submenuItems: [
          { key: 'Section-key1', label: 'This cell' },
          { key: 'Section-key2', label: 'All similar cells' },
        ],
      },
      {
        label: 'Mark as SubCategory',
        submenuItems: [
          { key: 'SubSection-key1', label: 'This cell' },
          { key: 'SubSection-key2', label: 'All similar cells' },
        ],
      },
      {
        label: 'Mark as Question',
        submenuItems: [
          { key: 'Question-key1', label: 'This cell' },
          { key: 'Question-key2', label: 'All similar cells' },
        ],
      },
      {
        label: 'Mark as Response',
        submenuItems: [
          { key: 'Answer-key1', label: 'This cell' },
          { key: 'Answer-key2', label: 'All similar cells' },
        ],
      },
      {
        label: 'Mark as Comment',
        submenuItems: [
          { key: 'Comment-key1', label: 'This cell' },
          { key: 'Comment-key2', label: 'All similar cells' },
        ],
      },
      {
        label: 'Unmark',
        submenuItems: [
          { key: 'Unmark-key1', label: 'This cell' },
          { key: 'Unmark-key2', label: 'All similar cells' },
        ],
      },
    ],
  };
  currentElement: any;
  constructor(
    private readonly swal: SweetAlertService,
    private readonly templatesDataService: TemplatesDataService,
    private readonly http: HttpClient,
    private readonly customModalFactory: CustomModalService
  ) {}

  ngOnInit(): void {
    this.setSectionSteps();

    this.countsObject = {
      questions: { count: 0, data: [] },
      sections: { count: 0, data: [] },
      answers: { count: 0, data: [] },
      subSections: { count: 0, data: [] },
      unmarked: {},
    };
    this.excelDataObj = this.templatesDataService.getExcelParserData();
    this.document_id = this.excelDataObj.doc_id;

    this.originalExcelFile = this.templatesDataService.getOriginalExcelFile();
    if (!this.originalExcelFile.length) {
      this.swal.error({ title: 'Please try again' });
      return window.history.back();
    }
    let file: Blob;
    file = this.originalExcelFile[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = (event: any) => {
        const arrayBuffer = reader.result;
        this.workbook = new ExcelJS.Workbook();
        this.workbook.xlsx.load(arrayBuffer);
      };

      reader.readAsArrayBuffer(file);
    }

    this.templateParams = this.templatesDataService.getTemplateParams();
    if (this.excelDataObj.html_content) {
      this.excelData = this.excelDataObj.html_content;
      if (this.excelData.length) {
        this.selectedSheet = this.excelData[0];
      }
      this.initExcelFile();
    } else {
      this.http
        .post(
          `/excel_parser/upload?parserType=Excel&doc_id=${this.document_id}`,
          {}
        )
        .subscribe(
          (response: { data: any }) => {
            this.excelDataObj = response.data;
            if (this.excelDataObj.html_content) {
              this.excelData = this.excelDataObj.html_content;
              if (this.excelData.length) {
                this.selectedSheet = this.excelData[0];
              }
            }
          },
          (error: any) => {
            console.error(error);
          }
        );
    }

    if (this.newFile) {
      this.templateParams = {};
      this.excelData = this.newFile.html_content;
      this.templateParams.name = this.newFile.file[0].name;
      if (this.excelData.length) {
        this.selectedSheet = this.excelData[0];
      }
    }
  }

  ngAfterViewInit(): void {
    this.initExcelFile();
  }

  setSectionSteps() {
    this.selectionSteps = [
      {
        alias: 'Category',
        name: keywordConstants.Category,
        is_active: false,
        count: 0,
        is_visible: true,
      },
      {
        alias: 'SubCategory',
        name: 'SubSection',
        is_active: false,
        count: 0,
        is_visible: true,
      },
      {
        alias: keywordConstants.Question,
        name: keywordConstants.Question,
        is_active: false,
        count: 0,
        is_visible: true,
      },
      {
        alias: 'Response',
        name: keywordConstants.Answer,
        is_active: false,
        count: 0,
        is_visible: false,
      },
      {
        alias: keywordConstants.Comment,
        name: keywordConstants.Comment,
        is_active: false,
        count: 0,
        is_visible: false,
      },
    ];
  }

  initExcelFile() {
    this.loading = true;
    const selectedSheets = [];
    this.excelData.map((entry) => {
      this.stylesContainer[entry.sheet_no] = {};
      this.indexParams[entry.sheet_no] = {};
      entry.is_active = true;
      selectedSheets.push(entry);
    });

    this.templatesDataService.setSelectedSheets(selectedSheets);
    //unsubscribe to this below settimeout
    this.initContextMenu();

    setTimeout(() => {
      this.excelData.map((entry) => {
        this.setCoordinatesForTags(entry);
      });
    }, 3000);

    this.loading = false;
  }

  getStyle(tag: any) {
    const style = getComputedStyle(tag);
    const key =
      style['color'] +
      style['fontFamily'] +
      style['backgroundColor'] +
      style['fontWeight'];
    return key;
  }

  showStepCount(step: { name: any }) {
    let selected_option = this.lowerCaseFirstLetter(step.name);
    selected_option = selected_option + 's';
    let count = this.countsObject[selected_option]?.count || 0;
    return count;
  }

  lowerCaseFirstLetter(string: string) {
    return string.charAt(0).toLowerCase() + string.slice(1);
  }

  // Need to use appropriate answer_column value and comment column value for each sheet in for loop.
  initContextMenu() {}

  clearSelectedSheet(all?: any) {
    this.swal
      .confirm({
        title: 'Are you sure you want to reset this sheet?',
        text: 'This will clear all marked items in current sheet',
        confirmButtonText: 'Proceed',
        focusCancel: true,
      })
      .then((isConfirm: { value: boolean; dismiss: string }) => {
        if (isConfirm.dismiss && isConfirm.dismiss === 'cancel') {
          this.swal.close();
          return;
        }
        this.excelData.map((entry) => {
          if (entry.sheet_no === this.selectedSheet.sheet_no) {
            entry.is_done = false;
            return;
          }
          // remove state of active sheet
          this.stylesContainer[this.selectedSheet.sheet_no] = {};
          this.indexParams[this.selectedSheet.sheet_no] = {};
        });

        // Fetch all the td_tags of the sheet using the div_id
        if (all) {
          this.td_tags = document.getElementsByTagName('td');
        } else {
          this.td_tags = document
            .getElementById('table_' + this.selectedSheet.sheet_no)
            .getElementsByTagName('td');
        }
        // Iterate over the td_tags
        Object.values(this.td_tags).map((td_tag: any) => {
          const type = td_tag.getAttribute('type');
          // See if type is available or not, if yes set type as empty or whatever you use to unmark and remove the marking.
          if (type) {
            this.deselect_cell(td_tag, type);
          }
        });

        setTimeout(() => {
          this.updateCounts();
        });
      });
  }

  saveClickedElement(event: any) {
    event.preventDefault();
    this.initContextMenu();
    // Check for the current element, parent element for the selector
    const parentElement = event.target.closest(this.contextMenuConfig.selector);
    if (
      !(event.target.matches(this.contextMenuConfig.selector) || parentElement)
    )
      return;
    this.currentEvent = event;
    this.currentElement = parentElement || event.target;
  }

  exportData(params: any) {
    const final_json = {
      Document_id: this.document_id,
      name: this.templateParams.name,
      sections: [],
    };
    let k = 0;
    const len = params.length;
    while (k < len) {
      const sheetParam = params[k];
      const section_obj = {
        text: sheetParam.sheet_name,
        sheet_name: sheetParam.sheet_name,
        subSections: [],
      };
      const sub_section_obj = {
        text: sheetParam.sheet_name,
        questions: [],
      };
      const tr_tags = document
        .getElementById(sheetParam.div_id)
        .querySelectorAll('tr[id]');
      let i = 0;
      while (i < tr_tags.length) {
        const tr_tag = tr_tags[i];
        const id = tr_tag.getAttribute('id');
        if (id && id.charAt(0) !== 'r') {
          i++;
          continue;
        }
        const td_tags = Array.from(tr_tag.children);
        let j = 0;
        while (j < td_tags.length) {
          var sub_section_obj_copy: any;
          const td_tag: any = td_tags[j];
          let type = td_tag.getAttribute('type');
          const text = td_tag.innerText;

          /*
            We will check the type of the td_tag, if the type is section,
            we will check if the section_obj has any sub_section objects,
            if yes, we will add the section_obj to the final_json and we will reassign the section obj with the new section name value
            if no, we will reassign the section obj with the new section name value
            */

          if (
            !this.markSheetAsSection &&
            text &&
            type === keywordConstants.Category
          ) {
            if (sub_section_obj['questions'].length > 0) {
              sub_section_obj_copy = JSON.parse(
                JSON.stringify(sub_section_obj)
              );
              section_obj['subSections'].push(sub_section_obj_copy);
            }
            if (section_obj['subSections'].length > 0) {
              const section_obj_copy = JSON.parse(JSON.stringify(section_obj));
              final_json['sections'].push(section_obj_copy);
            }
            section_obj['text'] = text;
            section_obj['subSections'] = [];
            sub_section_obj['text'] = text;
            sub_section_obj['questions'] = [];
          } else if (text && type === 'SubSection') {
            if (sub_section_obj['questions'].length > 0) {
              sub_section_obj_copy = JSON.parse(
                JSON.stringify(sub_section_obj)
              );
              section_obj['subSections'].push(sub_section_obj_copy);
            }
            sub_section_obj['text'] = text;
            sub_section_obj['questions'] = [];
          } else if (text && type === keywordConstants.Question) {
            /*
              If the type of the tag is question, we will add the question obj with necessary info to the sub_section_obj
              */

            let ans_row_coord = td_tags[j].getAttribute('row_coord');
            let ans_col_coord = sheetParam.answer_column;
            //Here assign the answer_column value
            let cmt_row_coord = td_tags[j].getAttribute('row_coord');
            let cmt_col_coord = sheetParam.comment_column;
            let is_answer_found = false;
            let is_comment_found = false;
            let l = undefined;
            l = j + 1;
            while (l < td_tags.length) {
              const tag = td_tags[l];
              type = tag.getAttribute('type');
              if (type === keywordConstants.Answer) {
                ans_row_coord = tag.getAttribute('row_coord');
                ans_col_coord = tag.getAttribute('column_coord');
                is_answer_found = true;
              } else if (type === keywordConstants.Comment) {
                cmt_row_coord = tag.getAttribute('row_coord');
                cmt_col_coord = tag.getAttribute('column_coord');
                is_comment_found = true;
              } else if (
                type === keywordConstants.Category ||
                type === 'SubSection' ||
                type === keywordConstants.Question
              ) {
                break;
              }
              if (is_answer_found && is_comment_found) {
                break;
              }
              l++;
            }
            j = l - 1;
            const resposeTypeData = this.getCellType(
              sheetParam.sheet_name,
              ans_row_coord,
              ans_col_coord
            );
            const question_obj = {
              text: text,
              responseType: resposeTypeData['type'],
              responseTypeDesc:
                resposeTypeData['text'] || resposeTypeData['type'],
              response_coordinates: ans_row_coord + ',' + ans_col_coord,
              comment_coordinates: null,
              is_selected: true,
            };
            if (resposeTypeData['type'] === 'Dropdown') {
              question_obj['responseOptions'] = resposeTypeData['values'];
            }

            /*
                  Here we check if the user has selected value for comment column, then we add value for comment column.
              */

            if (cmt_col_coord) {
              question_obj['comment_coordinates'] =
                cmt_row_coord + ',' + cmt_col_coord;
            }
            sub_section_obj['questions'].push(question_obj);
          }
          j++;
        }
        i++;
      }
      if (sub_section_obj['questions'].length > 0) {
        section_obj['subSections'].push(sub_section_obj);
      }
      if (section_obj['subSections'].length > 0) {
        final_json['sections'].push(section_obj);
      }
      k++;
    }
    return final_json;
  }

  setCoordinatesForTags(sheet: any) {
    const div_id = 'table_' + sheet.sheet_no;
    const wrapper_tag = document.getElementById(div_id);
    return (() => {
      const tr_tags: any = wrapper_tag.querySelectorAll('tr');
      const merged_rows = {};
      const result = [];
      // starting with -1 as the row starts from header and to keep it consistent with export to original response insertion logic
      let tr_id = -1;
      let tdTagCount = 0;
      Object.values(tr_tags).map((tr_tag: any) => {
        if (tr_id == -1) {
          tr_id++;
          return;
        }
        tr_tag.id = `r${tr_id}`;
        const id = tr_tag.id;
        tr_id++;
        if (id && id.charAt(0) === 'r') {
          var row_coord = parseInt(id.substring(1)) + 1;
          var td_tags: any = Array.from(tr_tag.children);
          td_tags.shift();
          var column_coord = 1;
          result.push(
            (() => {
              const result1 = [];
              td_tags.map((td_tag: any) => {
                if (row_coord in merged_rows) {
                  while (merged_rows[row_coord].includes(column_coord)) {
                    column_coord++;
                  }
                }
                const tag_style = this.getStyle(td_tag);
                td_tag.id = `td_${tdTagCount}`;
                tdTagCount++;
                td_tag.setAttribute('row_coord', row_coord.toString());
                td_tag.setAttribute('column_coord', column_coord.toString());
                td_tag.setAttribute('tag_style', tag_style);
                const row_span = td_tag.getAttribute('rowspan');
                let col_span: any = td_tag.getAttribute('colspan');
                if (!col_span) {
                  col_span = 1;
                }
                if (row_span) {
                  const merged_columns = [];
                  let i = column_coord;
                  while (i < column_coord + parseInt(col_span)) {
                    merged_columns.push(i);
                    i++;
                  }
                  i = row_coord + 1;
                  while (i < row_coord + parseInt(row_span)) {
                    if (i in merged_rows) {
                      merged_rows[i] = merged_rows[i].concat(merged_columns);
                    } else {
                      merged_rows[i] = merged_columns;
                    }
                    i++;
                  }
                }
                result1.push((column_coord += parseInt(col_span)));
              });
              return result1;
            })()
          );
        }
      });
      return result;
    })();
  }

  setColorForQuestionSectionSubSectionCellsV2(
    style_key: string,
    type_of_text: string | number,
    element: any,
    sheet_no: string | number
  ): any {
    if (!style_key || !style_key.length)
      return this.swal.error({ title: 'Please try again' });
    const selected_tag = element;
    const column_index_of_selected_tag = selected_tag.cellIndex;
    const row_id: any = selected_tag.closest('tr')?.id;
    const key = `${row_id}_${column_index_of_selected_tag}`;
    this.stylesContainer[sheet_no][key] = {
      type_of_text,
      column_index_of_selected_tag,
      style_key,
      selected: true,
      row_id,
    };
    this.indexParams[sheet_no][type_of_text + '_' + row_id] =
      column_index_of_selected_tag;
  }

  setColorForQuestionSectionSubSectionCells(
    style_key: string,
    type_of_text: string | number,
    element: any,
    sheet_no: string | number
  ): any {
    if (!style_key || !style_key.length) {
      this.swal.error({ title: 'Please try again' });
      return;
    }
    let tr_tags: any = document
      .getElementById('table_' + this.selectedSheet.sheet_no)
      .getElementsByTagName('tr');

    const selected_tag = element;
    const column_index_of_selected_tag = selected_tag.cellIndex; //selected_tag is the cell user clicked, getting it's column value using cellIndex property.
    // Iterating through each row (tr of table) of the sheet (table)

    Object.values(tr_tags).map((tr_tag: any, index: number) => {
      const row_id = tr_tag.id;
      const obj_key = `${row_id}_${column_index_of_selected_tag}`;
      // Getting the list of cells in that row
      const cells = tr_tag.getElementsByTagName('td');
      // Checking the number of cells in that row, sometimes a row might have less number of cells because of merging cells in Excel. This is to avoid Array Index Error.
      // Eg if the user has selected column number 10, there is a possibility that a row might have only 9 cells because of merging cell in Excel, in this case we will skip this row and we won't perform any style comparsion to select the cell
      if (cells.length <= column_index_of_selected_tag) {
        return;
      }
      // cell_to_compare is the ith cell/ cell at ith column value. i is the column value selected by the user which is stored in column_index_of_selected_tag
      const cell_to_compare = cells[column_index_of_selected_tag];
      // Rest is same, we fetch the style and text of that cell and compare it, if it's same we will mark it.
      const key = this.getStyle(cell_to_compare);
      const text = cell_to_compare.innerText;
      if (text && key.localeCompare(style_key) === 0) {
        (cell_to_compare as Element).setAttribute(
          'type',
          type_of_text.toString()
        );
      }
    });
  }

  changeExcelFile() {
    const templateParams = this.templatesDataService.getTemplateParams();
    this.customModalFactory.invoke('manage-excel-file', {
      initialState: {
        params: templateParams,
        success: (res: any) => {
          this.newFile = res;
          return this.ngOnInit();
        },
      },
    });
  }

  setColorForSingleCell(currentTag: Element, type_of_text: any) {
    return currentTag.setAttribute('type', type_of_text);
  }

  getCellType(sheet_name: any, rownum: any, colnum: any) {
    let params: { type: string; values?: {}; text?: string };
    try {
      let worksheet = this.workbook.getWorksheet(sheet_name);
      const cell = worksheet
        .getRow(parseInt(rownum))
        ?.getCell(parseInt(colnum));
      const data_validation = cell.dataValidation || cell._dataValidations;
      if (data_validation) {
        const cell_type = data_validation['type'];
        if (cell_type === 'list') {
          let i: number;
          let formulae = data_validation['formulae'][0];
          let dropdown_values: any = [];
          if (formulae.includes('$')) {
            if (formulae.includes('!$')) {
              const formaulae_data = formulae.split('!$');
              formulae = formaulae_data[1];
              sheet_name = formaulae_data[0].slice(1, -1);
              worksheet = this.workbook.getWorksheet(sheet_name);
            }
            const cell_ranges = formulae.split(':');
            const start_cell = worksheet.getCell(cell_ranges[0]);
            const end_cell = worksheet.getCell(cell_ranges[1]);
            const start_row = start_cell._row._number;
            const start_col = start_cell._column._number;
            const end_row = end_cell._row._number;
            const end_col = end_cell._column._number;
            if (start_row === end_row) {
              i = start_col;
              while (i <= end_col) {
                dropdown_values.push(
                  worksheet.getRow(start_row).getCell(i).value
                );
                i++;
              }
            } else if (start_col === end_col) {
              i = start_row;
              while (i <= end_row) {
                dropdown_values.push(
                  worksheet.getRow(i).getCell(start_col).value
                );
                i++;
              }
            }
          } else {
            dropdown_values = formulae.slice(1, -1);
            if (dropdown_values.length > 0) {
              dropdown_values = dropdown_values.split(',');
            } else {
              dropdown_values = [];
            }
          }
          const small_dropdown_values = [];
          i = 0;
          while (i < dropdown_values.length) {
            const dd_value = dropdown_values[i];
            if (dd_value) {
              small_dropdown_values.push(dd_value.toLowerCase().trim());
            }
            i++;
          }
          if (
            dropdown_values.length <= 3 &&
            ((small_dropdown_values.includes('yes') &&
              small_dropdown_values.includes('no')) ||
              (small_dropdown_values.includes('true') &&
                small_dropdown_values.includes('false')))
          ) {
            params = { type: 'Boolean' };
            return params;
          } else {
            const response_options_obj = [];
            i = 0;
            while (i < dropdown_values.length) {
              const option_obj = {
                value: '',
                id: 0,
                is_active: true,
              };
              option_obj['value'] = dropdown_values[i];
              response_options_obj.push(option_obj);
              i++;
            }
            params = {
              type: 'Dropdown',
              values: response_options_obj,
            };
            return params;
          }
        } else if (cell_type === 'date') {
          params = { type: 'Date' };
        } else if (cell_type === 'whole') {
          params = { type: 'Integer' };
        } else if (cell_type === 'decimal') {
          params = { type: 'Numeric' };
        } else if (cell_type === 'textLength') {
          params = {
            type: 'TextMultiLine',
            text: 'Text Explanation - Paragraph',
          };
        } else {
          params = {
            type: 'TextMultiLine',
            text: 'Text Explanation - Paragraph',
          };
        }
      } else {
        params = {
          type: 'TextMultiLine',
          text: 'Text Explanation - Paragraph',
        };
      }
      return params;
    } catch (error) {
      params = {
        type: 'TextMultiLine',
      };
      return params;
    }
  }

  markSelectedItemsInOtherSheets(params: any) {
    // Get all div elements with both attributes data-is-active and data-apply-style set to true
    const activeStyleDivs = document.querySelectorAll(
      'div[data-is-active="true"][data-apply-style="true"]'
    );

    activeStyleDivs.forEach((div) => {
      const table = div.querySelector('table');
      if (table) {
        // get rows with having ids
        const tr_tags: any = table.querySelectorAll('tr[id]');
        for (let tr_tag of tr_tags) {
          // get all td tags
          var cells = tr_tag.querySelectorAll('td');
          // iterating through object where styles exists of active sheet and applying in all other td tags
          for (let key in params[this.selectedSheet.sheet_no]) {
            // row_config contains
            // type_of_text, column_index_of_selected_tag , style_key , selected , row_id
            const row_config = params[this.selectedSheet.sheet_no][key];
            if (tr_tag.id === row_config.row_id) {
              const cell_index = row_config.column_index_of_selected_tag;
              // Getting the list of cells in that row
              const cell_to_compare = cells.item(cell_index);
              if (cell_to_compare && row_config.selected) {
                const key = this.getStyle(cell_to_compare);
                const text = cell_to_compare.innerText;
                if (text && key.localeCompare(row_config.style_key) === 0) {
                  (cell_to_compare as Element).setAttribute(
                    'type',
                    row_config.type_of_text
                  );
                }
              }
              if (row_config.selected === false && cell_to_compare) {
                (cell_to_compare as Element).removeAttribute('type');
              }
            }
          }
        }
      }
    });
    this.updateCounts();
    this.saveSheetStyles();
  }

  /**
   * save the style into other sheet containers
   */
  saveSheetStyles() {
    const otherSheetsIds = Object.keys(this.stylesContainer).filter(
      (x) => x != this.selectedSheet.sheet_no
    );
    const indexParams = Object.keys(this.indexParams).filter(
      (x) => x != this.selectedSheet.sheet_no
    );
    const otherSheet = JSON.parse(
      JSON.stringify(this.stylesContainer[this.selectedSheet.sheet_no])
    );
    otherSheetsIds.forEach((sheet) => {
      const self = JSON.parse(JSON.stringify(this.stylesContainer[sheet]));
      this.stylesContainer[sheet] = {
        ...self,
        ...otherSheet,
      };
    });
    indexParams.forEach((sheet) => {
      this.indexParams[sheet] = {
        ...this.indexParams[sheet],
        ...this.indexParams[this.selectedSheet.sheet_no],
      };
    });
  }

  toggleApplyStyle() {
    if (
      this.countsObject.questions.count === 0 ||
      this.countsObject.sections.count === 0 ||
      this.countsObject.answers.count === 0
    ) {
      this.swal
        .confirm({
          title: 'Action Required',
          text: 'Please mark Categories, Questions and Response column before applying to other sheets',
          confirmButtonText: 'Okay',
        })
        .then((response: any) => {
          this.swal.close();
        });
      return;
    }
    const params = this.templatesDataService.getSelectedSheets();
    this.customModalFactory.invoke('manage-excel-sheets', {
      initialState: {
        sheets: params,
        disabledMode: false,
        selectedSheetNo: this.selectedSheet.sheet_no,
        type: 'apply_style',
        success: (response: any) => {
          response.map((entry, index) => {
            this.excelData[index].apply_style = entry.apply_style;
          });
          setTimeout(() => {
            this.markSelectedItemsInOtherSheets(this.stylesContainer);
          }, 10);

          if (Object.keys(this.answersObj).length) {
            setTimeout(() => {
              this.setColorForAnswerColumnAll(
                this.answersObj[this.selectedSheet.sheet_no]?.answer_column
              );
            }, 100);
          }

          setTimeout(() => {
            this.updateCounts();
            const fromApplySheet = true;
            this.markSheetsAsDone(fromApplySheet);
          }, 100);
        },
      },
      class: 'modal-lg',
    });
  }

  deselect_cell(tag: any, type_of_text: any) {
    const column_index_of_selected_tag = tag.cellIndex;
    const row_id: any = tag.closest('tr')?.id;
    const key = `${row_id}_${column_index_of_selected_tag}`;
    let style_key = this.getStyleFromTagStyle(tag) || this.getStyle(tag);
    this.stylesContainer[this.selectedSheet.sheet_no][key] = {
      type_of_text,
      column_index_of_selected_tag,
      style_key,
      selected: false,
      row_id,
    };
    this.indexParams[this.selectedSheet.sheet_no][type_of_text + '_' + row_id] =
      column_index_of_selected_tag;
    return tag.removeAttribute('type');
  }

  setColorForAnswerColumnAll(answer_column: string | number) {
    const table_rows = document.getElementsByTagName('tr');
    let i = 0;
    while (i < table_rows.length) {
      const table_cols = table_rows[i].getElementsByTagName('td');
      let j = 0;
      while (j < table_cols.length) {
        const type = table_cols[j].getAttribute('type');
        if (type === keywordConstants.Question) {
          table_cols[answer_column].setAttribute(
            'type',
            keywordConstants.Answer
          );
        }
        j++;
      }
      i++;
    }
  }

  setColorForAnswerColumn(answer_column: string | number, sheet_no: any) {
    this.answersObj[this.selectedSheet.sheet_no] = {};
    this.answersObj[this.selectedSheet.sheet_no]['answer_column'] =
      answer_column;
    this.templatesDataService.setAnswerObject(this.answersObj);
    const table_rows = document
      .getElementById('table_' + this.selectedSheet.sheet_no)
      .getElementsByTagName('tr');
    let i = 0;
    while (i < table_rows.length) {
      const table_cols = table_rows[i].getElementsByTagName('td');
      let j = 0;
      while (j < table_cols.length) {
        const type = table_cols[j].getAttribute('type');
        if (type === keywordConstants.Question) {
          table_cols[answer_column].setAttribute(
            'type',
            keywordConstants.Answer
          );
          if (sheet_no) {
            table_cols[answer_column].setAttribute('sheet', sheet_no);
          }
        }
        j++;
      }
      i++;
    }
  }

  setColorForCommentColumn(comment_column: string | number, sheet_no: any) {
    const table_rows = document
      .getElementById('table_' + this.selectedSheet.sheet_no)
      .getElementsByTagName('tr');
    let i = 0;
    while (i < table_rows.length) {
      const table_cols = table_rows[i].getElementsByTagName('td');
      let j = 0;
      while (j < table_cols.length) {
        const type = table_cols[j].getAttribute('type');
        if (type === keywordConstants.Question) {
          table_cols[comment_column].setAttribute(
            'type',
            keywordConstants.Comment
          );
          if (sheet_no) {
            table_cols[comment_column].setAttribute('sheet', sheet_no);
          }
        }
        j++;
      }
      i++;
    }
  }

  getMarkedData(sheet_no: string) {
    const array = [];
    let td_tags: any;
    if (sheet_no) {
      td_tags = document
        .getElementById('table_' + sheet_no)
        .getElementsByTagName('td');
    } else {
      td_tags = document.getElementsByTagName('td');
    }
    Object.values(td_tags).map((td_tag: any) => {
      // Get the type attribute of the td_tag
      const type = td_tag.getAttribute('type');
      // See if type is available or not, if yes set type as empty or whatever you use to unmark and remove the marking.
      if (type) {
        array.push({
          text: td_tag.innerText,
          tag: td_tag,
          is_selected: true,
          type,
        });
      }
    });
    return array;
  }

  updateCountAndData(countObject, td_tag, itemType) {
    countObject[itemType].count += 1;
    countObject[itemType].data.push({
      text: td_tag.innerText,
      tag: td_tag,
      is_selected: true,
    });
  }

  updateCounts(): any {
    let countsObjectLocal = {
      questions: { count: 0, data: [] },
      sections: { count: 0, data: [] },
      subSections: { count: 0, data: [] },
      answers: { count: 0, data: [] },
    };
    let td_tags: any = document.getElementsByTagName('td');

    // Iterate over the td_tags
    Object.values(td_tags).forEach((td_tag: any, index: number) => {
      td_tag.id = `td_${index}`;
      // Get the type attribute of the td_tag
      const type = td_tag.getAttribute('type');
      if (type) {
        const typesMap = {
          [keywordConstants.Question]: 'questions',
          [keywordConstants.Category]: 'sections',
          SubSection: 'subSections',
          [keywordConstants.Answer]: 'answers',
        };

        const itemType = typesMap[type];
        if (itemType) {
          this.updateCountAndData(countsObjectLocal, td_tag, itemType);
        }
      }
    });

    if (this.markSheetAsSection) {
      countsObjectLocal.sections.count = this.excelData.length;

      Array.from(this.excelData).map((entry: { sheet_name: any }) =>
        countsObjectLocal.sections.data.push({
          text: entry.sheet_name,
          tag: null,
          is_selected: true,
        })
      );
    }
    this.countsObject = countsObjectLocal;
  }

  unMarkItems(action: string): any {
    const type = this.currentEvent.target.getAttribute('type');
    if (type) {
      if (action === 'all') {
        this.clearSelectionByType(type, false);
      } else {
        this.deselect_cell(this.currentElement, type);
        this.closePopover();
      }
      this.closePopover();
      this.updateCounts();
    }
    this.markSheetsAsDone();
  }

  clearSelectionByType(tabType: string, all: boolean) {
    if (all) {
      this.td_tags = document.getElementsByTagName('td');
    } else {
      // Fetch all the td_tags of the sheet using the div_id
      this.td_tags = document
        .getElementById('table_' + this.selectedSheet.sheet_no)
        .getElementsByTagName('td');
    }
    // Iterate over the td_tags
    let i = 0;
    while (i < this.td_tags.length) {
      // Get the type attribute of the td_tag
      const type = this.td_tags[i].getAttribute('type');
      // See if type is available or not, if yes set type as empty or whatever you use to unmark and remove the marking.
      if (type && type === tabType) {
        this.deselect_cell(this.td_tags[i], tabType);
      }
      i++;
    }
  }

  markSheetsAsDone(sheet_no?: any) {
    const requiredTypes = [keywordConstants.Question, keywordConstants.Answer];
    if (!this.markSheetAsSection) {
      requiredTypes.push(keywordConstants.Category);
    }
    let sheetsData = {};
    this.excelData.map((entry, index) => {
      sheetsData[index] = [];
      if (entry.is_active) {
        const sheet_data = this.getMarkedData(entry.sheet_no);
        for (const sheet of sheet_data) {
          sheetsData[index].push(sheet.type);
        }
      }
    });
    Object.keys(sheetsData).forEach((sheetDataKey, index) => {
      const result = requiredTypes.every((type) =>
        sheetsData[index].includes(type)
      );
      this.excelData[index].is_done = result;
    });
  }

  cellSpecificOptionClick(type_of_text: any): any {
    const target = this.currentElement;
    if (target.tagName.toLowerCase() === 'td') {
      this.setColorForSingleCell(target, type_of_text);
      let key = this.getStyleFromTagStyle(target) || this.getStyle(target);
      this.setColorForQuestionSectionSubSectionCellsV2(
        key,
        type_of_text,
        target,
        this.selectedSheet.sheet_no
      );
      this.updateCounts();
      this.closePopover();
      setTimeout(() => {
        this.markSheetsAsDone();
      });
    }
  }

  get_unmarked_cells(params: any) {
    const unmarked_data = {
      count: 0,
      data: [],
    };
    params.map((sheetParam) => {
      const { sheet_name, sheet_no, div_id } = sheetParam;
      unmarked_data[sheet_name] = [];
      const td_tags: any =
        document?.getElementById(div_id)?.querySelectorAll('td[row_coord]') ||
        {};
      Object.values(td_tags).map((td_tag: any) => {
        const text = td_tag.innerText;
        const type = td_tag.getAttribute('type');
        const row_coordinate = td_tag.getAttribute('row_coord');
        const col_coordinate = td_tag.getAttribute('column_coord');
        const cell_index =
          this.get_excel_column_name_from_number(col_coordinate) +
          row_coordinate;
        if (text && !type) {
          unmarked_data.count += 1;
          const unmarked_obj = {
            text: text,
            sheet_name: sheet_name,
            sheet_no: sheet_no,
            row_coordinate: row_coordinate,
            column_coordinate:
              this.get_excel_column_name_from_number(col_coordinate),
            cell_index: cell_index,
          };
          unmarked_data.data.push(unmarked_obj);
        }
      });
    });
    return unmarked_data;
  }

  get_excel_column_name_from_number(column_number: number) {
    // This function converts the column number to excel column letter
    column_number -= 1;
    const ordA = 'A'.charCodeAt(0);
    // Unicode value of A
    const ordZ = 'Z'.charCodeAt(0);
    // Unicode value of Z
    const len = ordZ - ordA + 1;
    // Number of letters to use for conversion, In excel it is always 26
    let excel_column_name = '';
    while (column_number >= 0) {
      // Finds column letter value by repeatedly subtracting 26 (len) from the column number
      excel_column_name =
        String.fromCharCode((column_number % len) + ordA) + excel_column_name;
      column_number = Math.floor(column_number / len) - 1;
    }
    return excel_column_name;
  }

  getStyleFromTagStyle(tag: any) {
    const key = tag.getAttribute('tag_style');
    return key;
  }

  optionClick(e: any) {
    const element = this.currentElement;
    if (element.tagName.toLowerCase() === 'td') {
      const type_of_text = e;
      let key = this.getStyleFromTagStyle(element);
      if (!key) {
        key = this.getStyle(element);
      }
      const bgColors = {
        Section: '#444',
        SubSection: '#8adfeb',
        Question: '#009688',
        Answer: '#FF9800',
      };
      const current = element.cellIndex;
      if (type_of_text === keywordConstants.Answer) {
        const sheet_data = this.getMarkedData(this.selectedSheet.sheet_no);
        let questionFound = false;
        if (sheet_data.length) {
          for (let entry of Array.from(sheet_data)) {
            if (entry.type === keywordConstants.Question) {
              questionFound = true;
              break;
            }
          }
        }
        if (!questionFound)
          return this.swal.error({ title: 'Please select questions first' });
        this.answer_columns[this.selectedSheet.sheet_no] = current;
        this.clearSelectionByType(keywordConstants.Answer, false);
        this.setColorForAnswerColumn(current, this.selectedSheet.sheet_no);
        setTimeout(() => {
          this.closePopover();
          this.updateCounts();
          this.markSheetsAsDone();
        });
      } else if (type_of_text === keywordConstants.Comment) {
        this.comment_columns[this.selectedSheet.sheet_no] = current;
        this.clearSelectionByType(keywordConstants.Comment, false);
        setTimeout(() => {
          this.setColorForCommentColumn(current, this.selectedSheet.sheet_no);
          this.markSheetsAsDone();
          this.closePopover();
        });
      } else {
        if (
          type_of_text === keywordConstants.Category &&
          this.markSheetAsSection
        ) {
          this.markSheetAsSection = false;
          this.markSheetsAsSection();
          setTimeout(() => {
            this.setColorForQuestionSectionSubSectionCells(
              key,
              type_of_text,
              element,
              this.selectedSheet.sheet_no
            );
          });
        } else {
          this.setColorForQuestionSectionSubSectionCells(
            key,
            type_of_text,
            element,
            this.selectedSheet.sheet_no
          );
          setTimeout(() => {
            this.updateCounts();
            this.markSheetsAsDone();
            this.closePopover();
          });
        }
      }
    }
  }

  setSelectedSheet(sheet: any): any {
    if (sheet.is_active) {
      this.selectedSheet = sheet;
    }
  }

  closePopover() {
    this.contextMenu.closeMenu();
  }

  markSheetsAsSection() {
    this.excelData.map((entry) => (entry.is_section = this.markSheetAsSection));
    this.unmarkCategories();
    this.updateCounts();
    setTimeout(() => {
      this.markSheetsAsDone();
    });
  }

  unmarkCategories() {
    this.clearSelectionByType(keywordConstants.Category, true);
  }

  openImportModal() {
    let answerFound: boolean,
      entry: {
        type: string;
        sheet_no: string;
        sheet_name: any;
        is_active: any;
        is_done: any;
      },
      questionFound: boolean,
      sectionFound: boolean;
    const sheet_data = this.getMarkedData(this.selectedSheet.sheet_no);
    for (entry of Array.from(sheet_data)) {
      if (entry.type === keywordConstants.Answer) {
        answerFound = true;
      }
      if (entry.type === keywordConstants.Category) {
        sectionFound = true;
      }
      if (entry.type === keywordConstants.Question) {
        questionFound = true;
      }
    }

    if (!sectionFound && !this.markSheetAsSection) {
      this.swal.error({ title: 'Please mark Category' });
      return;
    }
    if (!questionFound) {
      this.swal.error({ title: 'Please mark Questions' });
      return;
    }
    if (!answerFound) {
      this.swal.error({ title: 'Please mark Response Column' });
      return;
    }

    const is_valid = false;
    const params = [];
    const unmarkParams = [];
    this.excelData.map((entry) => {
      const obj2: any = {};
      obj2.sheet_no = entry.sheet_no;
      obj2.sheet_name = entry.sheet_name;
      obj2.div_id = 'table_' + entry.sheet_no;
      unmarkParams.push(obj2);
      if (entry.is_active && entry.is_done) {
        const innerObj: any = {};
        innerObj.sheet_no = entry.sheet_no;
        innerObj.sheet_name = entry.sheet_name;
        innerObj.div_id = 'table_' + entry.sheet_no;
        innerObj.answer_column = this.answer_columns[entry.sheet_no];
        innerObj.comment_column = this.comment_columns[entry.sheet_no];
        params.push(innerObj);
      }
    });
    // this.countsObject = this.updateCounts();
    const testParams2 = this.exportData(params);
    const unmarkedItems = this.get_unmarked_cells(unmarkParams);
    if (unmarkedItems.data.length) {
      return this.swal
        .confirm({
          title: 'Action Required!',
          text: `There are ${unmarkedItems.count} unmarked items. Would you like to see?`,
          confirmButtonText: 'Continue to preview',
          cancelButtonText: 'See unmarked',
          focusCancel: true,
        })
        .then((isConfirm: { value: boolean }) => {
          if (isConfirm.value && isConfirm.value === true) {
            this.customModalFactory.invoke('manage-excel-template', {
              initialState: {
                selection: this.countsObject,
                params: testParams2,
              },
              class: `modal-xl`,
            });
          } else {
            this.customModalFactory.invoke('view-unmarked-items', {
              initialState: {
                items: unmarkedItems.data,
              },
              class: 'modal-lg',
            });
          }
        });
    } else {
      this.customModalFactory.invoke('manage-excel-template', {
        initialState: {
          selection: this.countsObject,
          params: testParams2,
        },
        class: 'modal-xl',
      });
    }
  }

  openEditSheetModal() {
    const params = this.templatesDataService.getSelectedSheets();
    this.customModalFactory.invoke('manage-excel-sheets', {
      initialState: {
        sheets: params,
        disabledMode: true,
        selectedSheetNo: this.selectedSheet.sheet_no,
        success: (data: any) => {
          data.map((entry, index) => {
            this.excelData[index].is_active = entry.is_active;
            if (!entry.is_active) {
              this.excelData[index].is_done = false;
            }
          });
          setTimeout(() => {
            this.updateCounts();
          }, 10);
        },
      },
    });
  }

  openEditModal(action: any) {
    let selectionData: any;
    const params = {
      type: action.name,
    };
    if (action.name === keywordConstants.Question) {
      selectionData = this.countsObject.questions.data;
    } else if (action.name === keywordConstants.Category) {
      selectionData = this.countsObject.sections.data;
    } else if (action.name === 'SubSection') {
      selectionData = this.countsObject.subSections.data;
    }
    if (!selectionData.length) return;
    this.customModalFactory.invoke('edit-excel-selection', {
      initialState: {
        selection: JSON.parse(JSON.stringify(selectionData)),
        params: params,
        success: (response: any) => {
          response.map((entry) => {
            if (!entry.is_selected) {
              const tag = document.getElementById(entry.tag.id);
              this.deselect_cell(tag, action.name);
            }
          });
          this.updateCounts();
        },
      },
    });
  }

  onItemClick({ key, label }) {
    const splittedArray = key.split(/\s*\-\s*/g);
    const type_of_text = splittedArray[0];
    const self = this;
    if (key.indexOf('key1') > -1) {
      if (type_of_text === 'Unmark') {
        self.unMarkItems('this');
      } else {
        self.cellSpecificOptionClick(type_of_text);
      }
    } else {
      if (type_of_text === 'Unmark') {
        self.unMarkItems('all');
      } else {
        self.optionClick(type_of_text);
      }
    }
  }

  closeContextMenu() {
    this.contextMenu.closeMenu();
  }
}
