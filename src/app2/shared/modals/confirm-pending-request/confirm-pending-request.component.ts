import { Component, Input, OnInit, NgZone } from '@angular/core';
import { FormGroup, FormBuilder, FormControl } from '@angular/forms';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';

@Component({
  selector: 'app-confirm-pending-request',
  templateUrl: './confirm-pending-request.component.html',
  styleUrls: ['./confirm-pending-request.component.css'],
})
export class ConfirmPendingRequestComponent implements OnInit {
  @Input() success: any;
  confirmPendingRequestForm: FormGroup;
  tinyMceInit;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly customModalService: CustomModalService,
    private ngZone: NgZone
  ) {}

  openQuestionnaireUploadModal(editor) {
    this.ngZone.run(() => {
      this.customModalService.invoke('questionnaire-upload-image', {
        initialState: {
          editor: editor,
        },
        class: 'modal-xl',
      });
    });
  }

  ngOnInit(): void {
    this.initForm();
    this.tinyMceInit = {
      placeholder: 'Leave a note for your decision.',
    };
  }

  initForm() {
    this.confirmPendingRequestForm = this.formBuilder.group({
      note: new FormControl(''),
    });
  }

  handleEditorTextChange(note: string) {
    this.confirmPendingRequestForm.controls.note.setValue(note);
  }

  submit() {
    this.success(this.confirmPendingRequestForm.value.note);
    this.customModalService.close();
  }

  closeModal() {
    this.customModalService.close();
  }
}
