import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import * as angular from 'angular';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import { RouterService } from './router.service';

@Injectable({
  providedIn: 'root',
})
export class SweetAlertService {
  constructor(private readonly router: RouterService) {}

  getCommonConfig(config) {
    return {
      title: config?.title || '',
      text: config?.text || '',
      html: config?.html || '',
      confirmButtonText: config?.confirmButtonText || 'Confirm',
      showCloseButton: config?.showCloseButton || false,
    };
  }

  confirm(config) {
    const params = {
      ...this.getCommonConfig(config),
      imageUrl: '/assets/images/colored-warning.svg',
      allowOutsideClick: false,
      allowEscapeKey: true,
      showConfirmButton: true,
      showCancelButton: true,
      cancelButtonText: config?.cancelButtonText || 'Cancel',
      customClass: config?.customClass,
      focusCancel: config?.focusCancel === false ? false : true, // this have to be true all time
      showLoaderOnConfirm: config?.showLoaderOnConfirm || true, // this have to be true all time
      preConfirm: config?.preConfirm || null,
      reverseButtons: config?.reverseButtons === false ? false : true,
    };
    return Swal.fire(params);
  }

  error(config) {
    const params = {
      ...this.getCommonConfig(config),
      icon: 'error',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: true,
      showCancelButton: false,
    };
    return Swal.fire(params);
  }

  info(config) {
    const params = {
      ...this.getCommonConfig(config),
      icon: 'info',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: true,
      showCancelButton: false,
    };
    return Swal.fire(params);
  }

  success(config) {
    const params = {
      ...this.getCommonConfig(config),
      icon: 'success',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: true,
      showCancelButton: false,
    };
    return Swal.fire(params);
  }

  input(config) {
    const params = {
      ...this.getCommonConfig(config),
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: true,
      showCancelButton: true,
      input: config.input || 'text',
    };
    return Swal.fire(params);
  }

  freeInput(config) {
    return Swal.fire(config);
  }

  // To show when we nudge user for premium page
  premiumAlert(
    data = {
      title: 'Unlock this feature',
      text: 'Elevate precision in your due diligence process!',
    }
  ) {
    const params = {
      customClass: {
        header: 'premiumAlertHeaderClass',
        image: 'premiumImgClass',
        title: 'premiumTitleClass',
      },
      imageUrl: '/assets/images/premium-crown.png',
      html: `<div style="display: flex;flex-direction: column;justify-content: center;align-items: center;gap: 5px;text-align: center;"><span style="color: #0071a4;font-size: 12px;font-weight: 600;">PREMIUM FEATURE</span><span style="font-size: 20px;font-weight: 600;">✨ ${data.title} ✨</span></div><span style="display: flex;flex-direction: column;align-items: center;justify-content: center;gap: 15px;font-size: 16px;font-weight: 400;">${data.text}</span>`,
      confirmButtonText: 'Get started here',
      showCloseButton: true,
    };

    return Swal.fire(params).then((isConfirm) => {
      if (isConfirm.value) this.router.navigate('app.premium');
    });
  }

  close() {
    Swal.close();
  }

  //This is used when we want to show progress bar inside sweet alert
  loaderAlert(config) {
    Swal.fire({
      ...config,
      timerProgressBar: true,
      showConfirmButton: false,
      allowOutsideClick: false,
    });
    Swal.showLoading();
  }
}
