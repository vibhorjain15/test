import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { IRatingScales } from 'src/app2/services/rating-definition/rating-definition.types';
import {
  RatingCalculationTypes,
  ratingConstants,
} from '../../constants/constant';
import { RatingService } from 'src/app2/services/rating-definition/rating-defination.service';
import { finalize, take, tap } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { Select, Store } from '@ngxs/store';
import { UserState } from 'src/app2/store/user/user.state';
import { GetRatingCalculationTypes } from 'src/app2/store/user/user.action';

@Component({
  selector: 'app-scoring-engine-scale-selection',
  templateUrl: './scoring-engine-scale-selection.component.html',
  styleUrls: ['./scoring-engine-scale-selection.component.css'],
})
export class ScoringEngineScaleSelectionComponent implements OnInit {
  @Input() title: string;
  @Input() titleTooltip: string;
  @Input() ratingScheme: any;
  @Input() existingCalculationType: number;
  @Input() existingSecondaryScaleId: number;
  @Input() isProjectLevel: boolean = false;
  @Input() categoryLevel: number = null;
  scoreEngineForm: FormGroup;
  ratingCalculationTypes: any[];
  ratingScales: IRatingScales[];
  filteredRatingScales: IRatingScales[];
  loading: boolean = true;
  saving: boolean;
  primaryRatingScale: IRatingScales;
  @Select(UserState.getRatingCalculationTypes) getRatingCalculationTypes;
  constructor(
    private readonly RatingService: RatingService,
    private readonly toaster: ToastrService,
    private readonly store: Store
  ) {}

  ngOnInit(): void {
    this.createForm();
    this.getCalculationTypeData();
    this.getScaleData();
  }

  createForm() {
    this.scoreEngineForm = new FormGroup({
      rating_calculation_type: new FormControl('', Validators.required),
      secondary_rating_scale_id: new FormControl('', Validators.required),
    });
  }

  getCalculationTypeData() {
    this.getRatingCalculationTypes
      .pipe(
        take(2),
        tap((types: any) => {
          if (!types?.length) {
            this.store.dispatch(new GetRatingCalculationTypes());
          }
        })
      )
      .subscribe((types: any) => {
        if (types?.length) {
          this.ratingCalculationTypes = types;
          this.scoreEngineForm
            .get('rating_calculation_type')
            .patchValue(
              this.existingCalculationType ??
                RatingCalculationTypes.WeightedAverage
            );
          if (this.scoreEngineForm.get('secondary_rating_scale_id').value) {
            this.filterRatingScales(
              this.scoreEngineForm.get('rating_calculation_type').value
            );
          }
          this.loading = false;
        }
      });
  }

  getScaleData() {
    this.RatingService.getAllRatingScales((response: IRatingScales[]) => {
      this.ratingScales = response;
      this.filteredRatingScales = [...this.ratingScales];
      this.primaryRatingScale = this.ratingScales.find(
        (x) => x.id === this.ratingScheme.rating_scale_id
      );
      this.scoreEngineForm
        .get('secondary_rating_scale_id')
        .patchValue(
          this.existingSecondaryScaleId ?? this.primaryRatingScale.id
        );
      if (this.scoreEngineForm.get('rating_calculation_type').value) {
        this.filterRatingScales(
          this.scoreEngineForm.get('rating_calculation_type').value
        );
      }
      this.loading = false;
    });
  }

  filterRatingScales(calculationType: string) {
    if (
      calculationType === RatingCalculationTypes.CustomSimpleSum ||
      calculationType === RatingCalculationTypes.SimpleSum
    ) {
      // user should be able to select only scoreband type of scale for simple sum
      this.filteredRatingScales = this.ratingScales.filter(
        (x) => x.scale_mode === ratingConstants.ScoreBand
      );
    } else {
      this.filteredRatingScales = [...this.ratingScales];
    }
    const selectedScaleId = this.scoreEngineForm.get(
      'secondary_rating_scale_id'
    ).value;
    if (
      selectedScaleId &&
      !this.filteredRatingScales.find((x) => x.id === selectedScaleId)
    ) {
      // selected scale is no longer valid so clear form value
      this.scoreEngineForm.get('secondary_rating_scale_id').patchValue(null);
    }
  }

  isFormValid(): boolean {
    if (
      !this.scoreEngineForm.valid ||
      (!this.isProjectLevel && !this.categoryLevel) // cetegory level should be provided except for project level
    ) {
      this.scoreEngineForm.markAllAsTouched();
      return false;
    }
    return true;
  }

  save(callback) {
    if (!this.isFormValid()) {
      return false;
    }
    this.saving = true;
    const payload = this.scoreEngineForm.value;
    payload.rating_scheme_id = this.ratingScheme.id;
    payload.category_level = this.categoryLevel;
    payload.save_project_level_data = this.isProjectLevel;
    this.RatingService.saveRatingCalculationTypeAndScale(payload)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe(() => {
        if (this.isProjectLevel) {
          // update the existing object to avoid making Get API call
          this.ratingScheme.project_level_rating_calculation_type =
            payload.rating_calculation_type;
          this.ratingScheme.project_level_rating_scale_id =
            payload.secondary_rating_scale_id;
        }
        this.toaster.success('Rating/Score definition saved successfully');
        if (callback) {
          callback();
        }
      });
  }
}
