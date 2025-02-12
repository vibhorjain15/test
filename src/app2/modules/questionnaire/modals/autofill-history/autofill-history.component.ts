import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { Store } from '@ngxs/store';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';
import { QuestionnaireService } from 'src/app2/apis/questionnaire/questionnaire.service';
import { DiligenceType } from 'src/app2/apis/questionnaire/type/diligence.type';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { ModalComponent } from 'src/app2/shared/components/modal/modal.component';
import { UpdateDraftData } from '../../store/questionnaire.action';
import { DvDraftService } from '../../service/draft.service';
import { autoFillHistoryParse, TabType } from '../../types/auto-fill.type';

@Component({
  selector: 'autofill-history',
  templateUrl: './autofill-history.component.html',
  styleUrls: ['./autofill-history.component.css'],
})
export class AutofillHistoryComponent {
  @Input() autofillHistory: any[];
  @Input() diligence: DiligenceType;
  @Input() success: any; // true/false if user deletes the responses
  @Output() onUndoAutofill: EventEmitter<any> = new EventEmitter();
  loading: boolean;
  user: any;
  loader;
  modalTitle: string = 'Auto-fill History';
  @ViewChild('modal') modal: ModalComponent;
  disablePrimaryButton: boolean;

  constructor(
    private readonly questionnaireService: QuestionnaireService,
    private readonly toaster: ToastrService,
    private readonly sweetAlert: SweetAlertService,
    private readonly store: Store,
    private readonly draftService: DvDraftService
  ) {}

  ngOnInit(): void {
    this.loader = true;
    this.user = this.store.selectSnapshot((state) => state.user.currentUser);
    this.questionnaireService
      .getAutofillHistory(this.diligence.id)
      .pipe(finalize(() => (this.loader = false)))
      .subscribe((res: any) => {
        this.autofillHistory = res;
        autoFillHistoryParse(this.autofillHistory, this.user);

        // if all the responses are deleted/edited, there is nothing to delete so disable the main button as well
        this.disablePrimaryButton =
          this.autofillHistory.filter(
            (history) => history.removed_at || !history.responses_count
          ).length === this.autofillHistory.length;

        this.autofillHistory?.forEach((history) => {
          history.showDetail = false;
        });
      });
  }

  deleteAll(modalCallback) {
    this.draftService.showCountAlert(
      () => this.deleteAllAlert(modalCallback),
      () => {
        setTimeout(() => {
          this.deleteAllAlert(modalCallback);
        }, 0);
      }
    );
  }

  deleteAllAlert(modalCallback) {
    this.sweetAlert.confirm({
      title: `Are you sure you want delete all the auto-filled responses in this project?`,
      text: `Please note that any revised auto-filled responses will not be deleted.`,
      confirmButtonText: 'Yes, Delete',
      showLoaderOnConfirm: true,
      focusCancel: true,
      preConfirm: () => {
        return new Promise<void>((resolve) => {
          this.loading = true;
          this.questionnaireService
            .deleteAllAutofillResponses(this.diligence.id)
            .pipe(
              finalize(() => {
                this.loading = false;
                resolve();
              })
            )
            .subscribe((res: any) => {
              this.store.dispatch(new UpdateDraftData(null));
              this.toaster.success('Responses deleted successfully');
              this.success(true);
              modalCallback();
            });
        });
      },
    });
  }

  undoAutofill(audit) {
    this.draftService.showCountAlert(
      () => this.undoAutofillAlert(audit),
      () => {
        setTimeout(() => {
          this.undoAutofillAlert(audit);
        }, 0);
      }
    );
  }

  undoAutofillAlert(audit) {
    this.sweetAlert.confirm({
      title: `Are you sure you want delete auto-filled responses in this project?`,
      text:
        audit.total_count !== audit.responses_count
          ? `Out of ${audit.total_count} auto-filled responses, ${
              audit.total_count - audit.responses_count
            } responses have manual edits and will not be deleted. This will delete the other ${
              audit.responses_count
            } responses and cannot be undone.`
          : `This will delete ${audit.responses_count} responses and cannot be undone.`,
      confirmButtonText: 'Yes, Delete',
      showLoaderOnConfirm: true,
      focusCancel: true,
      preConfirm: () => {
        return new Promise<void>((resolve) => {
          this.questionnaireService
            .undoAutofill(this.diligence.id, audit.id)
            .pipe(finalize(() => resolve()))
            .subscribe((res: any) => {
              this.store.dispatch(new UpdateDraftData(null));
              this.toaster.success('Responses deleted successfully');
              this.success(true);
              this.modal.closeModal();
            });
        });
      },
    });
  }
}
