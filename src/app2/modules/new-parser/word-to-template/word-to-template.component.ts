import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  AfterViewInit,
  ViewChild,
} from '@angular/core';
import { SweetAlertService } from '../../../services/sweet-alert.service';
import {
  ParserElementType,
  ParserSelectionType,
} from './helpers/parser.constant';
import { WordParser } from 'src/vendor/parser/word_parser';
import { TemplatesDataService } from 'src/app2/services/template-data.service';
import { RouterService } from 'src/app2/services/router.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { ParserApiService } from 'src/app2/apis/word-to-template/parser.service';
import { EntityType } from 'src/app2/shared/constants/constant';
import { DvContextMenuComponent } from 'src/app2/shared/components/dv-context-menu/dv-context-menu.component';
import {
  FAILURE_SIMILAR_DOC_SVG,
  PREVIEW_SVG,
  SEARCH_FROM_SIMILAR_DOC_SVG,
  SUCCESS_SIMILAR_DOC_SVG,
} from './word-to-template.contants';

@Component({
  selector: 'app-word-to-template',
  templateUrl: './word-to-template.component.html',
  styleUrls: ['./word-to-template.component.css'],
})
export class WordToTemplateComponent implements OnInit, AfterViewInit {
  wordFileHtml: any;
  word_div: string;
  wp: any;
  td_tags: {};
  tr_tags: any;
  loading: boolean;
  unmarkedTables: any;
  titleWarningShown: boolean;
  unmarkedTextIds: any;
  unmarkedTableIds: any;
  fixedTableWidth: number;
  answer_columns: {};
  answerColumnWarningShown: boolean;
  countsObject: {
    Section: { count: number; data: {} };
    SubSection: { count: number; data: {} };
    Instruction: { count: number; data: {} };
    Question: { count: number; data: {} };
    Answer: { count: number; data: {} };
  };
  childElements: any;
  parent_tags_list: any;
  stylesContainer: {};
  wordDataObj: any;
  styleParams: {};
  selectionSteps: any;
  document_id: any;
  $stateParams: any;
  templateParams: any;
  diligenceParams: any;
  originalWordFile: any;
  selectedElements: Set<string> = new Set();
  parser_source: any;
  currentTarget: any;
  helperText: any;
  helperTextSecondary: any;
  showSeeUnmarkedNavButtons: boolean = false;
  unmarkedItemsAtPreview: Array<Element> = [];
  currUnmarkedItemIdx: number = 0;
  unmarkableCells: Array<Element> = [];
  showErrorCells: boolean = false;
  isCheckingForSimilarDocument: boolean = false;
  contextMenuConfig: any = {
    selector: '#elementWP td[empty_td="true"], #elementWP [elem_text]',
    items: [
      {
        key: 'Validation',
        label: 'Please select a valid text',
        disabled: () => true,
        visible: (key: { currentTarget: any; target: any }, opt: any) => {
          let optionVisible = false;
          this.setCurrentTarget(key.target);
          if (
            key.currentTarget.tagName === 'IMG' ||
            (!this.isUnmarkOptionVisible(key.currentTarget) &&
              !this.isUnmarkGridOptionVisible(key.currentTarget) &&
              !this.isAnswerOptionVisible(key.currentTarget) &&
              this.isEmptyArea(key.currentTarget) &&
              !this.isElementInsideTable(key.currentTarget))
          ) {
            optionVisible = true;
          }
          return optionVisible;
        },
      },
      {
        key: 'Section',
        label: 'Mark as Category',
        submenuItems: [
          {
            key: 'Section-this',
            label: 'This element',
          },
          {
            key: 'Section-selected',
            label: 'These elements',
            visible: (key: { currentTarget: any }, opt: any) => {
              return this.selectedElements.size > 0;
            },
          },
          {
            key: 'Section-all',
            label: 'All similar elements',
          },
          {
            key: 'Section-single',
            label: 'Combine as one',
            visible: (key: { currentTarget: any }, opt: any) => {
              return this.selectedElements.size > 1;
            },
          },
        ],
        visible: (key: { currentTarget: any }, opt: any) => {
          let optionVisible = true;

          if (
            this.isUnmarkGridOptionVisible(key.currentTarget) ||
            this.isEmptyArea(key.currentTarget) ||
            this.wp.isSelectionTextMarkable()
          ) {
            optionVisible = false;
          }
          return optionVisible;
        },
      },
      {
        key: 'SubSection',
        label: 'Mark as SubCategory',
        submenuItems: [
          {
            key: 'SubSection-this',
            label: 'This element',
          },
          {
            key: 'SubSection-selected',
            label: 'These elements',
            visible: (key: { currentTarget: any }, opt: any) => {
              return this.selectedElements.size > 0;
            },
          },
          {
            key: 'SubSection-all',
            label: 'All similar elements',
          },
          {
            key: 'SubSection-single',
            label: 'Combine as one',
            visible: (key: { currentTarget: any }, opt: any) => {
              return this.selectedElements.size > 1;
            },
          },
        ],
        visible: (key: { currentTarget: any }, opt: any) => {
          let optionVisible = true;
          if (
            this.isUnmarkGridOptionVisible(key.currentTarget) ||
            this.isEmptyArea(key.currentTarget) ||
            this.wp.isSelectionTextMarkable()
          ) {
            optionVisible = false;
          }
          return optionVisible;
        },
      },
      {
        key: 'Question',
        label: 'Mark as Question',
        submenuItems: [
          {
            key: 'Question-this',
            label: 'This element',
          },
          {
            key: 'Question-selected',
            label: 'These elements',
            visible: (key: { currentTarget: any }, opt: any) => {
              return this.selectedElements.size > 0;
            },
          },
          {
            key: 'Question-all',
            label: 'All similar elements',
          },
          {
            key: 'Question-single',
            label: 'Combine as one',
            visible: (key: { currentTarget: any }, opt: any) => {
              return this.selectedElements.size > 1;
            },
          },
          {
            key: 'Question-multiple',
            label: 'Create separate',
            visible: (key: { currentTarget: any }, opt: any) => {
              return this.selectedElements.size > 1;
            },
          },
        ],
        visible: (key: { currentTarget: any }, opt: any) => {
          let optionVisible = true;
          if (
            this.isUnmarkGridOptionVisible(key.currentTarget) ||
            this.isEmptyArea(key.currentTarget) ||
            this.wp.isSelectionTextMarkable()
          ) {
            optionVisible = false;
          }
          return optionVisible;
        },
      },
      {
        key: 'static',
        label: 'Mark as Static Grid',
        visible: (key: { currentTarget: any }, opt: any) => {
          let optionVisible = false;
          if (
            this.isElementInsideTable(key.currentTarget) &&
            !this.isQaFlow()
          ) {
            optionVisible = true;
          }
          return optionVisible;
        },
      },
      {
        key: 'dynamic',
        label: 'Mark as Customizable Grid',
        visible: (key: { currentTarget: any }, opt: any) => {
          let optionVisible = false;
          if (
            this.isElementInsideTable(key.currentTarget) &&
            !this.isQaFlow()
          ) {
            optionVisible = true;
          }
          return optionVisible;
        },
      },
      {
        key: 'title',
        label: 'Mark as Grid Header',
        visible: (key: { currentTarget: any }, opt: any) => {
          let optionVisible = true;
          if (
            this.isUnmarkGridOptionVisible(key.currentTarget) ||
            this.isEmptyArea(key.currentTarget) ||
            this.isQaFlow() ||
            this.wp.isSelectionTextMarkable()
          ) {
            optionVisible = false;
          }
          return optionVisible;
        },
      },
      {
        key: 'Answer',
        label: 'Mark as Response',
        submenuItems: [
          {
            key: 'Answer-this',
            label: 'This element',
          },
          {
            key: 'Answer-selected',
            label: 'These elements',
            visible: (key: { currentTarget: any }, opt: any) => {
              return this.selectedElements.size > 0;
            },
          },
          {
            key: 'Answer-all',
            label: 'All similar elements',
          },
        ],
        visible: (key: { currentTarget: any }, opt: any) => {
          let optionVisible = false;
          if (this.isAnswerOptionVisible(key.currentTarget)) {
            optionVisible = true;
          }
          return optionVisible;
        },
      },
      {
        key: 'QAAnswerText',
        label: 'Mark as Response',
        submenuItems: [
          {
            key: 'QAAnswer-this',
            label: 'This element',
          },
          {
            key: 'QAAnswer-selected',
            label: 'These elements',
            visible: (key: { currentTarget: any }, opt: any) => {
              return this.selectedElements.size > 0;
            },
          },
          {
            key: 'QAAnswer-all',
            label: 'All similar elements',
          },
        ],
        visible: (key: { currentTarget: any }, opt: any) => {
          let optionVisible = true;
          if (
            this.isUnmarkGridOptionVisible(key.currentTarget) ||
            this.isEmptyArea(key.currentTarget) ||
            this.wp.isSelectionTextMarkable() ||
            this.isAnswerOptionVisible(key.currentTarget) ||
            this.isElementInsideTable(key.currentTarget) ||
            !(this.isCreateProjectFlow || this.isQaFlow())
          ) {
            optionVisible = false;
          }
          return optionVisible;
        },
      },
      {
        key: 'Instruction',
        label: 'Mark as Instruction',
        submenuItems: [
          {
            key: 'Instruction-this',
            label: 'This element',
          },
          {
            key: 'Instruction-selected',
            label: 'These elements',
            visible: (key: { currentTarget: any }, opt: any) => {
              return this.selectedElements.size > 0;
            },
          },
          {
            key: 'Instruction-all',
            label: 'All similar elements',
          },
        ],
        visible: (key: { currentTarget: any }, opt: any) => {
          let optionVisible = true;
          if (
            this.isUnmarkGridOptionVisible(key.currentTarget) ||
            this.isEmptyArea(key.currentTarget) ||
            this.wp.isSelectionTextMarkable()
          ) {
            optionVisible = false;
          }
          return optionVisible;
        },
      },
      {
        key: 'AssociateInstructions',
        label: 'Associate Instructions',
        visible: (key: { currentTarget: any }, opt: any) => {
          let optionVisible = false;
          if (
            this.selectedElements.size > 1 &&
            !this.isEmptyArea(key.currentTarget) &&
            this.wp.checkForInstructionAssociativity(this.selectedElements)
          ) {
            optionVisible = true;
          }
          return optionVisible;
        },
      },
      {
        key: 'Unmark',
        label: 'Unmark',
        submenuItems: [
          {
            key: 'Unmark-this',
            label: 'This element',
          },
          {
            key: 'Unmark-selected',
            label: 'These elements',
            visible: (key: { currentTarget: any }, opt: any) => {
              return this.selectedElements.size > 0;
            },
          },
          {
            key: 'Unmark-all',
            label: 'All similar elements',
          },
        ],
        visible: (key: { currentTarget: any; target: any }, opt: any) => {
          let optionVisible = false;
          if (
            this.isUnmarkOptionVisible(key.currentTarget, this.currentTarget) &&
            !this.isUnmarkGridOptionVisible(key.currentTarget) &&
            !this.wp.isSelectionTextMarkable()
          ) {
            optionVisible = true;
          }
          return optionVisible;
        },
      },
      {
        key: 'UnmarkGrid',
        label: 'Unmark Grid',
        visible: (key: { currentTarget: any }, opt: any) => {
          let optionVisible = false;
          if (
            this.isUnmarkGridOptionVisible(key.currentTarget) &&
            (this.isElementInsideTable(key.currentTarget) ||
              key.currentTarget.tagName === 'TABLE') &&
            !this.isQaFlow()
          ) {
            optionVisible = true;
          }
          return optionVisible;
        },
      },
      {
        key: 'UnmarkAnswerTable',
        label: 'Unmark',
        // Added this submenuItems object just to make it consistent with unmark menu item
        submenuItems: [
          {
            key: 'UnmarkAnswerTable',
            label: 'This element',
          },
        ],
        visible: (key: { currentTarget: any }) => {
          return (
            this.isQaFlow() &&
            this.isElementInsideAnswerTable(key.currentTarget)
          );
        },
      },
      {
        key: 'HighlightedTextOptions',
        label: 'Mark highlighted text as',
        submenuItems: [
          {
            key: 'Section-highlighted',
            label: 'Category',
          },
          {
            key: 'SubSection-highlighted',
            label: 'SubCategory',
          },
          {
            key: 'Question-highlighted',
            label: 'Question',
          },
          {
            key: 'QAAnswer-highlighted',
            label: 'Response',
            visible: (key: { currentTarget: any }, opt: any) => {
              return this.isQaFlow() || this.isCreateProjectFlow;
            },
          },
          {
            key: 'Instruction-highlighted',
            label: 'Instruction',
          },
        ],
        visible: () => {
          return this.wp.isSelectionTextMarkable();
        },
      },
    ],
  };

