import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { RatingService } from 'src/app2/services/rating-definition/rating-defination.service';
import {
  IRatingDefCategories,
  IRatingScheme,
  ISelectedCategory,
} from 'src/app2/services/rating-definition/rating-definition.types';
import { uniqueValidator } from 'src/app2/services/rating-definition/rating-definition.utils';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import * as c3 from 'c3';
import { ScoringEngineScaleSelectionComponent } from '../../scoring-engine-scale-selection/scoring-engine-scale-selection.component';
import { Subscription } from 'rxjs';
import { errorMessageMap, Regex } from 'src/app2/shared/constants/constant';
import { noHtmlValidator, noWhitespaceValidator } from 'src/app2/shared/validators/no-white-space.validator';
import { UtilsService } from 'src/app2/services/utils.service';

@Component({
  selector: 'manage-risk-rating-categories',
  templateUrl: './manage-risk-rating-categories.component.html',
})
export class ManageRiskRatingModal implements OnInit, OnDestroy {
  @Input() category_level: number;
  @Input() rating_scheme: IRatingScheme;
  @Input() category_type: string;
  @Input() ratingList: Partial<IRatingDefCategories>[];
  @Input() ratingSubtype: Partial<IRatingDefCategories>[];
  @Input() parent: ISelectedCategory;
  @Input() parentCallback: any;
  piechartConfig;
  precision: number = 0.04000000000000625; // Static value which acts like a threshold for rounding error
  maxWeightage: number;
  loading: boolean = false;
  chart;
  averageWeight: number;
  labelCat = '';
  categoryLabel: string;
  showScoreEngineSelection: boolean = false;
  @ViewChild('scoreEngineSelection')
  scoreEngineSelectionComponent: ScoringEngineScaleSelectionComponent;
  ratingsForm: FormArray;
  weigh_categories_equally: boolean;
  activeCount: number = 0;
  subscription: Subscription;
  unAllocatedWeight: number;
  catMap = {
    Subcategory: 'Subcategories',
    Category: 'Categories',
    Rating: 'Ratings',
  };
  ZERO_TO_HUNDERED_REGEX = /^\d{0,2}\.$|^\d{0,2}\.[0-9]+$|^\d{1,2}$|^100$/;
  errorMessageMap = errorMessageMap;
  constructor(
    private readonly SweetAlert: SweetAlertService,
    private readonly RatingService: RatingService,
    private readonly utils: UtilsService
  ) {}

  ngOnInit() {
    this.ratingSubtype = JSON.parse(JSON.stringify(this.ratingSubtype));
    this.maxWeightage = !this.parent
      ? Number.POSITIVE_INFINITY
      : this.parent.weightage;
    this.pieChartConfig();
    this.categoryLabel = this.category_type;
    this.labelCat = this.category_type;
    this.category_type = this.catMap[this.category_type];
    this.initializeForm();
    this.checkValidityForScoreEngineSelection();
    this.unAllocatedWeight = this.getUnallocatedWeightage();
  }

  ngAfterViewInit() {
    this.chart = c3.generate({
      ...this.piechartConfig,
    });
    let col = this.ratingsForm
      .getRawValue()
      .map((val) => [this.utils.extractTextFromHTML(val.name), val.weightage]);
    this.pieChartLoad(col);
    this.subscribeFormValueChangesForChart();
  }

  initializeForm() {
    this.ratingsForm = new FormArray([]);
    if (this.ratingSubtype?.length) {
      this.ratingSubtype.forEach((def) => {
        this.addDefinitionToForm(def);
      });
    } else {
      this.addDefinitionToForm();
    }
  }

  addDefinitionToForm(definition = null) {
    this.ratingsForm.push(
      new FormGroup({
        id: new FormControl(definition?.id),
        name: new FormControl(definition?.name, [
          Validators.required,
          Validators.pattern(Regex.avoidFirstSplCharacter),
          uniqueValidator(this.ratingsForm.value.map((d) => d.name)),
          noWhitespaceValidator,
          noHtmlValidator
        ]),
        weightage: new FormControl(definition?.weightage, [
          Validators.required,
          Validators.pattern(this.ZERO_TO_HUNDERED_REGEX),
          noWhitespaceValidator,
        ]),
        description: new FormControl(
          definition?.description,
          Validators.maxLength(200)
        ),
        is_active: new FormControl(true),
      })
    );
    this.activeCount++;
    if (this.weigh_categories_equally) {
      this.weighCategoriesEqually();
    }
  }

  removeDefinition(index) {
    const def: FormGroup = this.ratingsForm.controls[index] as FormGroup;
    if (!def.get('id').value) {
      // this definition is not previously saved so directly remove from the array
      this.removeDefinitionFromForm(index);
    } else {
      // this definition is previously saved so show sweetalert and make it inactive and remove all the validators
      this.confirmAndMakeDefinitionInactive(def);
    }
  }

  removeDefinitionFromForm(index) {
    this.ratingsForm.removeAt(index);
    this.activeCount--;
    if (this.weigh_categories_equally) {
      this.weighCategoriesEqually();
    }
  }

  confirmAndMakeDefinitionInactive(def: FormGroup) {
    let message = '';
    if (this.category_level === 1)
      message =
        'All the subcategories and ratings under this category will be lost';
    else if (this.category_level === 2)
      message = 'All the ratings under this subcategory will be lost';
    this.SweetAlert.confirm({
      title: 'Are you sure you want to remove this item?',
      text: message,
      preConfirm: () => {
        def.get('is_active').patchValue(false);
        def.get('name').clearValidators();
        def.get('name').updateValueAndValidity();
        if (!def.get('weightage').valid) {
          // this is to avoid backend error in case of unexpected user input
          def.get('weightage').patchValue(0);
        }
        def.get('weightage').clearValidators();
        def.get('weightage').updateValueAndValidity();
        this.activeCount--;
        if (this.weigh_categories_equally) {
          this.weighCategoriesEqually();
        }
      },
    });
  }

