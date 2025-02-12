import {
  Component,
  Input,
  OnInit,
  AfterViewInit,
  SimpleChanges,
  OnChanges,
} from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'dv-form-element',
  templateUrl: './dv-form-element.component.html',
  styleUrls: ['./dv-form-element.component.css'],
  //Commenting for now
  // changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DvFormElementComponent
  implements OnInit, AfterViewInit, OnChanges
{
  @Input() modelController: FormControl = null;
  @Input() fieldName? = '';
  @Input() showRightIcon? = true;
  @Input() showWrongIcon? = false;
  @Input() label?;
  @Input() labelPosition?: 'left' | 'top' = 'left';
  @Input() labelClass? = '';
  @Input() isRequired? = false;
  @Input() labelCol? = 3;
  @Input() elementCol? = 8;
  @Input() errorMessage? = '';
  @Input() elementClass? = '';
  @Input() iconClass? = '';
  @Input() isIcon? = false;
  @Input() infoText? = '';
  @Input() infoTextPlacement? = 'top';
  @Input() iconName? = '';
  @Input() iconTooltip? = '';
  @Input() isTemplate? = null;
  @Input() adaptivePosition = true;
  @Input() centerAligned: boolean = false;
  @Input() disabled: boolean = false;
  @Input() customErrorMessage: string = '';
  @Input() formElementTooltip? = ''; // to show tooltip on the entire form element (ex. disabled element with explanation)
  @Input() applyControlLabelClass: boolean = true;
  @Input() spacing?: 'none' | 'small' | 'medium' | 'big' = 'big';
  @Input() for? = '';

  marginBottom = '15px';
  spacingMap = {
    none: '0px',
    small: '5px',
    medium: '10px',
    big: '15px',
  };
  labelColClass = '';

  infoId: string;
  @Input() errorId: string;
  _controlName: string | null = '';
  _formControl = true;
  constructor() {}

  ngOnInit(): void {
    this.marginBottom = this.spacingMap[this.spacing];
    this.labelClass = `${this.labelClass}`;
    if (this.labelPosition === 'top') {
      this.labelClass = `label-top`;
    }

    if (this.applyControlLabelClass) {
      this.labelClass += ' control-label';
    }

    // Initialize labelId and errorId
    if (this.labelPosition == 'left') {
      this.setLabelColClass();
    }

    if (this.modelController && !this.for) {
      this._controlName = this.getControlName(this.modelController);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes.labelCol &&
      changes.labelCol.previousValue != changes.labelCol.currentValue
    ) {
      if (this.labelPosition == 'left') {
        this.setLabelColClass();
      }
    }
  }

  setLabelColClass() {
    this.labelColClass = ` col-md-${this.labelCol}`;
  }

  private getControlName(control: FormControl): string | null {
    let controlName = null;
    const controls = this.modelController?.parent?.controls;
    for (let name in controls) {
      if (controls[name] === control) {
        controlName = name;
        break;
      }
    }
    return controlName;
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.updateAccessibilityAttributes();
    }, 1000);
  }

  updateAccessibilityAttributes() {
    const element = this.getElement();
    const controlName = this._controlName;
    if (!element) {
      this._formControl = false;
      return;
    }
    const tagName = element?.tagName?.toLowerCase();
    if (tagName === 'input' || (tagName === 'textarea' && !this.for)) {
      element.setAttribute('id', controlName);
      element.setAttribute(
        'aria-autocomplete',
        element.getAttribute('autocomplete') || 'off'
      );
      if (this.modelController?.errors?.required) {
        element.setAttribute(
          'aria-required',
          this.modelController?.errors?.required
        );
      }
    }
    const hideLabel = [
      'dv-radio',
      'dv-checkbox',
      'dv-button',
      'app-tinymce-editor',
    ];
    if (tagName && hideLabel.includes(tagName)) {
      // form control not available
      this._formControl = false;
    }
  }

  getElement() {
    return (
      document.querySelector(`[formcontrolname="${this._controlName}"]`) ||
      document.querySelector(`[data-formcontrolname="${this._controlName}"]`) ||
      document.querySelector(`[data-id="${this._controlName}"]`)
    );
  }
}