  @ViewChild('wordCountBar') countBarElement: ElementRef;
  @ViewChild('contextMenu') contextMenu: DvContextMenuComponent;
  showInstructions: boolean = false;
  tabsList: any = [
    {
      id: 1,
      name: 'Quick Instructions',
      instructions: '',
      active: true,
    },
    {
      id: 2,
      name: 'Advanced Options',
      instructions: '',
      active: false,
    },
  ];
  // After successfully running this once the result will be same
  // unless a new doc is added in other tab/user
  disableCheckForSimilarDocument: boolean = false;
  isCreateProjectFlow: boolean = false;

  constructor(
    private swal: SweetAlertService,
    private templatesDataService: TemplatesDataService,
    private routerService: RouterService,
    private customModalService: CustomModalService,
    private parserService: ParserApiService
  ) {}

  ngOnInit(): void {
    this.wordFileHtml = null;
    this.word_div = 'elementWP';
    this.td_tags = [];
    this.tr_tags = [];
    this.loading = true;
    this.unmarkedTables = [];
    this.titleWarningShown = false;
    this.unmarkedTextIds = [];
    this.unmarkedTableIds = [];
    this.wordFileHtml = null;
    this.fixedTableWidth = 1250;
    this.answer_columns = {};
    this.answerColumnWarningShown = false;
    this.countsObject = {
      Section: { count: 0, data: [] },
      SubSection: { count: 0, data: [] },
      Instruction: { count: 0, data: [] },
      Question: { count: 0, data: [] },
      Answer: { count: 0, data: [] },
    };
    window.localStorage.setItem(
      'all_counts',
      JSON.stringify(this.countsObject)
    );
    this.childElements = [
      'IMG',
      'SPAN',
      'A',
      'SMALL',
      'PRE',
      'STRONG',
      'SUB',
      'INPUT',
      'SELECT',
    ];
    this.parent_tags_list = ['P', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'];
    this.stylesContainer = {};
    this.wordDataObj = {};
    this.styleParams = {};
    this.selectionSteps = [
      {
        name: 'Section',
        alias: 'Category',
        is_active: false,
        count: 0,
        is_visible: true,
      },
      {
        name: 'SubSection',
        alias: 'SubCategory',
        is_active: false,
        count: 0,
        is_visible: true,
      },
      {
        name: 'Question',
        alias: 'Question',
        is_active: false,
        count: 0,
        is_visible: true,
      },
      {
        name: 'Answer',
        alias: 'Response',
        is_active: false,
        count: 0,
        is_visible: true,
      },
      {
        name: 'Instruction',
        alias: 'Instruction',
        is_active: false,
        count: 0,
        is_visible: true,
      },
    ];
    this.wordDataObj = this.templatesDataService.getWordParserData();
    this.templateParams = this.templatesDataService.getTemplateParams();
    this.diligenceParams = this.templatesDataService.getDiligenceParams();
    this.$stateParams = this.routerService.getState();
    this.parser_source = this.$stateParams.params.type;
    this.isCreateProjectFlow =
      this.templateParams.source === 'InformationRequestFlow';
    this.document_id = this.$stateParams.params.doc_id;
    if (this.isQaFlow()) {
      this.helperText = `<style> ol.parser-instructions li::marker { font-weight: bold; }</style><ol class='parser-instructions'> <li> <strong>Right click on the lines</strong> of text to mark elements as categories, sub-categories, questions, responses, tables, and instructions. </li> <li> Mark all similarly formatted elements throughout the file with <strong>'All similar elements'</strong>. </li> <li> Once you have marked categories and questions, you can use the <strong>'Auto Identify Responses'</strong> button to quickly mark the text between questions as responses. <div> <strong>Note:</strong> Auto identifying responses does not support grids. Please mark them manually by marking one column of questions and one column of responses. </div> </li> <li> You can edit the content of responses once you navigate to the preview. </li> <li> Elements marked as instructions will be associated with the sub-category or question immediately above them, unless associated separately (see advanced options). <div> <strong>Note:</strong> If there is a category directly above the instructions then all associated sub-categories will receive the same instructions, unless associated separately. </div> </li> <li> Use the 'Reset File' button to clear all marked items in the current file. </li> <li> Hold down the CTRL button on your keyboard to enable advanced manual marking. Click on the <strong>'Advanced Options'</strong> tab to see detailed instructions.</li></ol>`;
      this.helperTextSecondary = `<style> ol.parser-instructions li::marker { font-weight: bold; }</style><ol class="parser-instructions"> <li> <strong>Mark multiple lines as an element type in one-go</strong> <div> Hold CTRL + left click multiple lines then right click on any of the selected lines and under the appropriate element type select <b>'These elements'</b>. </div> </li> <li> <strong>Unmark multiple elements in one-go</strong> <div> Hold CTRL + left click multiple lines then right click on any of the selected lines and select <b>'Unmark &gt; These elements'</b>. </div> </li> <li> <strong>Combine as one element.</strong> If an individual element spans several lines in your file, you can combine the lines to be included as one marked element. <div> Hold CTRL + left click multiple lines then right click and select <b>'Combine as one'</b>. <div style="margin-left: 1rem"> <strong>Note:</strong> Supported elements include categories, sub-categories, and questions. </div> </div> </li> <li> <strong >Mark multipart questions by creating separate sub-questions.</strong > Import a parent question and its sub-questions each as their own questions. This keeps context for each sub-question and enables consistency when exporting to the original file. <div> Hold CTRL + left click the parent question then click each sub question. Then right click any of the selected lines and select<strong> 'Mark as Question &gt; Create separate'.</strong > <div style="margin-left: 1rem"> <strong>Note:</strong> By default, the first line among the marked lines will be considered as the parent question. </li> </div> </div> <li> <strong>Highlight specific parts of text to mark as an element.</strong> Precisely marking parts of text as an element is helpful when you need to include specific text and exclude the rest. <div> With your cursor, highlight a part of text using left click &amp; drag. Then right click on the highlighted part and <strong>'Mark highlighted text as'</strong>. <ol style="list-style-type: lower-alpha;"> <li> <strong>Note:</strong> Supported elements include categories, sub-categories, questions, responses, and instructions. </li> <li> If a line is already marked as an element please unmark it before highlight marking. </li> <li> Highlight marking works for text only. Images and tables are not supported. </li> </ol> </div> </li> <li> <strong >Associating instructions to elements which are not directly above the marked instructions</strong > <div> Hold CTRL + click on the instructions and then click on the appropriate element. Following that, right-click and select <b>'Associate Instructions'</b>. </div> </li></ol>`;
    } else {
      this.helperText = `<style> ol.parser-instructions li::marker { font-weight: bold; }</style><ol class='parser-instructions'> <li> <strong>Right click on the lines</strong> of text to mark elements as categories, sub-categories, questions, tables, and instructions. </li> <li> Mark all similarly formatted elements throughout the file with <strong>'All similar elements'</strong>. </li> <li> Elements marked as instructions will be associated with the sub-category or question immediately above them, unless associated separately (see advanced options). <div> <strong>Note: </strong>If there is a category directly above the instructions then all associated sub-categories will receive the same instructions, unless associated separately. </div> </li> <li> Use the 'Reset File' button to clear all marked items in the current file. </li> <li> Hold down the CTRL button on your keyboard to enable advanced manual marking. Click on <strong>'View advanced marking options'</strong> below to see detailed instructions. </li></ol>`;
      this.helperTextSecondary = `<style> ol.parser-instructions li::marker { font-weight: bold; }</style><ol class='parser-instructions'> <li> <strong>Mark multiple lines as an element type in one-go</strong> <div> Hold CTRL + left click multiple lines then right click on any of the selected lines and under the appropriate element type select <b>'These elements'</b>. </div> </li> <li> <strong>Unmark multiple elements in one-go</strong> <div> Hold CTRL + left click multiple lines then right click on any of the selected lines and select <b>'Unmark &gt; These elements'</b>. </div> </li> <li> <strong>Combine as one element.</strong> If an individual element spans several lines in your file, you can combine the lines to be included as one marked element. <div> Hold CTRL + left click multiple lines then right click and select <b>'Combine as one'</b>. <div style="margin - left: 1rem"> <strong>Note:</strong> Supported elements include categories, sub-categories, and questions. </div> </div> </li> <li> <strong >Mark multipart questions by creating separate sub-questions.</strong > Import a parent question and its sub-questions each as their own questions. This keeps context for each sub-question and enables consistency when exporting to the original file. <div> Hold CTRL + left click the parent question then click each sub question. Then right click any of the selected lines and select<strong> 'Mark as Question &gt; Create separate'.</strong > <div style="margin - left: 1rem"> <strong>Note:</strong> By default, the first line among the marked lines will be considered as the parent question. </li> </div> </div> <li> <strong>Highlight specific parts of text to mark as an element.</strong> Precisely marking parts of text as an element is helpful when you need to include specific text and exclude the rest. <div> With your cursor, highlight a part of text using left click &amp; drag. Then right click on the highlighted part and <strong>'Mark highlighted text as'</strong>. <ol style='list-style-type: lower-alpha;'> <li> <strong>Note:</strong> Supported elements include categories, sub-categories, questions and instructions. </li> <li> If a line is already marked as an element please unmark it before highlight marking. </li> <li> Highlight marking works for text only. Images and tables are not supported. </li> </ol> </div> </li> <li> <strong >Associating instructions to elements which are not directly above the marked instructions</strong > <div> Hold CTRL + click on the instructions and then click on the appropriate element. Following that, right-click and select <b>'Associate Instructions'</b>. </div> </li></ol>`;
    }

    this.tabsList = this.tabsList.map((tab) => {
      if (tab.id == 1) {
        tab.instructions = this.helperText;
      } else {
        tab.instructions = this.helperTextSecondary;
      }
      return tab;
    });

    this.originalWordFile = this.templatesDataService.getOriginalWordFile();
    if (!(this.originalWordFile && this.originalWordFile.length > 0)) {
      this.swal.error({ title: 'Please try again' });
      window.history.back();
      return;
    }

    if (this.wordDataObj.html_content) {
      this.wordFileHtml = this.wordDataObj.html_content;
      setTimeout(() => {
        this.wp = new WordParser(this.word_div);
        this.setStyleParams();
        this.removeAllHref();
      });
    } else {
      window.history.back(); //goback to last page from where the user came on manual refresh/reload
    }
  }

  ngAfterViewInit() {
    this.wp = new WordParser(this.word_div);
    this.setStyleParams();
    this.removeAllHref();
  }

  @HostListener('window:scroll', [])
  makeCountBarSticky() {
    if (window.scrollY > 300) {
      this.countBarElement.nativeElement.classList.add('sticky-count-bar');
    } else {
      this.countBarElement.nativeElement.classList.remove('sticky-count-bar');
    }
  }

  //Method is called from the template html
  //This method gives you the width of the container that holds the word document
  getTableWidth() {
    this.fixedTableWidth = 1260;
    let elemWP = document.getElementById('elementWP');
    const panelWidth = elemWP.offsetWidth;
    if (panelWidth > this.fixedTableWidth) {
      this.fixedTableWidth = panelWidth;
    }
    this.fixedTableWidth;
  }

  //The method is called on clicking the Preview button
  //The method checks if you have marked questions but no answers within a table
  //if there are no answers marked but only questions then scroll down and highlight the part where answers are required
  get_table_without_answer_col() {
    const unmarkedAnswerTables = this.wp.checkAnswerCellMapping();
    let found = false;
    if (unmarkedAnswerTables.length > 0) {
      this.scrollToSpecificItem(unmarkedAnswerTables[0]);
      found = true;
    }
    return found;
  }
  //The method is called on clicking the Preview button
  //Returns a count of the total number of unmarked tables
  get_unmarked_table() {
    let total_unmarked_tables = 0;
    this.unmarkedTableIds = [];
    this.unmarkedTables = document
      .getElementById(this.word_div)
      .querySelectorAll('table:not([elem_type])');
    for (let index = 0; index < this.unmarkedTables.length; index++) {
      const table = this.unmarkedTables[index];
      if (!this.wp.tableHasMergedCells(table)) {
        this.unmarkedTableIds.push(table.id);
      }
    }
    total_unmarked_tables = this.unmarkedTableIds.length;
    return total_unmarked_tables;
  }

  //The method just removes all href from the word document so that user doesnt click on anything that
  //redirects him to outside of dv
  removeAllHref(): any {
    let elem: any = document.getElementById('elementWP');
    if (elem) {
      let anchor_with_href: any = elem.querySelectorAll('a');
      return Array.from(anchor_with_href).map((anchorTag: any) =>
        anchorTag.removeAttribute('href')
      );
    }
  }

  setStyleParams() {
    //Certain attributes like elem_style/elem_text/has_td/table_no/text_no/empty_td/multiple_rows/merge_cells_present etc are set here
    this.wp.setStyleAttribute();
    this.loading = false;

    setTimeout(() => {
      this.unmarkableCells = this.wp.checkUnmarkableCells();
      if (this.unmarkableCells.length > 0) {
        this.swal
          .confirm({
            title:
              'The formatting of some cells in this document can cause issues when exporting to the original document. Click "View" to locate these errors then edit these cells in the Word file and re-upload for better compatibility.',
            confirmButtonText: 'View',
            showCloseButton: false,
          })
          .then((isConfirm: { value: boolean; dismiss: string }) => {
            if (isConfirm.value && isConfirm.value === true) {
              this.wp.highlightUnmarkableCells(this.unmarkableCells);
              this.scrollToErrorElement();
            } else {
              this.swal.close();
            }
            this.checkForSimilarDocumentPopup();
          });
      } else {
        this.checkForSimilarDocumentPopup();
      }
    });
    this.loading = false;
  }

  checkForSimilarDocumentPopup() {
    this.swal
      .freeInput({
        html: `<div>
                <div>
                  ${SEARCH_FROM_SIMILAR_DOC_SVG}
                </div>
                <h3 style="font-size: 18px; color: #474954; line-height: 22px; font-weight: 600;">Would you like us to search for a similar document to apply its markings to this one?</h3>
                <p style="font-size: 16px; color: #474954; line-height: 22px; font-weight: 500;"><b>Note:</b> All manual markings will be overridden if a similar document is found.</p>
              <div>`,
        showCloseButton: false,
        showCancelButton: true,
        confirmButtonText: 'Yes',
        cancelButtonText: 'No',
        width: '550px',
        allowOutsideClick: false,
        customClass: {
          cancelButton: 'parser-swal-popup-cancel-btn',
          confirmButton: 'parser-swal-popup-confirm-btn',
        },
        reverseButtons: true,
      })
      .then((isConfirm: { value: boolean; dismiss: string }) => {
        if (isConfirm.value && isConfirm.value === true) {
          this.checkForSimilarDocument();
        } else {
          this.swal.close();
        }
      });
  }

  check_element(element: { parentElement: any }) {
    const parents = [];
    const children = [];
    let pelem = element.parentElement;
    while (pelem) {
      parents.push(pelem.tagName);
      pelem = pelem.parentElement;
    }
    if (parents.includes('TABLE')) {
      return false;
    }
    return true;
  }

  markGridTitle() {
    const target = this.currentTarget;
    if (this.isElementInsideTable(target)) {
      this.wp.markOrUnmarkTableTags(
        target,
        ParserSelectionType.SELECT,
        ParserElementType.GRID_TITLE
      );
    } else {
      this.wp.markOrUnmarkTextTags(
        target,
        ParserSelectionType.SELECT,
        ParserElementType.GRID_TITLE
      );
    }
  }

  //This method will return true if you mark a table grid as static/dynamic
  isUnmarkGridOptionVisible(element: any) {
    let elem_type: any,
      selected_elm: { getAttribute: (arg0: string) => any; tagName: string };
    let is_visible = false;
    if (element.closest('table')) {
      selected_elm = element.closest('table');
      elem_type = selected_elm.getAttribute('elem_type');
      if (elem_type && elem_type !== ParserElementType.CUSTOM_TABLE) {
        is_visible = true;
      }
    } else {
      selected_elm = element;
      elem_type = selected_elm.getAttribute('elem_type');
      if (
        elem_type &&
        elem_type !== ParserElementType.CUSTOM_TABLE &&
        selected_elm.tagName === 'TABLE'
      ) {
        is_visible = true;
      }
    }
    return is_visible;
  }

  //This method returns a value that indicates whether you have clicked on an empty area within the document
  //Clicking on empty area should not do anything/show you any options
  isEmptyArea(element: any) {
    let is_empty_area = true;
    const selected_elm = element;
    if (selected_elm.innerText && selected_elm.innerText.length) {
      is_empty_area = false;
    }
    return is_empty_area;
  }

  isUnmarkOptionVisible(target: any, clickedElement: any = null) {
    let is_visible = false;
    const element = this.evaluateTarget(target);

    if (
      element.hasAttribute('elem_type') ||
      (clickedElement?.tagName == 'PARSER' &&
        clickedElement?.className.length > 0)
    ) {
      is_visible = true;
    } else if (element.closest('td')) {
      if (element.closest('td').getAttribute('elem_type')) {
        is_visible = true;
      }
    }
    return is_visible;
  }

  isAnswerOptionVisible(element: any) {
    let is_visible = false;
    const selected_elm = element;

    if (
      (selected_elm.attributes.has_td || selected_elm.tagName === 'TD') &&
      this.tableHasQuestionColumn(element, 'el') &&
      !this.isUnmarkOptionVisible(element)
    ) {
      is_visible = true;
    }
    return is_visible;
  }

  isQaFlow(): boolean {
    return this.parser_source && this.parser_source === 'QA';
  }

  resetFile() {
    return this.swal
      .confirm({
        title: 'Are you sure you want to reset this file?',
        text: 'This will clear all marked items in current file',
        confirmButtonText: 'Proceed',
        focusCancel: true,
      })
      .then((isConfirm: { value: boolean; dismiss: string }) => {
        if (isConfirm.value && isConfirm.value === true) {
          this.wp.resetFile();
          this.unhighlightElements(this.selectedElements);
          setTimeout(() => {
            this.updateCounts();
            this.updateUnmarkedItems();
            return;
          });
        } else if (isConfirm.dismiss && isConfirm.dismiss === 'cancel') {
          this.swal.close();
        }
      });
  }

  markAsGridType(type: string) {
    let target = this.currentTarget;

    const table = this.wp.getTagParent(target, 'TABLE');
    if (
      table.hasAttribute('merge_cells_present') &&
      type == ParserElementType.DYNAMIC_GRID
    ) {
      return this.swal.error({
        title: 'This table has merged cells. Please unmerge those to continue',
      });
    } else if (
      type === ParserElementType.GRID &&
      !(
        table.hasAttribute('multiple_rows') &&
        table.hasAttribute('multiple_cols')
      )
    ) {
      return this.swal.error({
        title:
          'The table should have more than 1 row and 1 column to mark it as Static Grid',
      });
    } else {
      this.wp.markOrUnmarkGrids(target, ParserSelectionType.SELECT, type);
      // $(table).attr 'elem_type', type
      const className = table.getAttribute('id');
      Array.from(document.getElementsByClassName('.' + className)).forEach(
        (element) => {
          element.remove();
        }
      );
      // $(table).removeAttr "id"
      const table_type = type === 'Dynamic' ? 'Customizable' : 'Static';
      if (!this.titleWarningShown) {
        this.swal.success({
          title: `You've marked a ${table_type} table, mark the text above the table as 'Table header' to import as a single question.`,
        });
        this.titleWarningShown = true;
      }
      setTimeout(() => {
        if (target.tagName == 'TABLE') target = target.querySelector('td');
        return this.wp.markOrUnmarkTableTags(
          target,
          ParserSelectionType.DESELECT_ALL,
          null,
          true,
          false
        );
      });
    }
    setTimeout(() => {
      this.updateCounts();
    });
  }

  unMarkGrid() {
    const element = this.currentTarget;
    this.wp.markOrUnmarkGrids(element, ParserSelectionType.DESELECT, null);
    this.updateCounts();
  }

  openChangeFileModal() {
    const templateParams = this.templatesDataService.getTemplateParams();
    this.customModalService.invoke('manage-word-file', {
      initialState: {
        params: templateParams,
        source: this.parser_source,
        success: (file: any) => {
          this.wordFileHtml = null;
          this.wordDataObj = null;
          return this.ngOnInit();
        },
      },
    });
  }

  changeWordFile() {
    if (this.getMarkedItems().length) {
      return this.swal
        .confirm({
          title: 'Action Required!',
          text: 'There are marked items in this document. If you continue, all markings will be lost.',
          confirmButtonText: 'Continue',
          cancelButtonText: 'Cancel',
          focusCancel: true,
        })
        .then((isConfirm: { value: boolean }) => {
          if (isConfirm.value && isConfirm.value === true) {
            return this.openChangeFileModal();
          }
        });
    } else {
      return this.openChangeFileModal();
    }
  }

  tableHasAnswerColumn(table: { getElementsByTagName: (arg0: string) => any }) {
    let hasAnswerColumn = false;
    const table_rows = table.getElementsByTagName('tr');
    table_rows.map(function (table_row) {
      const table_cols = table_row.getElementsByTagName('td');
      table_cols.map(function (table_col) {
        const type = table_col.getAttribute('elem_type');
        if (type && type === 'Answer') {
          hasAnswerColumn = true;
          return;
        }
      });
    });
    return hasAnswerColumn;
  }

  tableHasQuestionColumn(element: any, inputType: string) {
    let table: { getAttribute: (arg0: string) => any };
    if (inputType === 'table') {
      table = element;
    } else {
      table = element.closest('table');
      //table = element.closest('table')[0];
    }
    let hasQuestionColumn = false;
    const table_type = table.getAttribute('elem_type');
    if (table_type === ParserElementType.CUSTOM_TABLE) {
      hasQuestionColumn = true;
    }

    return hasQuestionColumn;
  }

  evaluateTarget(target: any) {
    let element = null;
    if (target.attributes.elem_type) {
      element = target;
    }
    if (this.childElements.indexOf(target.tagName) > -1) {
      this.parent_tags_list.map(function (parentEl) {
        if (target.closest(parentEl)) {
          element = target.closest(parentEl);
          return;
        }
      });
    } else {
      element = target;
    }
    return element;
  }

  isElementInsideTable(element: any) {
    let inside_table = false;
    if (element.tagName === 'TD' || element.hasAttribute('has_td')) {
      inside_table = true;
    }
    return inside_table;
  }

  isElementInsideAnswerTable(element: HTMLElement) {
    if (this.isElementInsideTable(element)) {
      if (element.closest('table')) {
        const nearestTable = element.closest('table');
        return (
          nearestTable.getAttribute('elem_type') == ParserElementType.QA_ANSWER
        );
      }
    }
  }

  unmarkAnswerTable() {
    const element = this.currentTarget;

    if (this.isElementInsideTable(element)) {
      if (element.closest('table')) {
        const nearestTable = element.closest('table');
        if (
          nearestTable.getAttribute('elem_type') == ParserElementType.QA_ANSWER
        ) {
          this.wp.setTypeAttribute(
            [nearestTable],
            null,
            ParserSelectionType.DESELECT
          );

          setTimeout(() => {
            this.updateCounts();
          });
        }
      }
    }
  }

  unMarkItems(action: any) {
    let target: any;
    if (action == ParserSelectionType.DESELECT_SIMILAR) {
      target = this.contextMenu.event.target;
      this.wp.markOrUnmarkTextTags(this.currentTarget, action, null);
    } else {
      target = this.currentTarget;
    }

    if (this.isElementInsideTable(target)) {
      this.wp.markOrUnmarkTableTags(target, action, null);
    } else {
      this.wp.markOrUnmarkTextTags(target, action, null);
    }
    setTimeout(() => {
      this.updateCounts();
    });
  }

  unMarkSelectedItems(action: any) {
    if (this.selectedElements.size > 0) {
      const result = this.wp.markOrUnmarkSelectedIds(
        this.selectedElements,
        action,
        null
      );
      if (result) this.selectedElements.clear();
    }

    setTimeout(() => {
      this.updateCounts();
    });
  }

  getMarkedItems() {
    let marked_items: any = [];
    marked_items = document
      .getElementById(this.word_div)
      .querySelectorAll('[elem_type]');
    return marked_items;
  }

  getStepCount(step: { name: string | number }) {
    let count = 0;
    const all_counts = window.localStorage.getItem('all_counts');
    if (all_counts) {
      this.countsObject = JSON.parse(all_counts);
      if (this.countsObject[step.name]) {
        ({ count } = this.countsObject[step.name]);
      }
    }
    return count;
  }

  updateCounts() {
    this.countsObject = {
      Section: { count: 0, data: [] },
      SubSection: { count: 0, data: [] },
      Instruction: { count: 0, data: [] },
      Question: { count: 0, data: [] },
      Answer: { count: 0, data: [] },
    };
    this.selectionSteps = [
      {
        name: 'Section',
        alias: 'Category',
        is_active: false,
        count: 0,
        is_visible: true,
      },
      {
        name: 'SubSection',
        alias: 'SubCategory',
        is_active: false,
        count: 0,
        is_visible: true,
      },
      {
        name: 'Question',
        alias: 'Question',
        is_active: false,
        count: 0,
        is_visible: true,
      },
      {
        name: 'Answer',
        alias: 'Response',
        is_active: false,
        count: 0,
        is_visible: true,
      },
      {
        name: 'Instruction',
        alias: 'Instruction',
        is_active: false,
        count: 0,
        is_visible: true,
      },
    ];
    const marking_count = this.wp.getMarkingsCount();
    this.countsObject.Section.count = marking_count[ParserElementType.SECTION];
    this.countsObject.SubSection.count =
      marking_count[ParserElementType.SUB_SECTION];
    this.countsObject.Instruction.count =
      marking_count[ParserElementType.INSTRUCTION];
    this.countsObject.Question.count =
      marking_count[ParserElementType.QUESTION];
    this.countsObject.Answer.count = marking_count[ParserElementType.ANSWER];
    const self = this;
    this.selectionSteps.map(function (step) {
      if (self.countsObject[step.name]) {
        step.count = self.countsObject[step.name].count;
      }
    });
    return window.localStorage.setItem(
      'all_counts',
      JSON.stringify(this.countsObject)
    );
  }

  setTableAsMarked(table: any) {
    if (
      this.tableHasQuestionColumn(table, 'table') &&
      this.tableHasAnswerColumn(table)
    ) {
      table.attr('elem_type', 'CustomTable');
      const className = table.attr('id');
      let name = document.getElementsByClassName('.' + className);
      document.querySelector('.' + className).remove();
      document.querySelector(table).removeAttr('id');
    }
  }

  cellSpecificOptionClick(type_of_text: string) {
    const target: any = this.currentTarget;
    const text = target.textContent.trim();
    if (this.isElementInsideTable(target)) {
      this.wp.markOrUnmarkTableTags(
        target,
        ParserSelectionType.SELECT,
        type_of_text
      );
      if (!this.answerColumnWarningShown && type_of_text === 'Question') {
        this.swal.success({
          title:
            "You've marked questions in a table.Please remember to mark a response column before proceeding.",
        });
        this.answerColumnWarningShown = true;
      }
    } else {
      this.wp.markOrUnmarkTextTags(
        target,
        ParserSelectionType.SELECT,
        type_of_text
      );
    }
    setTimeout(() => {
      return this.updateCounts();
    });
  }

  markSelectedItems(type_of_text: string) {
    if (this.selectedElements.size == 0) return;

    const [result, containsTableElements] = this.wp.markOrUnmarkSelectedIds(
      this.selectedElements,
      ParserSelectionType.SELECT,
      type_of_text
    );
    if (result) this.selectedElements.clear();

    if (
      !this.answerColumnWarningShown &&
      type_of_text === ParserElementType.QUESTION &&
      containsTableElements
    ) {
      this.swal.success({
        title:
          "You've marked questions in a table.Please remember to mark a response column before proceeding.",
      });
      this.answerColumnWarningShown = true;
    }

    setTimeout(() => {
      return this.updateCounts();
    });
  }

  optionClick(e: any) {
    const target: any = this.contextMenu.event.target;
    const type_of_text = e;
    if (this.isElementInsideTable(target)) {
      this.wp.markOrUnmarkTableTags(
        target,
        ParserSelectionType.SELECT_SIMILAR,
        type_of_text
      );
      if (!this.answerColumnWarningShown && type_of_text === 'Question') {
        this.swal.success({
          title:
            "You've marked questions in a table. Please remember to mark a response column before proceeding.",
        });
        this.answerColumnWarningShown = true;
      }
    } else {
      this.wp.markOrUnmarkTextTags(
        target,
        ParserSelectionType.SELECT_SIMILAR,
        type_of_text
      );
    }
    setTimeout(() => {
      return this.updateCounts();
    });
  }

  scrollToPrevUnmarkedItem(itemId: string) {
    // remove previous markings
    const prevMakring = document.querySelector('.unmarked-highlight');
    prevMakring?.classList?.remove('unmarked-highlight');
    let itemElement: any = document.getElementById(itemId);
    itemElement.classList.add('unmarked-highlight');
    this.scrollToSpecificItem(itemId);
  }

  //Scroll to any specific item within the document which is missing, something for example: a table marked with questions
  //is missing the answer and highlight it
  scrollToSpecificItem(itemId: string) {
    if (itemId) {
      let itemElement: any = document.getElementById(itemId);

      setTimeout(() => {
        window.scrollTo({
          top: window.scrollY + itemElement.getBoundingClientRect().y - 200,
          left: 0,
          behavior: 'smooth',
        });
      }, 500);
    }
  }

  get_unmarked_text() {
    let selector = '';
    this.unmarkedTextIds = [];
    let unmarked_count = 0;
    for (let parent_tag of Array.from(this.parent_tags_list)) {
      selector += `${parent_tag}:not([elem_type])` + ',';
    }
    const unmarked_items = document
      .getElementById(this.word_div)
      .querySelectorAll(selector.slice(0, -1));
    const unmarked_text = [];
    for (let index = 0; index < unmarked_items.length; index++) {
      const item: any = unmarked_items[index];
      if (!this.check_element(item)) {
        continue;
      }
      const text = this.wp.getTagText(item);
      if (text) {
        unmarked_text.push(item);
        this.unmarkedTextIds.push(item.id);
      }
    }
    unmarked_count = this.unmarkedTextIds.length;
    return unmarked_count;
  }

  openImportModal() {
    this.unhighlightElements(this.selectedElements);
    if (!this.countsObject.Section.count) {
      this.swal.error({ title: 'Please mark Categories' });
      return;
    }
    if (!this.countsObject.Question.count) {
      this.swal.error({ title: 'Please mark Questions' });
      return;
    }
    if (
      this.isQaFlowAndAnswersNotMarked() &&
      this.getUnmarkedItems(this).length > 0
    ) {
      this.swal
        .confirm({
          title: 'Oops! Please mark at least one response before proceeding.',
          html: `<strong>Tip:</strong> Click 'Auto Identify Responses' to auto-mark all text in-between questions as responses.`,
          confirmButtonText: 'Auto Identify Responses',
          cancelButtonText: 'Okay',
          customClass: 'info',
        })
        .then((isConfirm: { value: boolean }) => {
          if (isConfirm.value && isConfirm.value === true) {
            this.autoMarkAnswers();
            this.updateUnmarkedItems();
            return;
          }
        });
      return;
    }

    if (this.get_table_without_answer_col()) {
      return;
    }
    const unmarkedTablesCount = this.get_unmarked_table();
    const unmarkedTextCount = this.get_unmarked_text();
    if (unmarkedTablesCount > 0 || unmarkedTextCount > 0) {
      this.swal
        .freeInput({
          html: `<div>
                <div>
                  ${PREVIEW_SVG}
                </div>
                <h4><b>We've found ${
                  unmarkedTablesCount + unmarkedTextCount
                } unmarked items</b></h4>
                <div>
                  To review these please 'View Unmarked Items'.
                  If you've marked every item you want to import, please 'Continue to Preview'.
                </div>
              <div>`,
          showCloseButton: false,
          showCancelButton: true,
          confirmButtonText: 'Continue to Preview',
          cancelButtonText: `View Unmarked Items`,
          width: '550px',
          allowOutsideClick: false,
          customClass: {
            closeButton: 'preview-close-btn',
            cancelButton: 'preview-cancel-btn',
          },
          reverseButtons: true,
        })
        .then((isConfirm: { value: boolean }) => {
          if (isConfirm.value && isConfirm.value === true) {
            const testParams2 = this.wp.exportData(
              this.wordDataObj.doc_id, //DocumentID
              this.templateParams.name
            );
            return this.customModalService.invoke('manage-excel-template', {
              initialState: {
                selection: this.countsObject,
                params: testParams2,
                source: this.parser_source,
              },
              class: 'modal-xl',
            });
          } else {
            this.showUnmarkedItems(true);
          }
        });
      return;
    }
    const testParams2 = this.wp.exportData(
      this.document_id,
      this.templateParams.name
    );
    return this.customModalService.invoke('manage-excel-template', {
      initialState: {
        selection: this.countsObject,
        params: testParams2,
        source: this.parser_source,
      },
      class: 'modal-xl',
    });
  }

  autoMarkAnswers() {
    let errorMessage = ``;
    if (!this.countsObject.Section.count) {
      errorMessage = `Please mark Categories`;
    } else if (!this.countsObject.Question.count) {
      errorMessage = `Please mark Questions`;
    }
    if (errorMessage.length) {
      this.swal.error({
        title: errorMessage,
      });
      return;
    }
    this.wp.autoMarkAnswers().then((_) => {
      this.updateCounts();
      this.unhighlightElements(this.selectedElements);
      this.updateUnmarkedItems();
      this.loading = false;
    });
  }

  isQaFlowAndAnswersNotMarked() {
    let unmarkedAnswerTables = document
        .getElementById(this.word_div)
        .querySelectorAll('[elem_type="QAAnswer"]'),
      unmarkedAnswerTablesNormal = document
        .getElementById(this.word_div)
        .querySelectorAll('[elem_type="Answer"]'),
      found = false;
    if (
      unmarkedAnswerTables.length == 0 &&
      unmarkedAnswerTablesNormal.length == 0 &&
      this.isQaFlow()
    ) {
      found = true;
    }
    return found;
  }

  executeUndo() {
    this.unhighlightElements(this.selectedElements);
    this.wp.executeUndo();
    this.updateCounts();
    this.updateUnmarkedItems();
  }

  executeRedo() {
    this.unhighlightElements(this.selectedElements);
    this.wp.executeRedo();
    this.updateCounts();
    this.updateUnmarkedItems();
  }

  selectMultipleItemsWithCtrl(event: MouseEvent) {
    if (event.ctrlKey) {
      const target = event.target as HTMLElement;
      const parentElement = this.wp.getParentForSelection(target);
      if (
        !parentElement ||
        this.isEmptyArea(parentElement) ||
        parentElement?.textContent?.trim().length == 0
      )
        return;
      const parentElementId = parentElement.getAttribute('id');

      if (this.selectedElements.has(parentElementId)) {
        this.wp.unHighlightElement(parentElement);
        this.selectedElements.delete(parentElementId);
      } else {
        this.wp.highlightElement(parentElement);
        this.selectedElements.add(parentElementId);
      }
    } else {
      //  clears the selected elements set if there is a click event without ctrl key
      this.unhighlightElements(this.selectedElements);
    }
  }

  associateInstructions() {
    const res = this.wp.associateInstructions(this.selectedElements);
    if (res) this.selectedElements.clear();
  }

  markSubQuestions() {
    const res = this.wp.markSubQuestions(this.selectedElements);
    if (res) this.selectedElements.clear();
    setTimeout(() => {
      return this.updateCounts();
    });
  }

  associateEntities(type_of_text: string) {
    const res = this.wp.associateEntities(this.selectedElements, type_of_text);
    if (res) {
      this.selectedElements.clear();
      setTimeout(() => {
        return this.updateCounts();
      });
    }
  }

  markHighlightedText(type: string) {
    this.wp.markWindowSelection(type);

    this.updateCounts();
  }

  unhighlightElements(selectedElements: Set<string>) {
    selectedElements.forEach((id: string) => {
      const tag = document.getElementById(id);
      this.wp.unHighlightElement(tag);
    });
    selectedElements.clear();
  }

  mouseOverElement(event: MouseEvent) {
    if (event.ctrlKey) {
      let target = event.target as HTMLElement;
      const parent = this.wp.getParentForSelection(target);
      if (parent && parent.textContent.trim().length == 0) {
        this.wp.highlightCtrlHoverElement(parent);
        let curr = parent;
        while (
          target &&
          target.tagName == 'PARSER' &&
          target.className.length == 0
        ) {
          target = target.parentElement;
        }
        if (target.tagName == 'PARSER' && target.className.length > 0)
          curr = target;
        curr.addEventListener(
          'mouseleave',
          (e: Event) => {
            this.wp.unHighlightCtrlHoverElement(e.currentTarget);
          },
          { once: true }
        );
      }
    }
  }

  setCurrentTarget(target: any) {
    this.currentTarget = target;
    while (
      target &&
      target.tagName == 'PARSER' &&
      target.className.length == 0
    ) {
      target = target.parentElement;
    }
    if (target && target.tagName == 'PARSER' && target.className.length != 0)
      this.currentTarget = target;
  }

  checkForElemMarkings(item) {
    return item.querySelector('[elem_type], [class="elem_type-*"]');
  }

  getUnmarkedItems(self: any) {
    let selector = 'table:not([elem_type]),';
    for (let parent_tag of Array.from(self.parent_tags_list)) {
      selector += `${parent_tag}:not([elem_type])` + ',';
    }

    const unmarked_items = document
      .getElementById(self.word_div)
      .querySelectorAll(selector.slice(0, -1));
    const unmarked_text = [];
    for (let index = 0; index < unmarked_items.length; index++) {
      const item: any = unmarked_items[index];
      if (
        !self.check_element(item) ||
        self.checkForElemMarkings(item) ||
        item.closest('[elem_type]')
      ) {
        continue;
      }
      const text = self.wp.getTagText(item);
      if (text) {
        unmarked_text.push(item);
        item.classList.add('unmarked-text');
      }
    }
    return unmarked_text;
  }

  showUnmarkedItems(value = false, cIndex = 0, ctx = null) {
    let self = this;
    if (ctx) self = ctx;

    if (value) {
      const unmarked_text = this.getUnmarkedItems(self);
      self.showSeeUnmarkedNavButtons = true;
      self.unmarkedItemsAtPreview = unmarked_text;
      cIndex = Math.max(
        0,
        Math.min(cIndex, self.unmarkedItemsAtPreview.length - 1)
      );
      self.currUnmarkedItemIdx = cIndex;
      self.scrollToPrevUnmarkedItem(
        unmarked_text[self.currUnmarkedItemIdx]?.id
      );
    } else {
      self.unmarkedItemsAtPreview.map((item: Element) => {
        item.classList.remove('unmarked-text');
      });
      const currMakring = document.querySelector('.unmarked-highlight');
      currMakring?.classList?.remove('unmarked-highlight');
    }
  }

  updateUnmarkedItems(ctx = this) {
    if (ctx.showSeeUnmarkedNavButtons) {
      ctx.showUnmarkedItems();
      ctx.showUnmarkedItems(
        ctx.showSeeUnmarkedNavButtons,
        ctx.currUnmarkedItemIdx
      );
    }
  }

  scrollToPreviousUnmarkedItem() {
    this.currUnmarkedItemIdx = Math.max(this.currUnmarkedItemIdx - 1, 0);

    this.scrollToPrevUnmarkedItem(
      this.unmarkedItemsAtPreview[this.currUnmarkedItemIdx].id
    );
  }

  scrollToNextUnmarkedItem() {
    this.currUnmarkedItemIdx = Math.min(
      this.currUnmarkedItemIdx + 1,
      this.unmarkedItemsAtPreview.length - 1
    );
    this.scrollToPrevUnmarkedItem(
      this.unmarkedItemsAtPreview[this.currUnmarkedItemIdx].id
    );
  }

  hideSeeUnmarkedNavButtons() {
    this.showSeeUnmarkedNavButtons = false;
    this.showUnmarkedItems(false);
  }

  scrollToErrorElement() {
    this.showErrorCells = !this.showErrorCells;
    this.unmarkableCells.forEach((item) => {
      if (this.showErrorCells) item.classList.add('error-table-cell');
      else item.classList.remove('error-table-cell');
    });

    if (this.showErrorCells) {
      this.scrollToSpecificItem(this.unmarkableCells[0].id);
    }
  }

  checkForSimilarDocument() {
    const params = new FormData();
    params.append('file', this.originalWordFile[0]);
    if (this.diligenceParams?.apiParams?.investor_id && !this.isQaFlow())
      params.append('investor_id', this.diligenceParams.apiParams.investor_id);
    let entityType =
      this.templateParams?.entity_type ||
      this.diligenceParams?.apiParams?.entity_type;
    if (typeof entityType == 'string') {
      entityType = EntityType[entityType];
    }
    const entity_id =
      this.templateParams?.entity_id ||
      this.diligenceParams?.apiParams?.entity_id;
    if (entityType) params.append('entity_type', entityType);
    if (entity_id) params.append('entity_id', entity_id);
    this.isCheckingForSimilarDocument = true;
    this.markingSimilarDocumentLoadingPopup();
    this.parserService.getSimilarDocumentStyles(params).subscribe(
      (resp: any) => {
        this.swal.close();
        this.isCheckingForSimilarDocument = false;
        const foundSimilarElements = this.wp.setMarkedElementStyles(
          resp.metadata
        );
        if (foundSimilarElements) {
          this.updateCounts();
          this.markingSimilarDocumentSuccessPopup();
        } else {
          this.markingSimilarDocumentFailurePopup();
        }
        this.disableCheckForSimilarDocument = true;
      },
      (error) => {
        this.isCheckingForSimilarDocument = false;
        this.swal.close();
        this.markingSimilarDocumentFailurePopup();
      }
    );
  }

  markingSimilarDocumentSuccessPopup() {
    return this.swal.freeInput({
      html: `<div>
              <div>
                ${SUCCESS_SIMILAR_DOC_SVG}
              </div>
              <h3 class="parser-swal-popup-title">Auto-Marking Complete!</h3>
              <div class="parser-swal-popup-description parser-swal-popup-margin-bottom">
                Please review carefully and check any unmarked items. You can undo or reset at any time if needed.
              </div>
          <div>`,
      showCloseButton: false,
      showCancelButton: false,
      confirmButtonText: 'Okay, Got it!',
      width: '550px',
      allowOutsideClick: false,
      customClass: {
        closeButton: 'preview-close-btn',
        cancelButton: 'preview-cancel-btn',
      },
      reverseButtons: true,
    });
  }

  markingSimilarDocumentFailurePopup() {
    return this.swal.freeInput({
      html: `<div>
              <div>
                ${FAILURE_SIMILAR_DOC_SVG}
              </div>
              <h3 class="parser-swal-popup-title">No Similar Markings Found</h3>
              <div class="parser-swal-popup-description parser-swal-popup-margin-bottom">
                We couldn't find a previous document with similar markings. Please proceed with manual marking and import.
              </div>
          <div>`,
      showCloseButton: false,
      showCancelButton: false,
      confirmButtonText: 'Mark Manually',
      width: '550px',
      allowOutsideClick: false,
      customClass: {
        closeButton: 'preview-close-btn',
        cancelButton: 'preview-cancel-btn',
      },
      reverseButtons: true,
    });
  }

  markingSimilarDocumentLoadingPopup() {
    return this.swal.freeInput({
      html: `<div>
              <div>
                <img width="80" src="assets/images/parser-similar-document-search-loader.gif" alt="loading-gif">
              </div>
              <h3 class="parser-swal-popup-title">Searching for Similar Documents</h3>
              <div class="parser-swal-popup-description parser-swal-popup-margin-bottom" >
                Please wait while we check past uploads for similar documents.
              </div>
          <div>`,
      showCloseButton: false,
      showCancelButton: false,
      showConfirmButton: false,
      width: '550px',
      allowOutsideClick: false,
      customClass: {
        closeButton: 'preview-close-btn',
        cancelButton: 'preview-cancel-btn',
      },
      reverseButtons: true,
    });
  }

  toggleInstructions() {
    this.showInstructions = !this.showInstructions;
  }

  saveClickedElement(event: any) {
    event.preventDefault();

    // Check for the current element, parent element for the selector
    const parentElement = event.target.closest(this.contextMenuConfig.selector);
    if (
      !(event.target.matches(this.contextMenuConfig.selector) || parentElement)
    )
      return;
    this.currentTarget = parentElement || event.target;
  }

  onItemClick(option: any) {
    option = option.key;

    const splitedArray = option.split(/\s*\-\s*/g);
    const type_of_text = splitedArray[0];
    if (option.indexOf('this') > -1) {
      if (type_of_text === 'Unmark') {
        this.unMarkItems(ParserSelectionType.DESELECT);
      } else {
        this.cellSpecificOptionClick(type_of_text);
      }
    } else if (option.indexOf('selected') > -1) {
      if (type_of_text === 'Unmark') {
        this.unMarkSelectedItems(ParserSelectionType.DESELECT);
      } else {
        this.markSelectedItems(type_of_text);
      }
    } else if (option.indexOf('single') > -1) {
      this.associateEntities(type_of_text);
    } else if (option.indexOf('multiple') > -1) {
      this.markSubQuestions();
    } else if (option.indexOf('highlighted') > -1) {
      this.markHighlightedText(type_of_text);
    } else if (option.indexOf('all') > -1) {
      if (type_of_text === 'Unmark') {
        this.unMarkItems(ParserSelectionType.DESELECT_SIMILAR);
      } else {
        this.optionClick(type_of_text);
      }
    } else if (option.indexOf('static') > -1) {
      this.markAsGridType(ParserElementType.GRID);
    } else if (option.indexOf('dynamic') > -1) {
      this.markAsGridType(ParserElementType.DYNAMIC_GRID);
    } else if (option.indexOf('title') > -1) {
      if (type_of_text === 'Unmark') {
        this.unMarkItems(ParserSelectionType.DESELECT);
      } else {
        this.markGridTitle();
      }
    } else if (option.indexOf('UnmarkGrid') > -1) {
      this.unMarkGrid();
    } else if (option.indexOf('AssociateInstructions') > -1) {
      this.associateInstructions();
    } else if (option.indexOf('UnmarkAnswerTable') > -1) {
      this.unmarkAnswerTable();
    }

    this.updateUnmarkedItems(this);
  }
}
