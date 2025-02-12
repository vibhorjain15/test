import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { validateAllFormFields } from 'src/app2/modules/firm-settings/tags-modal/tags-modal.util';
import { RatingService } from 'src/app2/services/rating-definition/rating-defination.service';
import { IRatingScales } from 'src/app2/services/rating-definition/rating-definition.types';
import { uniqueValidator } from 'src/app2/services/rating-definition/rating-definition.utils';
import { ratingConstants } from 'src/app2/shared/constants/constant';
import { noWhitespaceValidator } from 'src/app2/shared/validators/no-white-space.validator';

@Component({
  selector: 'add-rating-scale',
  templateUrl: './add-rating-scale.component.html',
  styleUrls: ['./add-rating-scale.component.css'],
})
export class AddRatingScaleModal implements OnInit {
  @Input() editing_rating_scale: IRatingScales;
  @Input() allRatingScalesName: string[];

  rateScaleForm: FormGroup;
  isEdit: boolean = false;
  loading: boolean = false;
  ratingConstants = ratingConstants;
  scaleModes = [
    {
      id: ratingConstants.Absolute,
      name: 'Absolute',
      description: 'Use this to create rating scale',
    },
    {
      id: ratingConstants.ScoreBand,
      name: 'ScoreBand',
      description: 'Use this to set minimum and maximum score ranges',
    },
  ];
  scaleModeHelpText: string;
  constructor(private readonly RatingService: RatingService) {}

  ngOnInit() {
    if (this.editing_rating_scale) {
      this.isEdit = true;
      this.allRatingScalesName = this.allRatingScalesName.filter(
        (val) => val !== this.editing_rating_scale.name
      );
      this.rateScaleForm = new FormGroup({
        name: new FormControl(this.editing_rating_scale.name, [
          Validators.required,
          uniqueValidator(this.allRatingScalesName),
          noWhitespaceValidator,
        ]),
        scale_mode: new FormControl(this.editing_rating_scale.scale_mode),
        allow_decimal_score_bands: new FormControl(
          this.editing_rating_scale.allow_decimal_score_bands
        ),
      });
    } else {
      this.rateScaleForm = new FormGroup({
        name: new FormControl('', [
          Validators.required,
          uniqueValidator(this.allRatingScalesName),
          noWhitespaceValidator,
        ]),
        scale_mode: new FormControl(ratingConstants.Absolute),
        allow_decimal_score_bands: new FormControl(false),
      });
      this.onScaleModeChange(this.rateScaleForm.get('scale_mode').value);
    }
  }

  onScaleModeChange(value) {
    this.scaleModeHelpText = this.scaleModes.find(
      (x) => x.id === value
    ).description;
    if (value === ratingConstants.Absolute) {
      this.rateScaleForm.get('allow_decimal_score_bands').patchValue(false);
    }
  }

  save(callback) {
    validateAllFormFields(this.rateScaleForm);
    if (this.rateScaleForm.valid) {
      this.loading = true;
      const { scale_mode, name, allow_decimal_score_bands } =
        this.rateScaleForm.value;
      if (this.isEdit) {
        const params = {
          ...this.editing_rating_scale,
          name,
          allow_decimal_score_bands,
        };
        this.RatingService.updateRatingScale(
          params,
          () => {
            this.loading = false;
            callback();
          },
          () => {
            this.loading = false;
          }
        );
      } else {
        const params = {
          name,
          scale_mode,
          allow_decimal_score_bands,
          is_active: true,
        };
        this.RatingService.createRatingScale(
          params,
          () => {
            this.loading = false;
            callback();
          },
          () => {
            this.loading = false;
          }
        );
      }
    }
  }
}
