import { Component, OnDestroy, OnInit } from '@angular/core';
import swal from 'sweetalert2/dist/sweetalert2.js';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { ratingConstants } from 'src/app2/shared/constants/constant';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { RatingService } from 'src/app2/services/rating-definition/rating-defination.service';
import { IRatingScales } from 'src/app2/services/rating-definition/rating-definition.types';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { PanelControl } from 'src/app2/shared/components/dv-panel-heading/dv-panel-heading.component';
import { validateAllFormFields } from 'src/app2/utils/validateAllFormFields';

@Component({
  selector: 'app-rating-scales',
  templateUrl: './rating-scales.component.html',
  styleUrls: ['./rating-scales.component.css'],
})
export class RatingScalesComponent implements OnInit, OnDestroy {
  filterRatingScale = '';
  ratingScalesList = [];
  selectedScale;
  ratingConstants = ratingConstants;
  loading_rating_scales;
  defaultPrimaryColor: string;
  color: string;
  defaultVersion: number;
  miniColorSettings;
  rating_scales_form: any;
  loading: boolean;
  ratingScaleForm: FormGroup;
  scales: FormArray | any = [];
  isReadonly: boolean = true;
  ratingScaleSub;
  hovering: boolean;
  previewRating: number = 0;
  clickedRating: number = 0;
  naValue:any
  panelHeadingControls: PanelControl[] = [];
  constructor(
    private readonly NewModalFactory: CustomModalService,
    private readonly SweetAlert: SweetAlertService,
    private readonly RatingService: RatingService,
    private readonly Utils: UtilsService
  ) {}

  ngOnInit(): void {
    this.setPanelHeadingControls();
    this.naValue = {
      value: '0',
      name: 'N/A',
      color_code: '#FFFFFF',
      range_min_value: null,
      range_max_value: null,
    };
    this.ratingScaleForm = new FormGroup({
      scales: new FormArray([]),
    });
    this.scales = this.ratingScaleForm.get('scales') as FormArray;
    this.defaultPrimaryColor = '#126B82';
    this.color = this.defaultPrimaryColor;
    this.selectedScale = null;
    this.defaultVersion = 0;
    this.miniColorSettings = {
      changeDelay: 300,
      control: 'hue',
      theme: 'bootstrap',
      position: 'bottom left',
      letterCase: 'uppercase',
    };
    this.RatingService.getAllRatingScales((ratingScales: IRatingScales[]) => {
      this.ratingScalesList = ratingScales;
      if (ratingScales.length > 0) {
        this.selectRatingScale(ratingScales[0]);
      }
    });
    this.ratingScaleSub = this.RatingService.ratingScaleSub.subscribe(
      ({ allScales, currentScale }) => {
        this.ratingScalesList = allScales;
        this.selectRatingScale(currentScale);
      }
    );
  }

  setPanelHeadingControls() {
    this.panelHeadingControls = [
      {
        text: 'Add New',
        handleClick: this.onAddRatingScale.bind(this),
        tooltip: 'Add New Rating/Score Scale',
        leftIcon: 'plus',
      },
    ];
  }

  resetForm() {
    this.ratingScaleForm.markAsPristine();
    this.ratingScaleForm.markAsUntouched();
    this.ratingScaleForm.updateValueAndValidity();
  }

