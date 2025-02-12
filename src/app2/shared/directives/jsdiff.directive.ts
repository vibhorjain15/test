import { Directive, ElementRef, Input, OnInit } from '@angular/core';
import * as JsDiff from 'diff';

@Directive({
  selector: '[jsdiff]',
})
export class JsDiffDirective implements OnInit {
  @Input() current = '';
  @Input() previous = '';

  constructor(
    private readonly elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    this.current = this.current ? this.current : '';
    this.previous = this.previous ? this.previous : '';
    this.render();
  }

  render() {
    if (this.current != null && this.previous != null && this.current != this.previous) {
      let tokens: any;
      tokens = JsDiff.diffWordsWithSpace(this.previous, this.current);
      this.elementRef.nativeElement.innerHTML = '';
      tokens.forEach((token: { added?: any; removed?: any; value?: any }) => {
        let { value } = token;
        if (/^\n+$/.test(value)) {
          value = value.replace(/\n/g, ' \n');
        }
        if (token.added) {
          this.elementRef.nativeElement.innerHTML += `<ins>${value}</ins>`;
        } else if (token.removed) {
          this.elementRef.nativeElement.innerHTML += `<del>${value}</del>`;
        } else {
          this.elementRef.nativeElement.innerHTML += `<span>${value}</span>`;
        }
      });
    }
  }
}
