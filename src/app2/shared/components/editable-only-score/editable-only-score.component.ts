import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { UtilsService } from 'src/app2/services/utils.service';
import { ColorTheme } from '../../themes/color.themes';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-editable-only-score',
  templateUrl: './editable-only-score.component.html',
  styleUrls: ['./editable-only-score.component.css'],
})
export class EditableOnlyScoreComponent implements OnInit {
  @Input() score: number;
  @Input() total: number;
  @Input() showTotal: boolean;
  @Input() ratingScale: any;
  @Input() naScaleObj: any;
  @Input() type: 'simple' | 'customFields' = 'simple';
  @Input() readonly: boolean;
  @Input() iconReadonly: boolean;
  @Input() isNARating = false;
  @Input() id: number = null; // useful to access the component with viewchildren if in loop
  @Output() onChange = new EventEmitter();
  @Output() onIconClick = new EventEmitter();
  correctScore: number;
  maxScore: number;
  isScoreInvalid: boolean;
  score_class: any;
  font_color: any;
  score_tooltip: string;
  private scoreChanged$ = new Subject<number>();
  constructor(
    private readonly Utils: UtilsService,
    private readonly toast: ToastrService
  ) {}

  ngOnInit(): void {
    this.correctScore = this.score;
    this.maxScore = 100;
    this.isScoreInvalid = false;
    this.setValues();
    this.scoreChanged$.pipe(debounceTime(500)).subscribe((value: number) => {
      this.onChange.emit(value);
    });
  }

  setValues() {
    let font_color: any, score_class: any, score_tooltip: string;
    if (this.isNARating) {
      score_class = this.naScaleObj.color_code;
      font_color = this.Utils.pickTextColorBasedOnBgColorAdvanced(score_class);
      score_tooltip = '';
    } else if (this.score === null || this.score === undefined) {
      score_class = ColorTheme.white;
      font_color = this.Utils.pickTextColorBasedOnBgColorAdvanced(score_class);
      score_tooltip = '';
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

    this.score_class = score_class;
    this.font_color = font_color;
    this.score_tooltip = score_tooltip;
    this.showTotal = this.total && this.showTotal;
  }

  onScoreChanged() {
    if (this.score <= this.maxScore) {
      this.isScoreInvalid = false;
      if (!this.readonly) {
        this.scoreChanged$.next(this.score);
      }
      this.setValues();
      this.correctScore = this.score;
    } else {
      this.isScoreInvalid = true;
      this.toast.error('Score should be less than or equal to 100');
      this.score = this.correctScore;
    }
  }

  // call from parent component before saving the value
  isScoreValid() {
    return !this.isScoreInvalid;
  }

  handleIconClick(event) {
    if (this.iconReadonly) {
      return;
    }
    event.stopPropagation();
    this.onIconClick.emit();
  }

  resetScore() {
    this.score = this.correctScore = null;
    this.setValues();
  }
}
