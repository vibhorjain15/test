import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { Select } from '@ngxs/store';
import { QuestionState } from '../../../store/questionnaire.state';
import { ResponseType } from '../../../constants/Response-type.constant';
import { UtilsService } from 'src/app2/services/utils.service';

@Component({
  selector: 'dropdown-response',
  templateUrl: './dropdown-response.component.html',
  styleUrls: ['./dropdown-response.component.css'],
})
export class DropdownResponseComponent implements OnInit, OnChanges, OnDestroy {
  @Input() options;
  @Input() value;
  @Input() question;
  @Input() isNotApplicable: boolean = false;
  @Input() isReadOnly: boolean = false;
  @Output() onValueChange = new EventEmitter();
  localSelectedVal;
  otherText;
  otherTextError = 'Please specify other option';
  otherId = -1;
  getResponseTypeFromPanelSub;
  @Select(QuestionState.getResponseTypeFromPanel) getResponseTypeFromPanel;
  constructor(private readonly utils: UtilsService) {}
  ngOnInit(): void {
    this.getResponseTypeFromPanelSub = this.getResponseTypeFromPanel.subscribe(
      (state) => {
        if (
          state &&
          state.response_type &&
          [ResponseType.Dropdown].includes(state.response_type) &&
          state.questionID == this.question.id
        ) {
          setTimeout(() => {
            this.otherId = this.getValidOther();
            this.localSelectedVal = {
              id: this.value?.id,
            };
            if (
              this.otherId != -1 &&
              this.localSelectedVal?.id == this.otherId
            ) {
              this.otherText =
                this.question?.answer?.attributes?.otherExplanation;
            }
            if (state?.listValueId?.length) {
              this.value = this.options.find(
                (val) => val.id == state.listValueId[0]
              );
              if (this.otherId == this.value.id) {
                this.otherText = state.textResponse;
                this.question.answer.attributes.localTextResponse = null;
              } else {
                this.question.answer.attributes.localTextResponse =
                  state.textResponse;
              }
            }
            if (this.value && Object.keys(this.value).length) {
              this.handleChange(this.value);
              this.otherText && this.handleTextChange(this.otherText);
            }
          });
        }
      }
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes.options &&
      changes.options.currentValue != changes.options.previousValue
    ) {
      this.otherId = this.getValidOther();
      this.localSelectedVal = {
        id: this.value?.id,
      };
      if (this.otherId != -1 && this.localSelectedVal?.id == this.otherId) {
        this.otherText = this.question?.answer?.attributes?.otherExplanation;
        if (!this.otherText) this.emitIfNoOthertext();
      }
    } else if (
      changes &&
      this.utils.checkIfValidAndSameOrNotSame(
        changes?.isNotApplicable?.previousValue,
        changes?.isNotApplicable?.currentValue,
        false
      ) &&
      !changes?.isNotApplicable?.currentValue
    ) {
      this.handleChange(this.value);
    }
  }

  emitIfNoOthertext() {
    this.localSelectedVal.isOther = this.localSelectedVal.id == this.otherId;
    this.localSelectedVal.otherExplanation = this.otherText;
    this.localSelectedVal.textResponse =
      this.question.answer.attributes.localTextResponse;
    this.onValueChange.emit({
      isError: this.localSelectedVal.id == this.otherId && !this.otherText,
      value: this.localSelectedVal,
    });
  }

  handleChange(data) {
    this.otherId = this.getValidOther();
    // when NA is removed from a dropdown response where there is no existing response, handleChange
    // gets called with null value. In that case, set localSelectedVal to default format
    this.localSelectedVal = data ?? {
      id: null,
    };
    this.localSelectedVal.isOther = this.localSelectedVal.id == this.otherId;
    this.localSelectedVal.textResponse =
      this.question.answer.attributes.localTextResponse;
    if (this.localSelectedVal.isOther) this.otherId = this.localSelectedVal.id;

    // Template preview we are not passing leftIcons
    if (!this.question.icons.leftIcons?.key) this.otherTextError = '';

    this.onValueChange.emit({
      isError: this.localSelectedVal.id == this.otherId && !this.otherText,
      value: this.localSelectedVal,
    });
  }

  handleTextChange(data) {
    this.otherText = data;
    this.localSelectedVal.otherExplanation = data;
    this.localSelectedVal.textResponse =
      this.question.answer.attributes.localTextResponse;
    this.onValueChange.emit({
      isError: !this.otherText,
      value: this.localSelectedVal,
    });
  }

  getValidOther() {
    //Need to valid condition
    if (
      this.options &&
      this.options.length > 0 &&
      this.options[this.options.length - 1].value === 'Other'
    )
      return this.options[this.options.length - 1].id;

    return -1;
  }

  ngOnDestroy(): void {
    this.getResponseTypeFromPanelSub?.unsubscribe();
  }
}
