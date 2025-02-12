import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { ResponseType } from '../../../constants/Response-type.constant';
import { CacheUtil } from '../../../service/cache.service';
import { DvEditorComponent } from 'src/app2/shared/components';
import { QuestionState } from '../../../store/questionnaire.state';
import { Select } from '@ngxs/store';
import { UtilsService } from 'src/app2/services/utils.service';
import { QuestionnaireStatusService } from '../../../service/status.service';

@Component({
  selector: 'boolean-response',
  templateUrl: './boolean-response.component.html',
  styleUrls: ['./boolean-response.component.css'],
})
export class BooleanResponseComponent implements OnInit, OnDestroy {
  @Input() explanationPlaceholder;
  @Input() booleanValue: 'yes' | 'no';
  @Input() explanation = '';
  @Input() question;
  @Input() isNotApplicable: boolean = false;
  @Input() isReadOnly: boolean = false;
  @Input() type:
    | ResponseType.Boolean
    | ResponseType.BooleanPlus
    | ResponseType.NoPlus = ResponseType.Boolean;
  @Output() onValueChange = new EventEmitter();
  @ViewChild('editor') editor: DvEditorComponent;
  id;
  explanationError = 'Please provide an explanation';
  localExplanation: any; // Used only for determining state of the tinymce ( LITE or Real )
  responseType = ResponseType;
  initialVal;
  tinyMceInit: any = {
    placeholder: 'Please provide an explanation',
  };
  @Select(QuestionState.getResponseTypeFromPanel) getResponseTypeFromPanel;
  getResponseTypeFromPanelSub;
  constructor(
    private cache: CacheUtil,
    private readonly utils: UtilsService,
    private readonly status: QuestionnaireStatusService
  ) {}
  ngOnInit(): void {
    const { sequenceID, sectionID, id } = this.question;
    this.id = `${sequenceID}-${sectionID}-${id}`;
    if (this.explanationPlaceholder) {
      this.tinyMceInit.placeholder = this.explanationPlaceholder;
    }
    this.tinyMceInit.readonly = this.isReadOnly;
    this.initialVal = this.booleanValue;
    this.getResponseTypeFromPanelSub = this.getResponseTypeFromPanel.subscribe(
      (state) => {
        if (
          state &&
          state.response_type &&
          [
            ResponseType.Boolean,
            ResponseType.BooleanPlus,
            ResponseType.NoPlus,
          ].includes(state.response_type) &&
          state.questionID == this.question.id
        ) {
          setTimeout(() => {
            const { sequenceID, sectionID, id } = this.question;
            this.id = `${sequenceID}-${sectionID}-${id}`;
            if (this.explanationPlaceholder) {
              this.tinyMceInit.placeholder = this.explanationPlaceholder;
            }
            if (state.booleanValue != null) {
              this.booleanValue = !state.booleanValue ? 'no' : 'yes';
              if (state.localBooleanExplanation) {
                this.explanation = state.localBooleanExplanation;
              }
            } else {
              this.booleanValue = null;
              this.explanation = null;
            }
            this.tinyMceInit.readonly = this.isReadOnly;
            this.initialVal = this.booleanValue;
            this.handleChange(this.booleanValue, this.explanation);
          });
        }
      }
    );
    this.localExplanation = this.explanation;
    if (
      this.booleanValue !== null &&
      !this.localExplanation &&
      ((this.type === ResponseType.BooleanPlus &&
        this.booleanValue === 'yes') ||
        (this.type === ResponseType.NoPlus && this.booleanValue === 'no'))
    ) {
      this.handleChange(this.booleanValue, this.localExplanation);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes &&
      this.utils.checkIfValidAndSameOrNotSame(
        changes?.isNotApplicable?.previousValue,
        changes?.isNotApplicable?.currentValue,
        false
      ) &&
      !changes?.isNotApplicable?.currentValue
    ) {
      if (this.booleanValue !== null)
        this.handleChange(this.booleanValue, this.localExplanation);
    }

    if (
      changes &&
      this.utils.checkIfValidAndSameOrNotSame(
        changes.isReadOnly.previousValue,
        changes.isReadOnly.currentValue,
        false
      )
    ) {
      this.tinyMceInit.readonly = changes.isReadOnly.currentValue;
    }
  }

  handleChange(booleanValue, explanation = '') {
    if (this.initialVal !== booleanValue) {
      this.explanation = null;
      this.initialVal = booleanValue;
      if (
        (this.type === ResponseType.BooleanPlus && booleanValue === 'yes') ||
        (this.type === ResponseType.NoPlus && booleanValue === 'no')
      )
        this.question.answer.attributes.localTextResponse = null; // Only touch this field when required
    }
    this.explanation = explanation;
    let isError = '';
    let localBooleanResponse = booleanValue === 'yes';
    if (
      (this.type === ResponseType.NoPlus && !localBooleanResponse) ||
      (this.type === ResponseType.BooleanPlus && localBooleanResponse)
    ) {
      if (!explanation) isError = 'Explanation is required';
      this.status.handleUpdateActiveQuestion(this.question);
    }
    if (
      (this.type === ResponseType.BooleanPlus && !localBooleanResponse) ||
      (this.type === ResponseType.NoPlus && localBooleanResponse)
    ) {
      this.explanation = null;
      this.localExplanation = null;
      explanation = null;
    }

    // Template preview we are not passing leftIcons
    if (!this.question.icons.leftIcons?.key) this.explanationError = '';

    this.onValueChange.emit({
      isError,
      value: {
        boolean: booleanValue,
        explaination:
          (this.type === ResponseType.BooleanPlus && localBooleanResponse) ||
          (this.type === ResponseType.NoPlus && !localBooleanResponse)
            ? explanation
            : this.question.answer.attributes.localTextResponse,
      },
      type: this.type,
    });
    if (explanation) this.localExplanation = explanation;
  }

  updateEditorInstance() {
    this.status.handleUpdateActiveQuestion(this.question);
  }

  ngOnDestroy(): void {
    this.getResponseTypeFromPanelSub?.unsubscribe();
  }
}
