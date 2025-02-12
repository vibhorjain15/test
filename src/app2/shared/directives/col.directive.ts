import { Directive, ElementRef, Input, Renderer2 } from '@angular/core';

@Directive({
  selector: '[col]',
})
export class ColDirective {
  @Input() col: number;
  @Input() colType?: string = 'md';
  constructor(
    private readonly renderer: Renderer2,
    private readonly elementRef: ElementRef
  ) {}
  ngOnInit(): void {
    this.renderer.addClass(
      this.elementRef.nativeElement,
      `col-${this.colType}-${this.col}`
    );
  }
}
