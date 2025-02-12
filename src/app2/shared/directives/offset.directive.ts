import { Directive, ElementRef, Input, OnInit, Renderer2 } from '@angular/core';

@Directive({
  selector: '[offset]',
})
export class OffsetDirective implements OnInit {
  @Input() offset?;
  @Input() offsetType? = 'md';

  constructor(
    private readonly renderer: Renderer2,
    private readonly elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    this.renderer.addClass(
      this.elementRef.nativeElement,
      `col-${this.offsetType}-offset-${this.offset}`
    );
  }
}
