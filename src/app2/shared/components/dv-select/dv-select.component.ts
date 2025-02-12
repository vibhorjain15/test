import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  forwardRef,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormControl,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { NgSelectComponent } from '@ng-select/ng-select';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';

@Component({
  selector: 'dv-select',
  templateUrl: './dv-select.component.html',
  styleUrls: ['./dv-select.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DvSelectComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DvSelectComponent implements ControlValueAccessor, AfterViewInit {
  @ViewChild('select') ngSelect: NgSelectComponent;
  @Input() contoller: FormControl = null;
  @Input() id: string = null;
  @Input() placeholder = 'Select an option';
  @Input() list = [];
  @Input() clearable = false;
  @Input() searchable = true;
  @Input() multiple = false;
  @Input() maxSelectedItems = 100;
  @Input() bindLabel = 'name';
  @Input() bindValue = 'id';
  @Input() error = '';
  @Input() groupBy;
  @Input() disabled: boolean = false;
  @Input() addTagText = 'Add New';
  @Input() addTag: boolean | ((term: string) => any | Promise<any>) = false;
  @Input() loading: boolean = false;
  @Input() appendTo = '';
  @Input() notFoundText = 'Could not find any action items';
  @Input() hideSelected = false;
  @Input() useTemplates = true;
  @Input('aria-label') ariaLabel = '';
  @Input() ariaLabelledBy = ''; // use when dv-form-element is not used and label is present

  ariaAutocomplete = '';
  title = '';
  @Output() onSelectChange = new EventEmitter();
  @Output() remove = new EventEmitter();
  @Input() searchFn = null;
  @Input() readonly = false;
  @Input() virtualScroll = true;

  @Output() onClear = new EventEmitter();
  onChangeCallback = (_: any) => {};
  onTouchedCallback = () => {};

  isDropdownOpen: boolean = false;
  constructor(
    private readonly sweetAlert: SweetAlertService,
    private cd: ChangeDetectorRef
  ) {}
  private _value: any;
  public get value(): any {
    return this._value === '' ? null : this._value;
  }
  public set value(v: string) {
    if (v !== this._value) {
      this._value = v;
      this.onChangeCallback(v);
    }
  }

  ngAfterViewInit(): void {
    document.querySelectorAll('div[role="combobox"]').forEach((div) => {
      div.setAttribute('tabindex', '0');
    });
  }

  handleSelectChange(event) {
    this.value = event;
    this.onSelectChange.emit(event);
  }

  handleGoToPremiumPage(event) {
    this.sweetAlert.premiumAlert();
  }

  onBlur() {
    this.onTouchedCallback();
  }
  writeValue(value: any): void {
    if (value !== this._value) {
      this._value = value;
      this.cd.markForCheck();
    }
  }
  registerOnChange(fn: any): void {
    this.onChangeCallback = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouchedCallback = fn;
  }

  handleRemove($event) {
    this.remove.emit($event);
  }

  close() {
    this.ngSelect?.close();
  }

  clear() {
    this.ngSelect?.handleClearClick();
  }
  handleClear() {
    this.onClear.emit();
  }

  onDropdownOpen() {
    this.isDropdownOpen = true;
    setTimeout(() => {
      const elements = document.getElementsByClassName(
        'ng-dropdown-panel-items'
      );
      if (elements?.length) {
        const element = elements.item(0);
        element.setAttribute('tabindex', '0');
        element.setAttribute('role', 'group');
      }

      if (!this.id) {
        const inputElement = this.ngSelect.searchInput.nativeElement;
        const value = inputElement.getAttribute('aria-controls');
        if (value) {
          inputElement.parentElement.setAttribute('aria-controls', value);
          inputElement.parentElement.setAttribute('tabindex', '0');
        }
      } else if (this.id) {
        const inputElement = document.getElementById(this.id);
        inputElement.parentElement.setAttribute('aria-controls', this.id);
      }
    }, 100);
  }

  onDropdownClose() {
    this.isDropdownOpen = false;
  }
 
}
