import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { InterpolatePipe } from 'src/app2/shared/pipes/interpolate.pipe';
import { errorMessageMap } from 'src/app2/shared/constants/constant';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { validateAllFormFields } from 'src/app2/utils/validateAllFormFields';
import { DvValidators } from 'src/app2/shared/validators/no-white-space.validator';

@Component({
  selector: 'app-sso-profile',
  templateUrl: './sso-profile.component.html',
  styleUrls: ['./sso-profile.component.css'],
})
export class SsoProfileComponent implements OnInit {
  ssoObject;
  useMetaUrl = false;
  showAdvanceOptions;
  isNew: boolean;
  responseSignatures;
  sso_form: any;
  saving: boolean;
  profileForm: FormGroup;
  enable_saml = false;
  metadata_file = '';
  showError = false;

  constructor(
    private readonly http: HttpClient,
    private readonly NewModalFactory: CustomModalService,
    private readonly toaster: ToastrService,
    private readonly interpolatePipe: InterpolatePipe
  ) {}

  ngOnInit(): void {
    this.profileForm = new FormGroup({
      idpMetadataUrlControl: new FormControl(null, [DvValidators.required]),
      httpsRedirectEndpointControl: new FormControl(null, [
        Validators.required,
      ]),
      idpIssuerUrlControl: new FormControl(null, [Validators.required]),
      signatureCertificateControl: new FormControl(null, [Validators.required]),
      sloEndpointControl: new FormControl(null),
      requestSignatureControl: new FormControl(false),
      responseSignatureVerificationControl: new FormControl(0),
    });
    this.ssoObject = {};
    this.isNew = false;
    this.responseSignatures = [
      { id: 0, name: 'Response', property_name: 'SignResponse' },
      { id: 1, name: 'Assertion', property_name: 'SignAssertion' },
      {
        id: 2,
        name: 'Response And Assertion',
        property_name: 'SignAssertionAndResponse',
      },
    ];
    this.getSsoData();
  }

  getSsoData() {
    this.http.get(`saml/configuration`).subscribe((response: any) => {
      if (response) {
        this.ssoObject = response;
      }
      if (!response) {
        this.isNew = true;
      }
      if (this.ssoObject?.enable_saml) {
        this.enable_saml = true;
      }
      if (this.ssoObject?.metadata_file) {
        this.metadata_file = this.ssoObject?.metadata_file;
        this.useMetaUrl = true;
      }
      this.profileForm.patchValue({
        idpMetadataUrlControl: this.ssoObject?.metadata_file,
        httpsRedirectEndpointControl: this.ssoObject?.login_url || null,
        idpIssuerUrlControl: this.ssoObject?.entity_id || null,
        signatureCertificateControl:
          this.ssoObject?.signature_certificate || null,
        sloEndpointControl: this.ssoObject?.logout_url || null,
        requestSignatureControl: this.ssoObject?.require_assertions,
        responseSignatureVerificationControl: this.ssoObject?.verification_type
          ? this.responseSignatures.find(
              (x) => x.property_name == this.ssoObject?.verification_type
            ).id
          : 0,
      });
    });
  }

  ViewServiceProviderDetails() {
    Object.keys(this.profileForm.controls).forEach((field) => {
      const control = this.profileForm.get(field);
      control.markAsUntouched({ onlySelf: true });
    });
    this.NewModalFactory.invoke('view-service-provider', { class: 'modal-lg' });
  }

  submit() {
    validateAllFormFields(this.profileForm);
    let promise;
    if (this.useMetaUrl) {
      if (this.profileForm.get('idpMetadataUrlControl').invalid) {
        if (this.enable_saml) {
          this.showError = true;
        }
        return;
      }
      this.ssoObject.login_url = null;
      this.ssoObject.entity_id = null;
      this.ssoObject.signature_certificate = null;
      this.ssoObject.logout_url = null;
      this.ssoObject.metadata_file =
        this.profileForm.value.idpMetadataUrlControl;
    } else {
      if (
        this.profileForm.get('httpsRedirectEndpointControl').invalid ||
        this.profileForm.get('idpIssuerUrlControl').invalid ||
        this.profileForm.get('signatureCertificateControl').invalid
      ) {
        if (this.enable_saml) {
          this.showError = true;
        }
        return;
      }
      this.showError = false;
      this.ssoObject.metadata_file = null;
      this.ssoObject.login_url =
        this.profileForm.value.httpsRedirectEndpointControl;
      this.ssoObject.entity_id = this.profileForm.value.idpIssuerUrlControl;
      this.ssoObject.signature_certificate =
        this.profileForm.value.signatureCertificateControl;
      this.ssoObject.logout_url = this.profileForm.value.sloEndpointControl;
      this.ssoObject.require_assertions =
        this.profileForm.value.requestSignatureControl;
      this.ssoObject.verification_type =
        this.profileForm.value.responseSignatureVerificationControl;
    }
    const params: any = { ...this.ssoObject };
    params.enable_saml = this.enable_saml;
    this.saving = true;
    if (this.isNew) {
      promise = this.http.post(`saml/configuration`, params);
    } else {
      promise = this.http.put(`saml/configuration`, params);
    }
    promise.subscribe(
      (response: any) => {
        this.saving = false;
        let message = 'SSO disabled';
        if (this.enable_saml) {
          message = 'SSO enabled';
        }
        this.toaster.success(message);
        this.ssoObject = { ...response };
        this.isNew = false;
      },
      (error: any) => {
        this.saving = false;
      }
    );
  }

  getErrorMessage(controlName: string, fieldName?: string): string {
    const control = this.profileForm.get(controlName);
    const hasError =
      control && control?.invalid && control?.errors && this.showError;
    if (hasError && control.errors.required) {
      return this.interpolatePipe.transform(
        errorMessageMap?.required,
        fieldName
      );
    }
    return '';
  }

  onRadioClick(isMetaUrlUsed: boolean) {
    this.useMetaUrl = isMetaUrlUsed;
    if (!this.useMetaUrl) {
      this.profileForm.get('idpMetadataUrlControl').clearValidators();
      this.profileForm
        .get('httpsRedirectEndpointControl')
        .setValidators(Validators.required);
      this.profileForm
        .get('idpIssuerUrlControl')
        .setValidators(Validators.required);
      this.profileForm
        .get('signatureCertificateControl')
        .setValidators(Validators.required);
    } else {
      this.profileForm
        .get('idpMetadataUrlControl')
        .setValidators(Validators.required);
      this.profileForm.get('httpsRedirectEndpointControl').clearValidators();
      this.profileForm.get('idpIssuerUrlControl').clearValidators();
      this.profileForm.get('signatureCertificateControl').clearValidators();
    }
    this.profileForm.get('idpMetadataUrlControl').updateValueAndValidity();
    this.profileForm
      .get('httpsRedirectEndpointControl')
      .updateValueAndValidity();
    this.profileForm.get('idpIssuerUrlControl').updateValueAndValidity();
    this.profileForm
      .get('signatureCertificateControl')
      .updateValueAndValidity();
  }
}