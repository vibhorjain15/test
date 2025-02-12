import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { QuestionnaireService } from 'src/app2/apis/questionnaire/questionnaire.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { placeholder } from '../../constants/response-placeholder.constant';
import { ResponseType } from '../../constants/Response-type.constant';
import { GridDataType } from '../../types/grid.type';
import { QuestionAttributeType } from '../../types/questions.type';
import { CacheUtil } from '../../service/cache.service';
import { Store } from '@ngxs/store';
import { BehaviorSubject } from 'rxjs';
import { DeviceService } from 'src/app2/services/device-type.service';
import * as moment from 'moment';
import { QuestionnaireStatusService } from '../../service/status.service';
import { AddCommentData } from 'src/app2/shared/models/ckeditor.model';

@Component({
  selector: 'question-response',
  templateUrl: './question-response.component.html',
  styleUrls: ['./question-response.component.css'],
})
export class QuestionResponseComponent implements OnInit, OnChanges {
  @Input() question: QuestionAttributeType;
  @Input() isReadOnly: boolean = false;
  // Applicable only for grid and dynamic grid. Used to render a plain table / hands-on-table.
  @Input() isPlainRendering: boolean = false;
  // Applicable only for grid and dynamic grid. Used to show / hide row and column headers in plain rendering
  @Input() enableHeaders: boolean = true;
  @Input() isTrackChange;
  // used to override the width of all response types to full
  @Input() useFullWidth: boolean = false;
  // Used to remove scrollbars and display content in full. Currently applicable only for grids with plain rendering
  @Input() isPrintPreview: boolean = false;
  // Used to control isEditable in AUM response. used by mapped-questions.
  @Input() isReadOnlyEditable: boolean = true;
  @Input() showComments: boolean = false;
  @Input() isNotApplicable = false;
  @Input() isPreview: boolean = false;
  @Output() onChange = new EventEmitter();
  @Output() onTrackChange = new EventEmitter();
  @Output() onReviewCommentFocused = new EventEmitter<void>();
  @Output() onAddReviewComment: EventEmitter<AddCommentData> =
    new EventEmitter<AddCommentData>();

  reload = new BehaviorSubject(null);
  reload$;
  commaAddResponse: boolean = false;
  placeholder = placeholder;
  response;
  error;
  booleanResponse = null;
  minVal;
  maxVal;
  bookendError = '';
  isBookendTouched = false;
  dropdownValue = null;
  checkboxVal = {};
  dateTouch = false;

