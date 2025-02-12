import { Directive, ElementRef, Input } from '@angular/core';
declare var $: any;

@Directive({
  selector: '[appDdScore]'
})
export class DdScoreDirective {
  @Input() score;
  @Input() showTotal;
  @Input() keepWatcherOn;
  @Input() total;
  score_class: any;

  constructor(
    private readonly elementRef: ElementRef) { }

  ngOnInit(): void {


    if (!this.score) {
      this.score_class = 'na-score';
    } else if (this.score < 10) {
      this.score_class = 'bad-score';
    } else if (10 <= this.score && this.score < 50) {
      this.score_class = 'ok-score';
    } else if (this.score >= 50) {
      this.score_class = 'good-score';
    }
    //this.elementRef.nativeElement.classList.add();
    let html = `<div class="dd-score-display from-dir ${this.score_class}">`;

    if (this.score) {
      html += `<strong> ${this.score} </strong><strong> % </strong> </div>`;
    } else {
      html += `N/A</div>`;
    }
    this.elementRef.nativeElement.innerHTML = html;
  }

}
