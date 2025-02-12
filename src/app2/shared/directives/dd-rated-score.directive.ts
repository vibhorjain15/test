import { Directive, ElementRef, Input, OnInit } from '@angular/core';
import { UtilsService } from 'src/app2/services/utils.service';
import { ratingConstants } from 'src/app2/shared/constants/constant';
import { scaleLinear } from 'd3';
@Directive({
  selector: '[appDdRatedScore]',
})
export class DdRatedScoreDirective implements OnInit {
  @Input() score;
  @Input() total;
  @Input() ratingScale;
  @Input() naValue;
  @Input() ratingValue;
  @Input() useRatingValue;
  @Input() keepWatcherOn;
  @Input() showTotal = false;
  scaleArray: any = [];

  constructor(
    private readonly Utils: UtilsService,
    private readonly elementRef: ElementRef
  ) {}
  ngOnInit(): void {
    this.prepareData();
  }
  prepareData() {
    var colorScale,
      colorScheme,
      font_color,
      maxScore,
      scaleValue,
      score_class,
      score_tooltip;
    this.ratingScale = this.ratingScale ? this.ratingScale : [];
    if (
      !this.score ||
      (this.useRatingValue && this.ratingValue === ratingConstants.naValue)
    ) {
      score_class = this.naValue.color_code;
      font_color = this.Utils.pickTextColorBasedOnBgColorAdvanced(
        this.naValue.color_code
      );
      score_tooltip = 'Score not assigned';
    } else if (this.useRatingValue) {
      if (this.ratingScale.length === 1) {
        maxScore = 5;
      } else {
        maxScore = this.ratingScale.length;
      }

      for (
        var i = 1;
        1 <= maxScore ? i <= maxScore : i >= maxScore;
        1 <= maxScore ? i++ : i--
      ) {
        this.scaleArray.push(i);
      }

      colorScheme = this.ratingScale.map((item) => item.color_code);
      colorScale = scaleLinear().domain(this.scaleArray).range(colorScheme);
      let scale = this.Utils.getColorCodeFromDomain(
        this.ratingValue,
        colorScale
      );
      scaleValue = this.ratingScale.find(
        (item) => item.value == Math.ceil(this.ratingValue)
      );
      if (scale) {
        score_class = scale['background-color'];
        font_color = scale.color;
      }
      if (scaleValue) {
        score_tooltip = scaleValue.name;
      }
    } else {
      this.ratingScale.forEach((scale) => {
        if (
          this.score >= scale.range_min_value &&
          this.score <= scale.range_max_value
        ) {
          score_class = scale.color_code;
          font_color = this.Utils.pickTextColorBasedOnBgColorAdvanced(
            scale.color_code
          );
          score_tooltip = scale.name;
        }
      });
    }
    const nativeElement = this.elementRef.nativeElement;
    const data = this.score && this.score > -1
      ? `<div class="dd-score-display from-dir cursor-default"
    tooltip="${score_tooltip}"
    style="background-color: ${score_class};color: ${font_color}">
    <span>${this.score} ${this.showTotal ?'<small>/' + this.total + '</small>' : '' }</span>
  </div>`
      : `<div class="dd-score-display from-dir cursor-default"
  tooltip="${score_tooltip}"
  style="background-color: white;color: black">
  <span>N/A</span>
</div>`;
    nativeElement.innerHTML = data;
  }
}
