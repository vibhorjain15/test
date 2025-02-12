import { Directive, ElementRef, Input, OnInit } from '@angular/core';
import HtmlDiff from 'htmldiff-js';
import { DvSafeHtmlPipe } from '../pipes/dv-trust-html.pipe';

@Directive({
  selector: '[htmlDiff]',
})
export class HtmlDiffCompareDirective implements OnInit {
  @Input() current = '';
  @Input() previous = '';

  constructor(
    private readonly elementRef: ElementRef,
    private readonly dvSafeHtml: DvSafeHtmlPipe
  ) {}

  ngOnInit(): void {
    this.current = this.current ? this.current : '';
    this.previous = this.previous ? this.previous : '';
    this.render();
  }

  render() {
    if (this.current !== null && this.previous !== null) {
      let previousSanitizedOutput = this.dvSafeHtml.transform(this.previous)[
        'changingThisBreaksApplicationSecurity'
      ];
      let currentSanitizedOutput = this.dvSafeHtml.transform(this.current)[
        'changingThisBreaksApplicationSecurity'
      ];
      const output = HtmlDiff.execute(
        previousSanitizedOutput,
        currentSanitizedOutput
      );
      this.elementRef.nativeElement.innerHTML = output;
    }
  }
}
