import { Injectable } from '@angular/core';
import { CustomModalService } from './modal/customModal.service';

@Injectable({ providedIn: 'root' })
export class PopupCheckerService {
  constructor(private readonly ModalFactory: CustomModalService) {}

  check(popup_window: any) {
    const _scope = this;
    if (popup_window) {
      if (/chrome/.test(navigator.userAgent.toLowerCase())) {
        return setTimeout(() => {
          return _scope.is_popup_blocked(_scope, popup_window);
        }, 200);
      } else {
        return (popup_window.onload = () => {
          return _scope.is_popup_blocked(_scope, popup_window);
        });
      }
    } else {
      return _scope.displayError();
    }
  }

  is_popup_blocked(scope: this, popup_window: { innerHeight: number }) {
    if (popup_window.innerHeight > 0 === false) {
      return scope.displayError();
    }
  }

  displayError() {
    this.ModalFactory.invoke('popup-message');
  }
}
