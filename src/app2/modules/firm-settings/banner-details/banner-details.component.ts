import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { ToastrService } from 'ngx-toastr';

import { RouterService } from 'src/app2/services/router.service';
import { IBannerDetail } from 'src/app2/shared/models/banners.model';
import { errorMessageMap, Regex } from 'src/app2/shared/constants/constant';
import { InterpolatePipe } from 'src/app2/shared/pipes/interpolate.pipe';
import { BannersService } from 'src/app2/services/banners/banners.service';
import { noWhitespaceValidator } from 'src/app2/shared/validators/no-white-space.validator';
import { UtilsService } from 'src/app2/services/utils.service';

@Component({
  selector: 'app-banner-details',
  templateUrl: './banner-details.component.html',
  styleUrls: ['./banner-details.component.css'],
})
export class BannerDetailsComponent implements OnInit {
  bannerForm: FormGroup;
  saving: boolean = false;
  activeBanner: IBannerDetail;

  constructor(
    private readonly routerService: RouterService,
    private readonly toastrService: ToastrService,
    private readonly interpolatePipe: InterpolatePipe,
    private readonly bannersService: BannersService,
    private readonly util: UtilsService
  ) {}

  ngOnInit(): void {
    const state = this.routerService.getState();
    const bannerId = +state.params?.bannerId;
    if (bannerId) {
      this.activeBanner = this.bannersService.banners.find(
        (banner) => banner.id === bannerId
      );
      if (!this.activeBanner) {
        this.routerService.navigate('app.firm.settings.banners.add');
      }
    }

    this.initializeForm();
    // Subscribe to changes in redirect_url FormControl
    this.bannerForm.get('redirect_url')?.valueChanges.subscribe(() => {
      this.updateValidators();
    });
  }

  private updateValidators(): void {
    const redirectUrl = this.bannerForm.get('redirect_url').value;

    if (redirectUrl && redirectUrl.trim() !== '') {
      // If redirect_url has a value, set validators to required
      this.bannerForm.get('button_label').setValidators([Validators.required]);
      this.bannerForm.get('button_color').setValidators([Validators.required]);
      this.bannerForm
        .get('button_label_color')
        .setValidators([Validators.required]);
    } else {
      // If redirect_url is empty, remove validators
      this.bannerForm.get('button_label').clearValidators();
      this.bannerForm.get('button_color').clearValidators();
      this.bannerForm.get('button_label_color').clearValidators();
    }

    // Update validators
    this.bannerForm.get('button_label').updateValueAndValidity();
    this.bannerForm.get('button_color').updateValueAndValidity();
    this.bannerForm.get('button_label_color').updateValueAndValidity();
  }

  getErrorMessage(controlName: string, fieldName: string): string {
    const control = this.bannerForm.get(controlName);
    const hasError =
      control && control?.touched && control?.invalid && control?.errors;
    if (hasError && (control.errors.required || control.errors.whitespace)) {
      return this.interpolatePipe.transform(
        errorMessageMap?.required,
        fieldName
      );
    }

    if (hasError && control.errors.pattern) {
      return this.interpolatePipe.transform(errorMessageMap?.url, fieldName);
    }

    return '';
  }

  onColorPickerChange($event, controlName) {
    this.bannerForm.get(controlName).setValue($event);
    this.bannerForm.get(controlName).updateValueAndValidity();
  }

  getColor(color) {
    return this.util.isColorLightOrDarkModified(color);
  }

  cancel(): void {
    this.routerService.navigate('app.firm.settings.banners.list');
  }

  save(): void {
    if (this.bannerForm.invalid) {
      return;
    }
    this.saving = true;
    const bannerDetails = this.bannerForm.value;
    const operationType = bannerDetails?.id ? 'updated' : 'added';
    const serviceMethod = bannerDetails?.id
      ? this.bannersService.update(this.activeBanner.id, bannerDetails)
      : this.bannersService.add(bannerDetails);
    serviceMethod
      .subscribe((response: IBannerDetail) => {
        this.toastrService.success(`Banner ${operationType}.`);
        this.cancel(); // navigate back to banner list.
      })
      .add(() => (this.saving = false));
  }

  private initializeForm(): void {
    this.bannerForm = new FormGroup({
      id: new FormControl(this.activeBanner?.id ?? ''),
      banner_title: new FormControl(this.activeBanner?.banner_title ?? '', [
        noWhitespaceValidator,
        Validators.required,
      ]),
      banner_url: new FormControl(this.activeBanner?.banner_url ?? '', [
        Validators.required,
        Validators.pattern(Regex.urlRegExp),
      ]),
      background_color: new FormControl(
        this.activeBanner?.background_color ?? ''
      ),
      button_label: new FormControl(this.activeBanner?.button_label ?? ''),
      button_color: new FormControl(this.activeBanner?.button_color ?? ''),
      button_label_color: new FormControl(
        this.activeBanner?.button_label_color ?? ''
      ),
      button_asset_url: new FormControl(
        this.activeBanner?.button_asset_url ?? '',
        [Validators.pattern(Regex.urlRegExp)]
      ),
      redirect_url: new FormControl(this.activeBanner?.redirect_url ?? '', [
        Validators.pattern(Regex.urlRegExp),
      ]),
      is_draft: new FormControl(this.activeBanner?.is_draft ?? false),
      probability: new FormControl(this.activeBanner?.probability ?? 0, [
        Validators.pattern(Regex.numericResponse),
        Validators.min(0),
        Validators.max(100),
      ]),
    });
    this.updateValidators();
  }
}
