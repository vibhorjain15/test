import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[autoSelectAll]',
})
export class AutoSelectAllDirective {
  constructor(private el: ElementRef) {}

  ngOnInit() {}

  @HostListener('click')
  selectText() {
    this.el.nativeElement.select();
  }
}
