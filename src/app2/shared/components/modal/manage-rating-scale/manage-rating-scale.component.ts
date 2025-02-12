import { Component, Input, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { validateAllFormFields } from 'src/app2/modules/firm-settings/tags-modal/tags-modal.util';
import { RatingService } from 'src/app2/services/rating-definition/rating-defination.service';
import {
  IRatingDefCategories,
  IRatingScales,
  IRatingScheme,
  RatingScaleDefinitions,
} from 'src/app2/services/rating-definition/rating-definition.types';
import { ratingConstants } from 'src/app2/shared/constants/constant';

@Component({
  selector: 'manage-rating-scale',
  templateUrl: './manage-rating-scale.component.html',
  styleUrls: ['./manage-rating-scale.component.css'],
})
export class ManageRatingScaleModal implements OnInit {
  @Input() category: IRatingDefCategories;
  @Input() selectedRating: IRatingScheme;
  ratingConstants = ratingConstants;
  manRatingScaleForm: any;
  defaultVersion: number;
  ratingDefList: RatingScaleDefinitions[] = [];
  loading_scale: boolean = false;
  loading: boolean = false;
  currentRatingScaleObj: IRatingScales;
  constructor(private readonly RatingService: RatingService) {}

  ngOnInit() {
    this.defaultVersion = 0;
    this.loading_scale = true;
    this.manRatingScaleForm = new FormGroup({
      def: new FormArray([]),
    });
    this.RatingService.getRatingScaleDefinitions(
      this.category.rating_scale_id,
      this.defaultVersion,
      (response: RatingScaleDefinitions[]) => {
        this.loading_scale = false;
        this.ratingDefList = response;
        response.map((val, index) => {
          this.manRatingScaleForm.get('def').push(
            new FormGroup({
              name: new FormControl({ value: val.name, disabled: true }),
              range_min_value: new FormControl({
                value: val.range_min_value,
                disabled: index === 0 || index === 1,
              }),
              range_max_value: new FormControl({
                value: val.range_max_value,
                disabled: index === 0 || index === 1,
              }),
              color_code: new FormControl({
                value: val.color_code,
                disabled: true,
              }),
            })
          );
        });
      },
      () => {
        this.loading_scale = true;
      }
    );
    this.RatingService.getAllRatingScales((response: IRatingScales[]) => {
      this.currentRatingScaleObj = response.find(
        (x) => x.id === this.category.rating_scale_id
      );
    });
  }

  save(callback) {
    let localVal: any[] = [];
    this.manRatingScaleForm.get('def').controls.map((val, index) => {
      localVal.push(val.value);
      validateAllFormFields(val);
    });
    this.setScaleValidity(localVal);
    if (this.manRatingScaleForm.valid) {
      this.loading = true;
      const form = this.manRatingScaleForm.get('def').controls;
      this.ratingDefList.map((val, index) => {
        if (index > 1) {
          val.range_max_value = form[index].controls.range_max_value.value;
          val.range_min_value = form[index].controls.range_min_value.value;
        }
      });
      if (
        this.category.rating_scale_id === this.selectedRating.rating_scale_id
      ) {
        this.RatingService.updateDuplicateScaleDefinitions(
          this.category.id,
          this.category.rating_scale_id,
          this.ratingDefList,
          () => {
            this.loading = false;
            callback();
          },
          () => {
            this.loading = false;
          }
        );
      } else {
        this.RatingService.updateRatingScaleDefinitions(
          this.category.rating_scale_id,
          this.selectedRating.rating_scale_version,
          this.ratingDefList,
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

  setScaleValidity(val) {
    let localVal: any[] = val;
    for (let index = 2; index < localVal.length; index++) {
      let minimumError;
      let maxError;
      if (index === 2) {
        minimumError =
          localVal[index].range_min_value !== 0
            ? 'Range should start with zero'
            : '';
        maxError =
          localVal[index].range_max_value > 100
            ? 'Maximum range should be 100'
            : '';
      }
      if (index > 2) {
        minimumError =
          localVal[index].range_min_value !==
          Number(
            (
              localVal[index - 1].range_max_value +
              (this.currentRatingScaleObj.allow_decimal_score_bands ? 0.01 : 1)
            ).toFixed(2)
          )
            ? `Minimum range should be ${
                this.currentRatingScaleObj.allow_decimal_score_bands
                  ? '0.01'
                  : 'one'
              } more than the last scale's max range`
            : '';
        maxError =
          localVal[index].range_max_value > 100
            ? 'Maximum range should be 100'
            : '';
        if (!maxError && localVal.length - 1 === index) {
          maxError =
            localVal[index].range_max_value !== 100
              ? 'Maximum range should be 100'
              : '';
        }
      }

      if (!minimumError) {
        this.manRatingScaleForm
          .get('def')
          .controls[index].get('range_min_value')
          .clearValidators();
      } else {
        this.manRatingScaleForm
          .get('def')
          .controls[index].get('range_min_value')
          .setValidators([
            () => {
              return { minError: `${minimumError}` };
            },
          ]);
      }

      if (!maxError) {
        this.manRatingScaleForm
          .get('def')
          .controls[index].get('range_max_value')
          .clearValidators();
      } else {
        this.manRatingScaleForm
          .get('def')
          .controls[index].get('range_max_value')
          .setValidators([
            () => {
              return { maxError: `${maxError}` };
            },
          ]);
      }

      this.manRatingScaleForm
        .get('def')
        .controls[index].get('range_max_value')
        .updateValueAndValidity();
      this.manRatingScaleForm
        .get('def')
        .controls[index].get('range_min_value')
        .updateValueAndValidity();
    }
  }
}