  checkValidityForScoreEngineSelection() {
    if (
      this.rating_scheme.source?.toLowerCase() === 'user' || // manual rating scheme
      this.rating_scheme.is_system || // system level scheme
      this.category_level === 3 || // question level as we don't show at last level
      !this.ratingSubtype?.length // if there are no definitions
    ) {
      this.showScoreEngineSelection = false;
    } else if (this.category_level === 1) {
      this.showScoreEngineSelection = true;
    } else if (
      this.category_level === 2 &&
      this.rating_scheme.rating_level?.toLowerCase() === 'question'
    ) {
      this.showScoreEngineSelection = true;
    } else {
      this.showScoreEngineSelection = false;
    }
  }

  pieChartLoad(col) {
    const weight = this.getUnallocatedWeightage();
    if (weight > 0) {
      col.push(['Unallocated Weightage', weight]);
    }
    setTimeout(() => {
      this.chart.load({
        unload: true,
        columns: col,
      });
      this.chart.resize();
    }, 10);
  }

  subscribeFormValueChangesForChart() {
    this.subscription = this.ratingsForm.valueChanges.subscribe(() => {
      const localCol = [];
      this.ratingsForm.controls.map((control: FormGroup) => {
        if (
          control.get('is_active').value &&
          control.get('name').value &&
          control.get('weightage').value != null
        ) {
          localCol.push([
            this.utils.extractTextFromHTML(control.get('name').value),
            Number(control.get('weightage').value),
          ]);
        }
      });
      this.pieChartLoad(localCol);
    });
  }

  weighCategoriesEqually() {
    if (this.weigh_categories_equally) {
      const count = this.ratingsForm.value.filter(
        (val) => val.is_active
      ).length;
      let weight: number;
      if (this.maxWeightage !== Number.POSITIVE_INFINITY) {
        weight = this.getDecimalValue(this.maxWeightage / count);
      }
      let totalWeight = weight * count;
      let totalLoss = this.getDecimalValue(this.maxWeightage - totalWeight); // Will always be > 0 as we are flooring the value

      this.averageWeight = this.getDecimalValue(100 / count);
      this.ratingsForm.controls.map((control: FormGroup) => {
        if (control.get('is_active').value) {
          control
            .get('weightage')
            .patchValue(
              this.category_type === 'Categories' ? this.averageWeight : weight
            );
          if (totalLoss <= this.precision) control.get('weightage').disable();
        }
      });
      if (totalLoss > this.precision) {
        this.SweetAlert.error({
          title: 'Weight distribution',
          text: `After applying equal weighting, there is a remaining ${totalLoss}% weight that needs to be distributed manually. Please add this remaining weight across any of the ratings to achieve a balanced total weight.`,
        });
      }
      this.unAllocatedWeight = totalLoss;
    } else {
      this.ratingsForm.controls.map((control: FormGroup) => {
        control.get('weightage').enable();
      });
    }
  }

  getUnallocatedWeightage() {
    let totalWeight = 0;
    if (this.maxWeightage !== Number.POSITIVE_INFINITY) {
      this.ratingsForm.controls.map((control: FormGroup) => {
        if (control.get('is_active').value) {
          totalWeight += Number(control.get('weightage').value);
        }
      });
      return this.getRoundtoTwoDecimal(this.maxWeightage - totalWeight);
    } else return 0;
  }
  getRoundtoTwoDecimal(number: any):number{
    return Math.round(Number(number) * 100) / 100;
  }

  getDecimalValue(number: any): number {
    return Math.floor(100 * Number(number)) / 100;
  }

  save(callback) {
    if (
      this.scoreEngineSelectionComponent &&
      !this.scoreEngineSelectionComponent.isFormValid()
    ) {
      return;
    }
    if (!this.ratingsForm.valid) {
      this.ratingsForm.markAllAsTouched();
      return;
    }
    if (this.unAllocatedWeight > this.precision || this.unAllocatedWeight < 0)
      return;
    this.loading = true;
    const payload = this.ratingsForm.getRawValue();
    payload.map((definition) => {
      definition.id = definition.id ?? 0;
      definition.category_level = this.category_level;
      definition.parent_id = this.parent ? this.parent.id : null;
    });
    this.RatingService.updateRatingScheme(
      this.rating_scheme.id,
      this.rating_scheme.version,
      payload,
      () => {
        if (this.scoreEngineSelectionComponent) {
          this.scoreEngineSelectionComponent.save(() => {
            if (this.parentCallback) {
              this.parentCallback();
            }
            this.loading = false;
            callback();
          });
        }
        this.loading = false;
        callback();
      },
      () => {
        this.loading = false;
      }
    );
  }

  pieChartConfig() {
    this.piechartConfig = {
      data: {
        type: 'pie',
        columns: [
          ['data1', 1],
          ['data1', 1],
        ],
        colors: { 'Unallocated Weightage': '#DD2C00' },
      },
      color: {
        pattern: [
          '#AA00FF',
          '#6200EA',
          '#2962FF',
          '#00B8D4',
          '#00C853',
          '#64DD17',
          '#FFD600',
          '#FFAB00',
          '#455A64',
        ],
      },
      pie: {
        label: {
          format: function (value, ratio, id) {
            return Number(value).toFixed(1) + '%';
          },
        },
      },
      tooltip: {
        format: {
          value: function (value, ratio, id) {
            return Number(value).toFixed(1) + '%';
          },
        },
      },
    };
  }

  handleWeightChange() {
    this.unAllocatedWeight = this.getUnallocatedWeightage();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
