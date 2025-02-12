import { Directive, AfterViewInit, ElementRef } from '@angular/core';

@Directive({
  selector: 'accordion',
})
export class AccessibleAccordionDirective implements AfterViewInit {
  constructor(private el: ElementRef) {}

  ngAfterViewInit(): void {
    // Query only within the accordion component
    const tabs = this.el.nativeElement.querySelectorAll('div[role="tab"]');
    tabs.forEach((elem) => {
      if (elem) {
        elem.setAttribute('aria-hidden', 'true');
      }
    });
  }
}
