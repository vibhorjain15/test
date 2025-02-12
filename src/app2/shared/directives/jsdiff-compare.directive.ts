import { Directive, ElementRef, Input, OnInit } from '@angular/core';
import * as JsDiff from 'diff';

@Directive({
  selector: '[jsdiff-compare]',
})
export class JsDiffCompareDirective implements OnInit {
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

  editDistance(s1, s2) {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();
    const costs = new Array();
    let i = 0;
    while (i <= s1.length) {
      let lastValue = i;
      let j = 0;
      while (j <= s2.length) {
        if (i === 0) {
          costs[j] = j;
        } else {
          if (j > 0) {
            let newValue = costs[j - 1];
            if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
              newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
            }
            costs[j - 1] = lastValue;
            lastValue = newValue;
          }
        }
        j++;
      }
      if (i > 0) {
        costs[s2.length] = lastValue;
      }
      i++;
    }
    return costs[s2.length];
  }

  similarity(s1: { length: number }, s2: { length: number }) {
    let longer = s1;
    let shorter = s2;
    if (s1.length < s2.length) {
      longer = s2;
      shorter = s1;
    }
    const longerLength: any = longer.length;
    if (longerLength === 0) {
      return 1.0;
    }
    return (
      (longerLength - this.editDistance(longer, shorter)) /
      parseFloat(longerLength)
    );
  }

  render() {
    if (this.current != null && this.previous != null) {
      let tokens: any;
      const percentageOfSimilarity =
        Math.round(this.similarity(this.previous, this.current) * 10000) / 100;
      if (percentageOfSimilarity > 70) {
        tokens = JsDiff.diffWordsWithSpace(this.previous, this.current);
      } else {
        tokens = JsDiff.diffWordsWithSpace(this.previous, this.current);
      }
      tokens.forEach((token: { added?: any; removed?: any; value?: any }) => {
        let { value } = token;
        if (/^\n+$/.test(value)) {
          value = value.replace(/\n/g, ' \n');
        }
        if (token.added) {
          return (this.elementRef.nativeElement.innerHTML += `<ins>${value}</ins>`);
        } else if (token.removed) {
          return (this.elementRef.nativeElement.innerHTML += `<del>${value}</del>`);
        } else {
          return (this.elementRef.nativeElement.innerHTML += `<span>${value}</span>`);
        }
      });
    }
  }
}