  gridRow = [];
  gridColumn = [];
  dataset = [];
  dynamic_element;
  localBooleanExplaination;
  localRowMap = {};
  localColMap = {};
  localGridMap = {};
  responseDynamicGridMap = {};
  showGrid = false;
  gridData;
  onlyTextValue = 0;
  diligence: any;
  user: any;
  showUnsubmittedResponseText: boolean;
  textMultilineEditorId: string;
  constructor(
    private questionnaire: QuestionnaireService,
    private util: UtilsService,
    private cache: CacheUtil,
    private store: Store,
    public device: DeviceService,
    public readonly status: QuestionnaireStatusService
  ) {}
  ngOnInit(): void {
    this.reload$ = this.reload.asObservable();
    this.updateResponse();
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
        setTimeout(() => this.reload.next(Math.random()), 1);
      } else
        this.questionnaire
          .getQuestionGridData(id, version, response_id)
          .subscribe((rowData: GridDataType) => {
            this.cache.GRIDCACHE[expandedId] = rowData;
            this.gridData = rowData;
            setTimeout(() => this.reload.next(Math.random()), 1);
          });
    }
    if (
      this.question.responseType === ResponseType.Dropdown ||
      this.question.responseType === ResponseType.CheckBox
    ) {
      if (this.question.id in this.cache.OPTIONCACHE) {
        this.getOptions(this.cache.OPTIONCACHE[this.question.id]);
      } else {
        this.questionnaire
          .getQuestionOptions(this.question.id)
          .subscribe((options: any) => {
            this.cache.OPTIONCACHE[this.question.id] = options;
            this.getOptions(options);
          });
      }
    }

    this.commaAddResponse =
      this.question?.responseType === ResponseType.Integer ||
      this.question?.responseType === ResponseType.Numeric;
  }

  handleReviewCommentFocused(): void {
    this.onReviewCommentFocused.emit();
  }

  handleAddReviewComment(value: AddCommentData): void {
    this.onAddReviewComment.emit(value);
  }

  handleRowInsertion({ startIndex, endIndex, aggregationRowId }) {
    let gridData;
    let expandedId = `${this.question.sequenceID}-${this.question.sectionID}-${this.question.id}`;
    if (expandedId in this.cache.GRIDCACHE) {
      gridData = this.cache.GRIDCACHE[expandedId];
    } else {
      gridData = this.gridData;
    }

    if (gridData.aggregation_json) {
      let aggregationRowIndex = gridData.rows_columns.findIndex(
        (row) => row.is_aggregated
      );
      let aggregationRow =
        aggregationRowIndex > -1
          ? gridData.rows_columns.splice(aggregationRowIndex, 1)[0]
          : {
              elementType: 'Row',
              id: aggregationRowId,
              name: JSON.parse(gridData.aggregation_json).row_name,
              group_id: aggregationRowId,
              is_aggregated: true,
            };
      for (let i = startIndex; i <= endIndex; i++) {
        gridData.rows_columns.push({
          elementType: 'Row',
          id: i,
          name: i,
          group_id: i,
        });
      }

      gridData.rows_columns.push({
        ...aggregationRow,
        id: aggregationRowId,
        group_id: aggregationRowId,
      });
    } else {
      for (let i = startIndex; i <= endIndex; i++) {
        gridData.rows_columns.push({
          elementType: 'Row',
          id: i,
          name: i,
          group_id: i,
        });
      }
    }

    this.cache.GRIDCACHE[expandedId] = gridData;
  }

  handleRowDeletion(deletedRowIds: any[]) {
    let gridData;
    let expandedId = `${this.question.sequenceID}-${this.question.sectionID}-${this.question.id}`;
    if (expandedId in this.cache.GRIDCACHE) {
      gridData = this.cache.GRIDCACHE[expandedId];
    } else {
      gridData = this.gridData;
    }

    deletedRowIds.forEach((rowId) => {
      let index =
        gridData?.rows_columns?.findIndex(
          (item) => item.elementType === 'Row' && item.id == rowId
        ) ?? -1;
      if (index != -1) {
        gridData.rows_columns.splice(index, 1);
      }
    });

    this.cache.GRIDCACHE[expandedId] = gridData;
  }

  getOptions(options) {
    options.forEach((val) => {
      val.id = val?.dropdown_option_id ?? val.id;
      val.value = val?.dropdown_option_text ?? val.value;
    });
    this.question.options = options;
    if (this.question?.answer)
      if (this.question.responseType === ResponseType.Dropdown)
        if (this.question.answer.attributes.localListValueID)
          this.dropdownValue = this.question.options.filter(
            (val) =>
              val.id === this.question.answer.attributes.localListValueID[0]
          )[0];
        else this.dropdownValue = null;
    if (this.question.responseType === ResponseType.CheckBox) {
      this.question.options.map((val) => (this.checkboxVal[val.id] = false));
      this.question.answer.attributes.localListValueID?.map((val) => {
        this.checkboxVal[val] = true;
      });
    }
  }

  updateResponse() {
    if (this.question?.answer) {
      this.diligence = this.store.selectSnapshot(
        (state) => state.questionnaire.diligence
      );
      this.user = this.store.selectSnapshot((state) => state.user.currentUser);
      if (
        this.user.isInvestor &&
        !this.diligence?.is_internal &&
        this.diligence?.completed_at
      ) {
        if (
          this.question.followup_count &&
          this.question.sequenceID in this.question.followup_count &&
          this.question.followup_count[this.question.sequenceID]
            .allow_response_revision &&
          this.question.followup_count[this.question.sequenceID]
            .last_investor_followup_created_date >
            this.diligence.completed_at &&
          ((!this.question.answer.id &&
            this.question.followup_count[this.question.sequenceID].count > 0) ||
            (this.question.answer.id &&
              !this.question.answer.attributes.is_submitted))
        ) {
          // don't show response to investors in post-completion statuses if question has a followup with allow response revision and submission is pending
          this.showUnsubmittedResponseText = true;
          return;
        } else if (
          this.question.isNested &&
          this.question.answer.id &&
          !this.question.answer.attributes.is_submitted
        ) {
          // don't show response to investors in post-completion statuses if submission is pending for a nested answered question. that means parent has followups with response revision
          this.showUnsubmittedResponseText = true;
          return;
        }
      }
      this.response = this.question.answer.attributes.localResponseText;
      if (this.question.responseType === ResponseType.Date) {
        if (this.question.answer.attributes?.localDateResponse)
          this.response = new Date(
            this.question.answer.attributes?.localDateResponse.replaceAll(
              '-',
              '/'
            )
          );
        else this.response = null;
        // this.dateTouch = false;
      }
      if (
        this.question.responseType === ResponseType.TextEmail ||
        this.question.responseType === ResponseType.Text ||
        this.question.responseType === ResponseType.TextMultiLine
      ) {
        this.response = this.question.answer.attributes.localTextResponse;
      }
      if (
        this.question.responseType === ResponseType.Numeric ||
        this.question.responseType === ResponseType.Integer ||
        this.question.responseType === ResponseType.Percentage ||
        this.question.responseType === ResponseType.TextPhone ||
        this.question.responseType === ResponseType.Identifier
      ) {
        this.response = this.question.answer.attributes.localNumericResponseA;
        if (this.response != undefined || this.response != null) {
          this.response = `${this.response}`;
        }
      }
      if (this.question.responseType === ResponseType.Bookends) {
        this.minVal =
          this.question.answer.attributes?.localNumericResponseA ?? null;
        this.maxVal =
          this.question.answer.attributes?.localNumericResponseB ?? null;
      }
      if (
        this.question.responseType === ResponseType.Boolean ||
        this.question.responseType === ResponseType.BooleanPlus ||
        this.question.responseType === ResponseType.NoPlus
      ) {
        this.response =
          this.question.answer.attributes?.localbooleanExplanation ||
          this.question.answer.attributes.booleanExplanation;
        this.localBooleanExplaination = this.response;
        if (this.question.answer.attributes.localBooleanResponse !== null)
          this.booleanResponse = this.question.answer.attributes
            .localBooleanResponse
            ? 'yes'
            : 'no';
      }
      if (
        this.question.responseType === ResponseType.Dropdown &&
        this.question.options
      ) {
        if (this.question.answer.attributes.localListValueID)
          this.dropdownValue = this.question.options.filter(
            (val) =>
              val.id === this.question.answer.attributes.localListValueID[0]
          )[0];
        else this.dropdownValue = null;
      }
      if (
        this.question.responseType === ResponseType.CheckBox &&
        this.question.options
      ) {
        this.question.options.map((val) => (this.checkboxVal[val.id] = false));
        this.question.answer.attributes.localListValueID?.map((val) => {
          this.checkboxVal[val] = true;
        });
      }
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes?.question &&
      (changes.question.currentValue !== changes.question.previousValue ||
        JSON.stringify(changes.question.currentValue) !==
          JSON.stringify(changes.question.previousValue))
    ) {
      this.question = changes.question.currentValue;
      this.updateResponse();
    } else if (
      changes?.isReadOnly &&
      changes.isReadOnly.currentValue !== changes.isReadOnly.previousValue
    ) {
      this.isReadOnly = changes.isReadOnly.currentValue;
      this.updateResponse();
    } else if (
      changes &&
      this.util.checkIfValidAndSameOrNotSame(
        changes?.isNotApplicable?.previousValue,
        changes?.isNotApplicable?.currentValue,
        false
      ) &&
      !changes?.isNotApplicable?.currentValue
    ) {
      if (this.question.responseType === ResponseType.Bookends)
        this.handleBookendChange(this.question.responseType);
    }
  }

  handleInputChange({ value, error }, type) {
    this.response = value ?? '';
    this.onChange.emit({
      isError: error,
      value: this.response,
      type,
    });
  }

  handleTextMultiLineInputChange(value, type) {
    this.response = value ?? '';
    this.onChange.emit({
      isError: false,
      value: this.response,
      type,
    });
  }

  handleDateValue(date) {
    if (!this.dateTouch) {
      this.dateTouch = this.store
        .selectSnapshot((state) => state.questionnaire.activePanelId)
        ?.includes('qa-revision');
    }
    if (this.dateTouch) {
      if (!date) return;
      this.response = date;
      let local = moment(this.response).format('MM-DD-YYYY');
      this.onChange.emit({
        isError: !local,
        value: local,
        type: ResponseType.Date,
      });
    }
    this.dateTouch = true;
  }

  handleBookendChange(type) {
    this.isBookendTouched = true;
    if (
      (this.maxVal && !this.util.isNumeric(this.maxVal)) ||
      (this.minVal && !this.util.isNumeric(this.minVal))
    )
      this.bookendError = 'Not a vaild Number';
    else if (+this.minVal >= (+this.maxVal ?? 0))
      this.bookendError = 'Not a vaild range';
    else this.bookendError = '';
    if (!this.minVal || !this.maxVal) this.bookendError = 'Not a vaild range';
    this.onChange.emit({
      isError: this.bookendError,
      value: { min: +this.minVal, max: +this.maxVal },
      type,
    });
  }

  handleAttachmentChange(attachment) {
    let attachmentIds = [];
    attachment.map((val) => attachmentIds.push(val.id));
    this.onChange.emit({
      isError: false,
      value: attachmentIds,
      type: ResponseType.Attachment,
    });
  }

  handleAumChange(data) {
    this.onChange.emit({
      type: this.question.responseType,
      ...data,
    });
  }

  handleValueChange(data) {
    if (data.error !== undefined && data.isError === undefined) {
      data.isError = data.error;
    }
    this.updateWordCount(data);
    this.onChange.emit({ ...data, type: this.question.responseType });
  }

  handleMultiTrackChange({ editor, flite }) {
    this.onTrackChange.emit({ editor, flite });
  }

  updateWordCount(data) {
    if (this.question?.responseType === ResponseType.Text) {
      this.onlyTextValue = this.util.getWordCount(data.value);
      data.isError =
        this.question.response_word_limit &&
        this.onlyTextValue > this.question.response_word_limit;
    }
  }
}
