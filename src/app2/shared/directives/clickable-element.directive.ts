import {
  AfterViewInit,
  Directive,
  ElementRef,
  HostListener,
} from '@angular/core';

@Directive({
  selector: '[clickable]',
})
export class ClickableDirective implements AfterViewInit {
  constructor(private el: ElementRef) {}

  ngAfterViewInit(): void {
    this.el.nativeElement.setAttribute('tabindex', '0');
    this.el.nativeElement.setAttribute('role', 'button'); // adding role button if click event is present
    const tooltip =
      this.el.nativeElement.getAttribute('tooltip') ||
      this.el.nativeElement.getAttribute('ng-reflect-tooltip') ||
      this.el.nativeElement.getAttribute('ng-reflect-tippy-tooltip');
    const ariaLabel = this.el.nativeElement.getAttribute('aria-label');
    this.el.nativeElement.setAttribute('aria-label', ariaLabel || tooltip);
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.el.nativeElement.click();
    }
  }
}
