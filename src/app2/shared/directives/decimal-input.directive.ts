import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[appDecimalInput]',
})
export class DecimalInputDirective {
  @Input() allowNegative: boolean = true;
  @Input() decimalUpto: number = 2;

  constructor(private readonly elementRef: ElementRef) {}
  @HostListener('input', ['$event'])
  @HostListener('paste', ['$event'])
  @HostListener('keypress', ['$event'])
  onKeyPress(event: KeyboardEvent) {
    const value: string = this.elementRef.nativeElement.value;
    if (event.key === '-') {
      if (!value && this.allowNegative) {
        // negative sign is allowed for first character
        return true;
      }
    }
    if (event.key === '.') {
      // only 1 dot should be allowed
      if (value.indexOf('.') == -1) {
        return true;
      }
    }
    // allow only digits to be pasted
    if (isNaN(+value)) {
      this.elementRef.nativeElement.value = '';
      return;
    }
    // allow only digits to be entered
    if (event.key === null || event.key === '' || isNaN(Number(event.key))) {
      return false;
    }
    // validation for decimal points upto certain digits
    const index = value.indexOf('.');
    if (index == -1) {
      return true;
    }
    const decimalsLength = value.length - index; // it will include the currently added digit
    if (decimalsLength > this.decimalUpto) {
      return false;
    }
    return true;
  }
}
