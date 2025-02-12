import { KeyValue } from '@angular/common';
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
import { FormControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import { DvValidators } from '../../validators/no-white-space.validator';

@Component({
  selector: 'dv-input',
  templateUrl: './dv-input.component.html',
})
export class DvInputComponent implements OnInit, OnDestroy, OnChanges {
  @Input() type: 'text' | 'number' | 'email' | 'pureNumber' | 'phone' = 'text';
  @Input() placeholder = '';
  @Input() error = '';
  @Input() value = '';
  @Input() rightIcon = '';
  @Input() isNotApplicable: boolean = false;
  @Input() isReadOnly: boolean = false;
  @Input() isRequired: boolean = false;
  @Input() showError: boolean = true;
  @Input() isMultipleValues: boolean = false;
  @Input() separator = ',';
  @Input() maxDigitsAfterDecimalPoint = null;
  @Input() control?: FormControl;
  @Input() id: any = Symbol('unique id for input').toString();
  @Input() name: any = '';
  @Input() autocomplete: 'on' | 'off' = 'on';
  @Input() maxLength?: number;
  @Output() onValueChange = new EventEmitter();

  subscription$: Subscription;

  requiredErrorMessagesMap = {
    pureNumber: 'Integer is required',
    text: 'Text is required',
    email: 'Email is required',
    phone: 'Phone is required',
    number: 'Number is Required',
  };

  constructor() {}

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes.value?.currentValue !== changes.value?.previousValue &&
      this.control
    ) {
      this.control.setValue(changes.value?.currentValue);
    }

    if (
      changes.isReadOnly?.currentValue &&
      changes.isReadOnly?.currentValue !== changes.isReadOnly?.previousValue
    ) {
      !changes.isReadOnly?.currentValue
        ? this.control.enable()
        : this.control.disable();
    }

    if (
      (changes.type &&
        changes.type.currentValue !== changes.type.previousValue) ||
      (changes.isRequired &&
        changes.isRequired.currentValue !== changes.isRequired.previousValue)
    ) {
      this.control.setValidators(this.setValidator());
      this.control.updateValueAndValidity();
    }
  }

  ngOnInit(): void {
    if (!this.control) {
      this.control = new FormControl(this.control?.value || this.value);
    }
    this.control.setValidators(this.setValidator());
    this.control.setValue(this.control?.value || this.value);
    this.subscription$ = this.control.valueChanges.subscribe((data) => {
      this.onValueChange.emit({
        value: data,
        error: this.control?.errors?.message,
      });
    });

    if (this.isReadOnly) {
      this.control.disable();
    }
  }

  ngOnDestroy(): void {
    this.subscription$.unsubscribe();
  }

  setValidator(): Array<any> {
    let validators = [];
    if (this.type === 'email') {
      validators.push(
        DvValidators.isEmail(this.error, this.isMultipleValues, this.separator)
      );
    } else if (this.type === 'number') {
      validators.push(
        DvValidators.isNumber(
          this.error,
          16,
          this.maxDigitsAfterDecimalPoint,
          this.isMultipleValues
        )
      );
    } else if (this.type === 'pureNumber') {
      validators.push(DvValidators.isPureNumber(this.error));
    } else if (this.type === 'phone') {
      validators.push(
        DvValidators.isPhone(this.error, this.isMultipleValues, this.separator)
      );
    }

    if (
      this.type !== 'number' &&
      this.type !== 'pureNumber' &&
      this.maxLength
    ) {
      validators.push(DvValidators.maxLength(this.maxLength));
    }

    if (this.isRequired) {
      validators = [
        DvValidators.isRequired(
          this.requiredErrorMessagesMap[this.type],
          this.isMultipleValues,
          this.separator
        ),
        ...validators,
      ];
    }
    return validators;
  }

  originalOrder = (
    a: KeyValue<number, string>,
    b: KeyValue<number, string>
  ): number => {
    return 0;
  };
}
