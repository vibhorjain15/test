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
import { QuestionState } from '../../../store/questionnaire.state';
import { Select } from '@ngxs/store';
import { ResponseType } from '../../../constants/Response-type.constant';
import { UtilsService } from 'src/app2/services/utils.service';

@Component({
  selector: 'checkbox-response',
  templateUrl: './checkbox-response.component.html',
  styleUrls: ['./checkbox-response.component.css'],
})
export class CheckboxResponseComponent implements OnInit, OnChanges, OnDestroy {
  @Input() options: { id: any; value: any }[];
  @Input() checkboxValues;
  @Input() question;
  @Input() isNotApplicable: boolean = false;
  @Input() isReadOnly: boolean = false;
  @Output() onValueChange = new EventEmitter();
  otherValues;
  otherTextError = 'Please specify other option';
  isOtherOptionSelected: boolean = false;
  otherOptionId: number = -1;
  getResponseTypeFromPanelSub;
  @Select(QuestionState.getResponseTypeFromPanel) getResponseTypeFromPanel;

  constructor(private readonly utils: UtilsService) {}
  ngOnInit(): void {
    this.getResponseTypeFromPanelSub = this.getResponseTypeFromPanel.subscribe(
      (state) => {
        if (
          state &&
          state.response_type &&
          [ResponseType.CheckBox].includes(state.response_type) &&
          state.questionID == this.question.id
        ) {
          setTimeout(() => {
            let otherOption = this.options?.find(
              (option) => option.value === 'Other'
            );
            this.otherOptionId = otherOption?.id ?? -1;
            if (this.otherOptionId >= 0 && this.checkboxValues) {
              this.isOtherOptionSelected =
                this.checkboxValues[this.otherOptionId];
              this.otherValues =
                this.question?.answer?.attributes?.otherExplanation;
            }
            if (state?.listValueId?.length) {
              Object.keys(this.checkboxValues).forEach((key) => {
                this.checkboxValues[key] = false;
              });
              state.listValueId.forEach((id) => {
                this.checkboxValues[id] = true;
              });
              if (state.listValueId.find((val) => val == this.otherOptionId)) {
                this.otherValues = state.textResponse;
                this.question.answer.attributes.localTextResponse = null;
              } else {
                this.question.answer.attributes.localTextResponse =
                  state.textResponse;
              }
            } else {
              Object.keys(this.checkboxValues).forEach((key) => {
                this.checkboxValues[key] = false;
              });
              this.otherValues = null;
              this.question.answer.attributes.localTextResponse =
                state.textResponse;
            }
            if (this.checkboxValues && Object.keys(this.checkboxValues).length)
              this.handleChange();
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
      let otherOption = this.options.find((option) => option.value === 'Other');
      this.otherOptionId = otherOption?.id ?? -1;
      if (this.otherOptionId >= 0 && this.checkboxValues) {
        this.isOtherOptionSelected = this.checkboxValues[this.otherOptionId];
        this.otherValues = this.question?.answer?.attributes?.otherExplanation;
        if (this.isOtherOptionSelected && !this.otherValues) this.emitData();
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
      this.handleChange();
    }
  }

  emitData() {
    let data: any = {
      isError:
        this.otherOptionId >= 0 &&
        this.isOtherOptionSelected &&
        !this.otherValues,
      value: {
        checkedOptions: Object.keys(this.checkboxValues)
          .filter((key) => this.checkboxValues[key])
          .map((key) => Number(key)),
        isOther: this.isOtherOptionSelected,
        otherExplanation: this.otherValues,
        textResponse: this.question.answer.attributes.localTextResponse,
      },
    };
    this.onValueChange.emit(data);
  }

  handleChange() {
    if (this.otherOptionId > 0 && this.checkboxValues) {
      this.isOtherOptionSelected = this.checkboxValues[this.otherOptionId];
    }
    // Template preview we are not passing leftIcons
    if (!this.question.icons.leftIcons?.key) this.otherTextError = '';

    this.emitData();
  }

  ngOnDestroy(): void {
    this.getResponseTypeFromPanelSub?.unsubscribe();
  }
}
