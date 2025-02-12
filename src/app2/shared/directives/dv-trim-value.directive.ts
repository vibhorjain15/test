import { Directive, HostListener } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[dvTrimValue]'
})
export class TrimValueAccessorDirective {

  constructor(private ngControl: NgControl) { }

  @HostListener('input', ['$event.target.value'])
  onInput(value: string): void {
    if (value.trim() === '') {
      this.ngControl.control.setValue('');
    }
  }
}
