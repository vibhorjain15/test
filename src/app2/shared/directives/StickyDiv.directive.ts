import { Directive, ElementRef, Input, OnInit, Renderer2 } from '@angular/core';
@Directive({
  selector: '[StickyDiv]',
})
export class StickyDivDirective implements OnInit {
  @Input() top = '42px';

  constructor(private el: ElementRef, private readonly renderer: Renderer2) {}
  ngOnInit(): void {
    this.renderer.addClass(this.el.nativeElement, `dv-sticky-panel`);
    this.el.nativeElement.style.top = this.top; // Fixed top calculated from dv navigation menu
  }
}
