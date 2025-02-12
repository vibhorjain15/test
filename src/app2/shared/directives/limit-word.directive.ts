import { Directive, ElementRef, Input, OnInit } from '@angular/core';
import { DvSafeHtmlPipe } from '../pipes/dv-trust-html.pipe';

@Directive({
  selector: '[appLimitWord]',
})
export class LimitWordDirective implements OnInit {
  @Input() charLimit: any;
  @Input() appLimitWord: any;

  constructor(
    private element: ElementRef,
    private dvSafeHtml: DvSafeHtmlPipe
  ) {}

  ngOnInit(): void {
    const nativeElement = this.element.nativeElement;
    if (!this.appLimitWord) {
      return;
    }
    this.charLimit = this.charLimit ? parseInt(this.charLimit) : null;
    const safeHtml = this.dvSafeHtml.transform(this.appLimitWord)[
      'changingThisBreaksApplicationSecurity'
    ];
    if (this.appLimitWord.length > this.charLimit) {
      nativeElement.innerHTML = safeHtml.slice(0, this.charLimit - 3) + '...';
      return nativeElement.setAttribute('title', this.appLimitWord);
    } else {
      return (nativeElement.innerHTML = safeHtml);
    }
  }
}
