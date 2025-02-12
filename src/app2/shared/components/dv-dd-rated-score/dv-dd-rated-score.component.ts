import {
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { UtilsService } from 'src/app2/services/utils.service';
import { ratingConstants } from '../../constants/constant';
import * as d3 from 'd3';

@Component({
  selector: 'dv-dd-rated-score',
  templateUrl: './dv-dd-rated-score.component.html',
})
export class DDRatedScoreComponent implements OnInit {
  @Input() score;
  @Input() keepWatcherOn;
  @Input() ratingScale;
  @Input() naValue;
  @Input() total;
  @Input() showTotal;
  @Input() ratingValue;
  @Input() useRatingValue;

  scope: any = {};

  constructor(private readonly utils: UtilsService) {}

  ngOnInit() {
    this.updating(
      this.score,
      this.total,
      this.showTotal,
      this.ratingScale,
      this.naValue,
      this.ratingValue,
      this.useRatingValue
    );
  }

  updating(
    score: number,
    total: any,
    show_total: any,
    ratingScale,
    naValue: { color_code: any },
    ratingValue: any,
    useRatingValue: any
  ) {
    let font_color: any, score_class: any, score_tooltip: string;
    if (
      score === null ||
      score === undefined ||
      (useRatingValue && ratingValue === ratingConstants.naValue)
    ) {
      score_class = naValue.color_code;
      font_color = this.utils.pickTextColorBasedOnBgColorAdvanced(
        naValue.color_code
      );
      score_tooltip = 'Score not assigned';
    } else if (useRatingValue) {
      let maxScore: number;
      if (ratingScale?.length === 1) {
        maxScore = 5;
      } else {
        maxScore = ratingScale?.length;
      }
      const scaleArray = [...Array(maxScore + 1).keys()];
      scaleArray.splice(0, 1);
      const colorScheme = ratingScale.map((val) => val['color_code']);
      const colorScale = d3.scaleLinear().domain(scaleArray).range(colorScheme);

      const scale = this.utils.getColorCodeFromDomain(ratingValue, colorScale);
      const scaleValue = ratingScale.find(
        (val) => val.value === Math.ceil(ratingValue)
      );
      if (scaleValue && scale) {
        score_class = scale['background-color'];
        font_color = scale.color;
        score_tooltip = scaleValue.name;
      }
    } else {
      ratingScale.forEach(
        (scale: {
          range_min_value: number;
          range_max_value: number;
          color_code: any;
          name: any;
        }) => {
          if (
            score >= scale.range_min_value &&
            score <= scale.range_max_value
          ) {
            score_class = scale.color_code;
            font_color = this.utils.pickTextColorBasedOnBgColorAdvanced(
              scale.color_code
            );
            return (score_tooltip = scale.name);
          }
        }
      );
    }

    this.scope.score = score;
    this.scope.score_class = score_class;
    this.scope.font_color = font_color;
    this.scope.score_tooltip = score_tooltip;
    this.scope.total = total;
    this.scope.show_total = total && show_total;
  }
}
