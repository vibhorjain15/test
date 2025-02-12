import { Directive, ElementRef, Input, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appButton]',
})
export class ButtonDirective {
  @Input() type? = '';
  @Input() btnType? = '';
  @Input() size? = '';
  @Input() block? = false;

  constructor(
    private readonly renderer: Renderer2,
    private readonly elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    this.renderer.addClass(this.elementRef.nativeElement, `btn`);
    if (this.size) {
      this.renderer.addClass(this.elementRef.nativeElement, `btn-${this.size}`);
    }
    if (this.block) {
      this.renderer.addClass(this.elementRef.nativeElement, `btn-block`);
    }
    if (this.type) {
      this.renderer.setAttribute(
        this.elementRef.nativeElement,
        'type',
        this.type || 'button'
      );
      if (this.type === 'submit') {
        this.renderer.addClass(this.elementRef.nativeElement, `btn-primary`);
      }
    }
    if (this.btnType && this.btnType !== 'link') {
      this.renderer.addClass(
        this.elementRef.nativeElement,
        `btn-${this.btnType}`
      );
    }
  }
}
