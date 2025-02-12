import { Directive, ElementRef, OnInit, HostListener } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[DvIntegerOnly]',
})
export class DvIntegerOnlyDirective implements OnInit {
  constructor(private el: ElementRef, private control: NgControl) {}

  ngOnInit(): void {}

  @HostListener('input', ['$event']) onInputChange(event) {
    const initalValue = this.el.nativeElement.value;
    this.el.nativeElement.value = initalValue.replace(/[^0-9\n]/g, '');
    this.control.control.setValue(this.el.nativeElement.value);
    if (initalValue !== this.el.nativeElement.value) {
      event.stopPropagation();
    }
  }
}