  incrementScale(name?) {
    const scale: any = {
      value: this.selectedScale.rating_scales.length - 1,
      name: name ?? '',
    };
    if (this.selectedScale.scale_mode === this.ratingConstants.ScoreBand) {
      if (this.selectedScale.rating_scales.length === 0) {
        scale.range_min_value = 0;
      } else {
        const previousMaxValue = Number(
          this.scales.controls[this.scales.length - 1].get(
            'rangeMaxValueControl'
          ).value
        );
        scale.range_min_value = Number(
          (
            previousMaxValue +
            (this.selectedScale.allow_decimal_score_bands ? 0.01 : 1)
          ).toFixed(2)
        );
      }
      scale.range_max_value = Number((scale.range_min_value + 10).toFixed(2));
    }
    this.selectedScale.rating_scales.push(scale);
    this.scales.push(
      new FormGroup({
        scaleIdControl: new FormControl(scale.id),
        scaleNameControl: new FormControl(scale.name, [Validators.required]),
        rangeMinValueControl: new FormControl(
          {
            value: scale.range_min_value,
            disabled:
              this.selectedScale.scale_mode === ratingConstants.Absolute,
          },
          [Validators.required]
        ),
        rangeMaxValueControl: new FormControl(
          {
            value: scale.range_max_value,
            disabled:
              this.selectedScale.scale_mode === ratingConstants.Absolute,
          },
          [Validators.required]
        ),
        ratingScaleControl: new FormControl({
          value: scale.value,
          disabled: true,
        }),
        ratingColorControl: new FormControl('', [
          Validators.required,
          Validators.pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$}/),
        ]),
      })
    );
  }

  decrementScale() {
    this.selectedScale.rating_scales.splice(
      this.selectedScale.rating_scales.length - 1,
      1
    );
    this.scales.removeAt(this.scales.length - 1);
    this.validateColor();
    this.nameValidate();
  }

  selectRatingScale(scale) {
    this.resetRatingPreview();
    this.loading_rating_scales = true;
    this.selectedScale = scale;
    this.RatingService.getRatingScaleDefinitions(
      scale.id,
      this.defaultVersion,
      (response: any) => {
        this.selectedScale.rating_scales = response;
        if (this.selectedScale.rating_scales.length > 0) {
          this.scales.clear();
          this.selectedScale.rating_scales.forEach((rating_scale) => {
            const disableRange =
              rating_scale.value === this.ratingConstants.notRatedValue ||
              rating_scale.value === this.ratingConstants.naValue;
            this.scales.push(
              new FormGroup({
                scaleIdControl: new FormControl(scale.id),
                scaleNameControl: new FormControl(rating_scale.name, [
                  Validators.required,
                ]),
                rangeMinValueControl: new FormControl(
                  {
                    value: rating_scale.range_min_value,
                    disabled:
                      this.selectedScale.scale_mode ===
                        ratingConstants.Absolute || disableRange,
                  },
                  disableRange ? [] : [Validators.required]
                ),
                rangeMaxValueControl: new FormControl(
                  {
                    value: rating_scale.range_max_value,
                    disabled:
                      this.selectedScale.scale_mode ===
                        ratingConstants.Absolute || disableRange,
                  },
                  disableRange ? [] : [Validators.required]
                ),
                ratingScaleControl: new FormControl({
                  value: rating_scale.value,
                  disabled: true,
                }),
                ratingColorControl: new FormControl(rating_scale.color_code, [
                  Validators.required,
                  Validators.pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
                ]),
              })
            );
          });
        }
        this.ratingScaleForm.updateValueAndValidity();
        this.loading_rating_scales = false;
        this.ratingScaleForm.markAllAsTouched();
      },
      (error: any) => {
        this.loading_rating_scales = false;
      }
    );
  }

  onAddRatingScale() {
    const names = [];
    this.ratingScalesList.forEach((val) => names.push(val.name));
    this.NewModalFactory.invoke('add-rating-scale', {
      initialState: {
        allRatingScalesName: names,
      },
    });
  }

  onEditRatingScale(event, scale, index) {
    event.stopPropagation();
    const names = [];
    this.ratingScalesList.forEach((val) => names.push(val.name));
    this.NewModalFactory.invoke('add-rating-scale', {
      initialState: {
        allRatingScalesName: names,
        editing_rating_scale: scale,
      },
    });
  }

  confirmRatingScaleDeletion(event, scale: any, index: any) {
    event.stopPropagation();
    this.SweetAlert.confirm({
      title: 'Are you sure you want to remove this rating scale?',
      focusCancel: true,
      showLoaderOnConfirm: true,
      preConfirm: () => {
        return new Promise<void>((resolve) => {
          this.removeRatingScale(scale, resolve);
        });
      },
    }).then(() => {
      swal.close();
    });
  }

  removeRatingScale(scale, resolve) {
    this.RatingService.deleteRatingScale(
      scale,
      (ratingScales) => {
        this.ratingScalesList = ratingScales;
        this.filterRatingScale = '';
        if (this.ratingScalesList.length > 0) {
          this.selectRatingScale(this.ratingScalesList[0]);
        } else {
          this.selectedScale = null;
        }
        resolve();
      },
      () => {
        resolve();
      }
    );
  }

  setModelValidity(index: number) {
    this.validateColor();
  }

  onBlurMethod(index, isMin) {
    this.setScaleValidity(index, isMin);
  }

  setScaleValidity(index, isMin = true) {
    const control = isMin
      ? this.scales.controls[index].get('rangeMinValueControl')
      : this.scales.controls[index].get('rangeMaxValueControl');
    if (control.value) {
      const value = +control.value;
      if (isMin && index === 2 && value !== 0) {
        control.setErrors({ rangeStartError: true });
        return;
      }
      if (!isMin && value && value > 100) {
      } else {
        delete control?.errors?.rangeEndError;
        control.setErrors(null);
      }
      if (isMin) {
        const previousMaxControlValue = +this.scales.controls[index - 1].get(
          'rangeMaxValueControl'
        ).value;
        if (
          index > 2 &&
          Number(
            (
              previousMaxControlValue +
              (this.selectedScale.allow_decimal_score_bands ? 0.01 : 1)
            ).toFixed(2)
          ) !== value
        ) {
          control.setErrors({ rangeError: true });
        } else {
          delete control?.errors?.rangeError;
          control.setErrors(null);
        }
      } else {
        if (index < this.scales.length - 1) {
          const nextMinControl = this.scales.controls[index + 1].get(
            'rangeMinValueControl'
          );
          const nextMinControlValue = +nextMinControl.value;
          if (
            Number(
              (
                value +
                (this.selectedScale.allow_decimal_score_bands ? 0.01 : 1)
              ).toFixed(2)
            ) !== nextMinControlValue
          ) {
            nextMinControl.setErrors({ rangeError: true });
          } else {
            delete nextMinControl?.errors?.rangeError;
            nextMinControl.setErrors(null);
          }
        }
      }
    }

    this.validateMax();
  }

  validateMax() {
    this.ratingScaleForm.get('scales')['controls'].map((scale, index) => {
      const controlMax: FormControl = this.scales.controls[index].get(
        'rangeMaxValueControl'
      );
      controlMax.setErrors(null);
      if (!this.controlHasRequiredValidation(controlMax)) {
        return;
      }
      if (+controlMax.value > 100) {
        controlMax.setErrors({ rangeEndError: true });
      }
      if (!Number(controlMax.value)) {
        controlMax.setErrors({ rangeEndError: true });
      }
      const controlMin = this.scales.controls[index].get(
        'rangeMinValueControl'
      );
      if (+controlMin.value >= +controlMax.value) {
        controlMax.setErrors({ invalidRangeError: true });
      }
    });
  }

  validateColor() {
    // Initialize an array to keep track of unique colors and their indices
    const duplicateColorCheck = [];

    // Iterate through each FormGroup in the FormArray
    this.scales.controls.forEach((scale, index) => {
      const colorControl = scale.get('ratingColorControl');

      // Reset any previous errors on the color control
      colorControl?.setErrors(null);

      // Check if the color control value is empty or missing
      if (!colorControl?.value) {
        colorControl?.setErrors({ required: true });
      }
      // Check if the color control value does not match the valid color pattern
      else if (
        !colorControl.value.match(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
      ) {
        colorControl.setErrors({ pattern: true });
      }

      // Check for duplicate colors
      const existingColor = duplicateColorCheck.find(
        (entry) =>
          colorControl.value && entry.color === colorControl.value.toLowerCase()
      );

      if (existingColor) {
        // If a duplicate color is found, set the duplicate error on both controls
        colorControl.setErrors({
          ...colorControl.errors,
          duplicateColor: true,
        });

        const duplicateControl =
          this.scales.controls[existingColor.index].get('ratingColorControl');
        duplicateControl?.setErrors({
          ...duplicateControl.errors,
          duplicateColor: true,
        });
      } else {
        // If the color is unique, add it to the tracking array
        duplicateColorCheck.push({
          color: colorControl.value.toLowerCase(),
          index,
        });
      }
    });
  }

  handleNameChange() {
    this.nameValidate();
  }

  nameValidate() {
    let dublicateName = [];
    this.ratingScaleForm.get('scales')['controls'].map((scale, index) => {
      const control1 = this.scales.controls[index].get('scaleNameControl');
      control1.markAsTouched({ onlySelf: true });
      control1.setErrors(null);
      if (!control1.value || !String(control1.value).trim().length) {
        control1.setErrors({ required: true });
      }
      dublicateName.map((val) => {
        if (val.name === scale.value.scaleNameControl.toLowerCase()) {
          const control1 = this.scales.controls[index].get('scaleNameControl');
          control1.setErrors({ ...control1, duplicateName: true });
          const control2 =
            this.scales.controls[val.index].get('scaleNameControl');
          control2.setErrors({ ...control2, duplicateName: true });
        }
      });
      if (scale.value.scaleNameControl) {
        dublicateName.push({
          name: scale.value.scaleNameControl.toLowerCase(),
          index,
        });
      }
    });
  }

  save() {
    this.validateColor();
    this.validateMax();
    this.nameValidate();
    this.ratingScaleForm.get('scales')['controls'].map((scale) => {
      validateAllFormFields(scale);
    });
    if (!this.ratingScaleForm.invalid) {
      this.loading = true;
      const data = [];
      this.ratingScaleForm.getRawValue().scales.forEach((scale) => {
        data.push({
          name: scale.scaleNameControl,
          range_min_value: scale.rangeMinValueControl,
          range_max_value: scale.rangeMaxValueControl,
          value: scale.ratingScaleControl,
          color_code: scale.ratingColorControl,
        });
      });
      this.RatingService.updateRatingScaleDefinitions(
        this.selectedScale.id,
        this.selectedScale.version,
        data,
        () => (this.loading = false),
        () => (this.loading = false)
      );
    }
  }

  onColorPickerChange($event, index) {
    this.scales.controls[index].get('ratingColorControl').setValue($event);
    this.setModelValidity(index);
  }

  getColor(control, index?) {
    if (!index && index !== 0 && control.valid) {
      const color = control.value;
      return this.Utils.isColorLightOrDarkModified(color);
    }
    if ((index === 0 || index) && control.valid) {
      const color = control.value;
      return this.Utils.isColorLightOrDarkModified(color);
    }
    return this.Utils.isColorLightOrDarkModified(control.value);
  }

  handleColorClick(index: number) {
    this.clickedRating = this.previewRating = index + 1;
  }

  hoveringOver(index: number) {
    this.hovering = true;
    this.previewRating = index + 1;
  }

  resetHovering() {
    this.hovering = false;
    this.previewRating = this.clickedRating;
  }

  resetRatingPreview() {
    this.previewRating = this.clickedRating = 0;
    this.hovering = false;
  }

  ngOnDestroy(): void {
    this.ratingScaleSub.unsubscribe();
  }

  controlHasRequiredValidation(control: FormControl): boolean {
    const validators = control.validator ? control.validator(control) : null;
    return !!validators && validators.required;
  }
}

