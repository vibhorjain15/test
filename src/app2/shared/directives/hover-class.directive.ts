import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[hoverClass]',
})
export class HoverClassDirective {
  constructor(public elementRef: ElementRef) {}
  @Input() hoverClass: string;

  @HostListener('mouseenter') onMouseEnter() {
    this.elementRef.nativeElement.classList.add(this.hoverClass);
  }

  @HostListener('mouseleave') onMouseLeave() {
    this.elementRef.nativeElement.classList.remove(this.hoverClass);
  }
}
