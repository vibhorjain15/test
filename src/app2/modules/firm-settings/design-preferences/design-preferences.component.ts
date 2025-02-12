import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { finalize, take } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import { UtilsService } from 'src/app2/services/utils.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { FirmPreferenceDataService } from '../firm-preference-data.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { ImageDataService } from 'src/app2/services/ImageData/ImageDataService.service';
import { DesignPrefImageResponse } from 'src/app2/services/ImageData/ImageData.type';
import { UserState } from 'src/app2/store/user/user.state';
import { Select, Store } from '@ngxs/store';
import {
  UpdateFirmPreference,
} from 'src/app2/store/user/user.action';

@Component({
  selector: 'app-design-preferences',
  templateUrl: './design-preferences.component.html',
  styleUrls: ['./design-preferences.component.css'],
})
export class DesignPreferencesComponent implements OnInit,OnDestroy {
  loadingFirmPreference = true;
  selectedColors: any = [];
  logoLink = null;
  defaultPrimaryColor: string;
  color: string;
  firmPreferences: any;
  designPreferenceForm: FormGroup;
  savingFirmPreferences: boolean;
  colors: FormArray;
  @Select(UserState.getCurrentUserData) user;
  @Select(UserState.getFirmPreferenceData) firmPref;
  current_user: any;
  pattern = /#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})/;

  colorMap = new Map();
  imageSub
  constructor(
    private readonly Utils: UtilsService,
    private readonly NewModalFactory: CustomModalService,
    private readonly toaster: ToastrService,
    private readonly ImageDataSer: ImageDataService,
    private readonly SweetAlert: SweetAlertService,
    private readonly FirmPreferenceDataService: FirmPreferenceDataService,
    private readonly store: Store
  ) {}

  ngOnInit(): void {
    this.user.pipe(take(1))
      .subscribe((data) => {
        if (data) {
          this.current_user = data;
          this.logoLink = this.current_user.avatarURL;
          this.initialize();
          this.loadingFirmPreference = false;
          this.colorMap = new Map();
        }
      });
  }

  initialize(): void {
    this.designPreferenceForm = new FormGroup({ colors: new FormArray([]) });
    this.colors = this.designPreferenceForm.get('colors') as FormArray;
    this.defaultPrimaryColor = '#126B82';
    this.color = this.defaultPrimaryColor;
    this.firmPref.pipe(take(1)).subscribe((pref) => {
      this.firmPreferences = JSON.parse(JSON.stringify(pref));
      if (this.firmPreferences.logo_link) {
        this.logoLink = this.firmPreferences.logo_link;
      }
      this.selectedColors = [...this.Utils.getFirmColorScheme(pref)];
      this.selectedColors.forEach((color) => {
        this.colors.push(
          new FormControl(color, [
            Validators.required,
            Validators.pattern(this.pattern),
          ])
        );
        this.updateColor(color);
      });
    });
    this.imageSub =  this.ImageDataSer.uploadedImageResSub.subscribe(
      (image: DesignPrefImageResponse) => {
        if (image.blobUrl) {
          this.logoLink = image.blobUrl;
        }
      }
    )
  }

  updateColor(color) {
    color = color.toUpperCase();
    if (this.colorMap.has(color)) {
      const count = this.colorMap.get(color);
      this.colorMap.set(color, count + 1);
    } else {
      this.colorMap.set(color, 1);
    }
  }

  handleColorChange(data, index) {
    this.colorMap = new Map();
    this.colors.controls.forEach((control, i) => {
      this.updateColor(control.value.toUpperCase());
    });
  }

  addNewColor() {
    this.selectedColors.push(this.defaultPrimaryColor);
    this.colors.push(
      new FormControl(this.defaultPrimaryColor, [
        Validators.required,
        Validators.pattern(this.pattern),
      ])
    );
    this.updateColor(this.defaultPrimaryColor.toUpperCase());
  }

  removeColor(color, idx: any) {
    color = color.toUpperCase();
    if (this.colorMap.has(color)) {
      const count = this.colorMap.get(color);
      this.colorMap.set(color, count - 1);
      if (this.colorMap.get(color) == 0) {
        this.colorMap.delete(color);
      }
    }
    this.selectedColors.splice(idx, 1);
    this.colors.removeAt(idx);
  }

  resetColors() {
    this.colorMap = new Map();
    this.selectedColors = [...this.Utils.getDefaultColorScheme()];
    this.colors.clear();
    this.selectedColors.forEach((color) => {
      this.colors.push(
        new FormControl(color, [
          Validators.required,
          Validators.pattern(this.pattern),
        ])
      );
      this.updateColor(color);
    });
  }

  openImageUpdateDialog() {
    this.NewModalFactory.invoke('update-image', {
      class: 'modal-xl',
    });
  }

  updateFirmPreferences() {
    if (!this.logoLink) {
      this.toaster.error(
        'Logo Missing',
        'To save design preferences, please upload a firm logo.'
      );
      return;
    }
    let error = '';
    this.designPreferenceForm.get('colors')['controls'].map((color) => {
      if (color instanceof FormControl) {
        color.markAsTouched({ onlySelf: true });
      }
      if (this.colorMap.get(color.value.toUpperCase()) > 1) {
        error = "You can't have duplicate colors in the list.";
        color.setErrors({
          duplicateColor: true,
        });
      }
      if (this.colorMap.get(color.value.toUpperCase()) == 1) {
        if (color.hasError('duplicateColor')) {
          delete color.errors['firstError'];
          color.updateValueAndValidity();
        }
      }
    });
    if (error) return;
    if (!this.designPreferenceForm.invalid) {
      this.savingFirmPreferences = true;
      this.firmPreferences.color_codes = this.colors.value;
      this.firmPreferences.logo_link = this.logoLink;
      this.store
        .dispatch(new UpdateFirmPreference(this.firmPreferences))
        .subscribe(() => {
          this.savingFirmPreferences = false;
          this.toaster.success(
            'We have successfully saved your design preferences.',
            'Updated Design Preferences'
          );
        });
    }
  }

  deleteLogoConfirmation() {
    this.SweetAlert.confirm({
      title: 'Are you sure you want to remove the previously selected logo?',
      confirmButtonText: 'Yes, remove logo',
      focusCancel: true,
      showLoaderOnConfirm: true,
      preConfirm: () => {
        return new Promise<void>((resolve) => {
          this.firmPreferences.logo_link = null;
          this.FirmPreferenceDataService.updateFirmPreferences(
            this.firmPreferences
          )
            .pipe(finalize(() => resolve()))
            .subscribe((response: any) => {
              this.logoLink = null;
              this.toaster.success(
                'Successfully Removed Logo',
                'We have successfully removed your selected logo.'
              );
            });
        });
      },
    }).then(() => {
      Swal.close();
    });
  }

  trackByIndex(index: number, element): number {
    return index;
  }

  onColorPickerChange(color, index) {
    this.colors.controls[index].setValue(color);
    this.colorMap = new Map();
    this.colors.controls.forEach((control, i) => {
      this.updateColor(control.value.toUpperCase());
    });
  }

  getColor(color, index) {
    return this.Utils.isColorLightOrDarkModified(color);
  }

  ngOnDestroy(): void {
    this.imageSub?.unsubscribe()
  }
}
