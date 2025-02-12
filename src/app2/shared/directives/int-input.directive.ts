import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[appIntInput]',
})
export class IntInputDirective {
  constructor(private readonly elementRef: ElementRef) {}

  @HostListener('keypress', ['$event'])
  onKeyPress(event: KeyboardEvent) {
    const value = this.elementRef.nativeElement.value;
    if (event.key === '-') {
      if (!value) {
        // negative sign is allowed for first character
        return true;
      }
    }
    // allow only digits to be entered
    if (event.key === null || event.key === '' || isNaN(Number(event.key))) {
      return false;
    }
    return true;
  }

  @HostListener('input', ['$event'])
  @HostListener('paste', ['$event'])
  @HostListener('keyup')
  onKeyUp() {
    // to add commas to the int value
    let value = this.elementRef.nativeElement.value;
    if (!value) {
      return;
    }
    if (value.length === 1 && value[0] === '-') {
      return;
    }
    // first remove all commas from existing value
    value = value.replace(/\,/g, '');
    if (isNaN(+value)) {
      this.elementRef.nativeElement.value = '';
      return;
    }
    const num: number =
      value[0] === '-' ? +value.slice(1, value.length) : +value;
    // add commas to int value
    const stringWithCommas =
      (value[0] === '-' ? '-' : '') + num.toLocaleString();
    this.elementRef.nativeElement.value = stringWithCommas;
  }
}
