import {
  ErrorStatusCode,
  ERROR_CODES,
} from 'src/app2/shared/constants/constant';

export const handelConflict = (
  error,
  templateId,
  SweetAlert,
  routerService,
  modalService,
  callback = null
) => {
  if (error.status === ERROR_CODES.CONFLICT) {
    SweetAlert.error({
      title: error.error.message,
      confirmButtonText: 'Refresh',
    }).then((isConfirm) => {
      if (isConfirm.value && isConfirm.value == true) {
        modalService.closeAllActiveModals();
        routerService.navigateWithParams(
          'app.diligence.template.preview',
          {
            templateId: routerService.getState()?.params?.templateId,
          },
          {
            reload: true,
          }
        );
      }
    });
  } else if (
    error?.error?.message &&
    error.status !== ErrorStatusCode.BadRequest
  ) {
    callback && callback();
  }
};
