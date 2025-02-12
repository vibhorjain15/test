import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { UtilsService } from 'src/app2/services/utils.service';
import { ResponseType } from '../../../constants/Response-type.constant';
import { QuestionState } from '../../../store/questionnaire.state';
import { Select } from '@ngxs/store';
import { CommaSeparatorPipe } from 'src/app2/shared/pipes/commaSeparator.pipe';
import { debouncer } from 'src/app2/utils/debouce.util';

@Component({
  selector: 'response-input',
  templateUrl: './response-input.component.html',
  styleUrls: ['./response-input.component.css'],
})
export class ResponseInputComponent
  implements OnInit, OnDestroy, AfterViewInit, OnChanges
{
  @Input() type: 'text' | 'number' | 'email' | 'pureNumber' = 'text';
  @Input() placeholder = '';
  @Input() error = '';
  @Input() value = '';
  @Input() id;
  @Input() rightIcon = '';
  @Input() isNotApplicable: boolean = false;
  @Input() isReadOnly: boolean = false;
  @Input() isRequired: boolean = false;
  @Input() question?;
  @Input() requiredErrorMessage: string = 'Value is required';
  @Input() commaAddResponse: boolean;
  @Input() enableValidation: boolean = false;
  @Output() onValueChange = new EventEmitter();
  @Select(QuestionState.getResponseTypeFromPanel) getResponseTypeFromPanel;
  getResponseTypeFromPanelSub;
  isTouched = false;
  numberTypeMaxLength: number = 16;
  debouceInst: any;
  constructor(
    private util: UtilsService,
    private readonly commaSeparator: CommaSeparatorPipe
  ) {
    this.handleChange = this.handleChange.bind(this);
  }
  ngOnInit(): void {
    this.isTouched = !!this.error;
    this.debouceInst = debouncer(this.handleChange, 3000);

    if (this.commaAddResponse && this.value)
      this.value = this.commaSeparator.transform(this.value);
    this.getResponseTypeFromPanelSub = this.getResponseTypeFromPanel.subscribe(
      (state) => {
        if (
          state &&
          state.response_type &&
          [
            ResponseType.Numeric,
            ResponseType.Integer,
            ResponseType.TextPhone,
            ResponseType.Percentage,
            ResponseType.Identifier,
            ResponseType.Text,
            ResponseType.TextEmail,
          ].includes(state.response_type) &&
          state.questionID == this.id
        ) {
          setTimeout(() => {
            if (
              [
                ResponseType.Numeric,
                ResponseType.Integer,
                ResponseType.TextPhone,
                ResponseType.Percentage,
                ResponseType.Identifier,
              ].includes(state.response_type)
            )
              this.value = state.NumericResponseA
                ? `${state.NumericResponseA}`
                : '';
            else this.value = `${state.textResponse}`;
            this.handleChange(this.value);
          });
        }
      }
    );
  }

  ngAfterViewInit(): void {
    // Waiting async store calls to finish
    setTimeout(() => {
      if (this.question?.answer.attributes.localis_validation_required) {
        this.handleChange(this.value);
      }
    }, 1000);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes &&
      this.util.checkIfValidAndSameOrNotSame(
        changes?.isNotApplicable?.previousValue,
        changes?.isNotApplicable?.currentValue,
        false
      ) &&
      !changes?.isNotApplicable?.currentValue
    ) {
      this.handleChange(this.value);
    }
  }

  handleValidation() {
    let value = this.value;
    if (this.commaAddResponse && this.value)
      value = this.value.replace(/,/g, '');
    if (this.value) {
      if (this.type === 'text') {
        this.error = '';
        if (this.question.response_word_limit) {
          const onlyTextValue = this.util.getWordCount(value);
          this.error =
            this.question.response_word_limit &&
            onlyTextValue > this.question.response_word_limit
              ? 'true'
              : '';
        }
      } else if (
        this.type === 'number' &&
        (!this.util.isNumeric(value) || !this.util.isValidNumberDecimal(value))
      ) {
        if (value.toString().split('.')[1]?.length > 2)
          this.error =
            'Invalid input. Please enter a number with no more than 2 decimal places';
        else this.error = 'Not a valid number';
      } else if (
        this.type == 'pureNumber' &&
        (!this.util.isNumeric(value) ||
          !this.util.isValidNumberWithoutDecimal(value))
      ) {
        this.error = 'Enter a valid Integer';
      } else if (
        this.type === 'email' &&
        !this.util.validateEmail(this.value)
      ) {
        this.error = 'Not a valid email address';
      } else {
        this.error = '';
      }
    } else {
      if (this.isRequired) {
        this.error = this.requiredErrorMessage;
      } else {
        this.error = '';
      }
    }
  }

  handleChange(data) {
    this.isTouched = true;
    if (this.commaAddResponse && this.value)
      this.value = this.commaSeparator.transform(this.value.replace(/,/g, ''));

    // Template preview we are not passing leftIcons
    if (this.question?.icons.leftIcons?.key || this.enableValidation) {
      this.handleValidation();
    }

    this.onValueChange.emit({
      value: this.commaAddResponse && data ? data.replace(/,/g, '') : data,
      error: this.error,
    });
  }

  ngOnDestroy(): void {
    this.getResponseTypeFromPanelSub?.unsubscribe();
  }
}
