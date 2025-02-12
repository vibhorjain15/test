import { Inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  modalfactory;
  constructor() {}
  invoke(path) {
    this.modalfactory.invoke(path);
  }
  invokeModal(...config) {
    this.modalfactory.invokeModal(...config);
  }
  closeAllActiveModals() {
    this.modalfactory?.closeAllActiveModals();
  }
}
