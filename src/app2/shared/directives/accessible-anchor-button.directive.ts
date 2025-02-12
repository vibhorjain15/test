import { Directive, ElementRef, Renderer2 } from '@angular/core';

@Directive({
  selector: 'a[click]', // Targets all anchor tags with a click event
})
export class AccessibleAnchorButtonDirective {
  discernibleText: any;
  constructor(private el: ElementRef, private renderer: Renderer2) {
    this.checkAndApplyAccessibility();
  }

  private checkAndApplyAccessibility() {
    const element = this.el.nativeElement;

    // Check if the anchor tag has the 'clickable' directive/attribute
    if (element.hasAttribute('clickable')) {
      return; // Skip the accessibility logic if 'clickable' is present
    }

    const textContent = element.textContent?.trim();
    const hasAriaLabel = element.getAttribute('aria-label');
    const tooltip =
      element.getAttribute('tooltip') ||
      element.getAttribute('ng-reflect-tooltip') ||
      element.getAttribute('ng-reflect-tippy-tooltip');

    if (tooltip && !textContent && !hasAriaLabel) {
      this.renderer.setAttribute(element, 'aria-label', tooltip);
    }
    this.discernibleText = !!textContent || !!hasAriaLabel || !!tooltip;

    if (!this.discernibleText) {
      return; // skip if no discernible text found
    }

    // Check if the anchor tag does not have 'href', 'target', or 'role'
    if (
      !element.getAttribute('href') &&
      !element.getAttribute('target') &&
      !element.getAttribute('role')
    ) {
      // Add role="button"
      this.renderer.setAttribute(element, 'role', 'button');

      // Add tabindex="0"
      this.renderer.setAttribute(element, 'tabindex', '0');
    }
  }

  hasDiscernibleText(element: HTMLElement): boolean {
    const textContent = element.textContent?.trim();
    const hasAriaLabel = element.getAttribute('aria-label');
    const tooltip =
      element.getAttribute('tooltip') ||
      element.getAttribute('ng-reflect-tooltip') ||
      element.getAttribute('ng-reflect-tippy-tooltip');
    // Check if the element has either non-empty text content or an aria-label
    this.discernibleText = !!textContent || !!hasAriaLabel || !!tooltip;
    return this.discernibleText;
  }

  // // Optionally, handle 'Enter' key for keyboard accessibility
  // @HostListener('keydown.enter')
  // onEnterPress() {
  //   this.el.nativeElement.click();
  // }
}
