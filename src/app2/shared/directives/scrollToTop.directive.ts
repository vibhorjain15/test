import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: '[scrollToTop]',
})
export class ScrollToTopDirective {
  constructor() {}

  @HostListener('click', ['$event']) onClick() {
    window.scroll({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  }
}
