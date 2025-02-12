import { Injectable } from '@angular/core';
import { RouterService } from 'src/app2/services/router.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';

@Injectable()
export class UnsavedChangeService {
  private _unsavedChanges: number;

  get unsavedChanges(): number {
    return this._unsavedChanges;
  }

  constructor(
    private readonly router: RouterService,
    private readonly sweetAlert: SweetAlertService
  ) {}

  onUnsavedTableCountChange(unsaved_count: number): void {
    this._unsavedChanges = unsaved_count;
  }

  showUnsavedChangeAlert(link: string) {
    let alert_title =
      this.unsavedChanges == 1
        ? 'You have 1 table with unsaved changes. '
        : `You have ${this.unsavedChanges} tables with unsaved changes. `;
    this.sweetAlert
      .confirm({
        title: alert_title + 'Are you sure you want to leave this page?',
        text: 'All your unsaved changes will be lost if you leave this page.',
        cancelButtonText: 'Leave',
        confirmButtonText: 'Stay',
        customClass: 'danger-on-cancel',
        showCloseButton: true,
        reverseButtons: false,
        showLoaderOnConfirm: true,
        preConfirm: () => {
          this.sweetAlert.close();
        },
      })
      .then((isConfirm) => {
        if (isConfirm.dismiss && isConfirm.dismiss == 'cancel') {
          this._unsavedChanges = 0;
          this.sweetAlert.close();
          this.router.navigate(link);
        }
      });
  }
}
