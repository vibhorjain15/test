import {
  Directive,
  ElementRef,
  Renderer2,
  AfterViewInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';

@Directive({
  selector: 'a[href], [role="link"]', // Apply to both a[href] and any element with role="link"
})
export class externalLinkDirective implements AfterViewInit, OnChanges {
  constructor(
    private readonly elementRef: ElementRef,
    private renderer: Renderer2
  ) {}

  ngAfterViewInit() {
    this.addAccessibilitySupport();
  }

  ngOnChanges(changes: SimpleChanges) {
    // Only call the logic when relevant changes are detected
    if (changes['href'] || changes['role'] || changes['target']) {
      this.addAccessibilitySupport();
    }
  }

  private addAccessibilitySupport() {
    const element = this.elementRef.nativeElement;
    const hasHref = !!element.getAttribute('href'); // Check the native href directly
    const hasRoleLink = element.getAttribute('role') === 'link';
    const hasTargetBlank = element.getAttribute('target') === '_blank';
    const isLinkLike = hasHref || hasRoleLink;

    // Ensure we only apply accessibility text for link-like elements
    if (isLinkLike && hasTargetBlank) {
      // Remove any existing span to avoid duplication
      const existingSpan = element.querySelector('span.sr-only');
      if (existingSpan) {
        this.renderer.removeChild(element, existingSpan);
      }

      // Create and append new span element with accessibility text
      const spanElement = this.renderer.createElement('span');
      this.renderer.addClass(spanElement, 'sr-only');
      const text = this.renderer.createText('(opens in a new window)');
      this.renderer.appendChild(spanElement, text);
      this.renderer.appendChild(element, spanElement);
    }
  }
}
