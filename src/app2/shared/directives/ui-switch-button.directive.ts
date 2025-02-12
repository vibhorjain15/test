import { Directive, ElementRef, Input } from '@angular/core';

@Directive({
  selector: '[UiSwitchButton]',
})
export class UiSwitchButtonDirective {
  @Input() title = ''
  constructor(private elementRef: ElementRef) {}

  ngAfterViewInit() {
    // Find the button element within the ui-switch component
    const buttonElement: HTMLElement | null =
      this.elementRef.nativeElement.querySelector('button');

    // Add the title attribute if the button element exists and does not already have a title
    if (buttonElement && !buttonElement.hasAttribute('title')) {
      buttonElement.setAttribute('title', this.title);
    }
  }
}
