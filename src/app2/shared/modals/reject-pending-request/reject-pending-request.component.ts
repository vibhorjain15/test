import { Component, Input, NgZone, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
} from '@angular/forms';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';

@Component({
  selector: 'app-reject-pending-request',
  templateUrl: './reject-pending-request.component.html',
})
export class RejectPendingRequestComponent implements OnInit {
  @Input() success: any;
  rejectPendingRequestForm: FormGroup;
  tinyMceInit;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly customModalService: CustomModalService,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.tinyMceInit = {
      placeholder: 'Leave a note for your decision.',
    };
  }

  initForm() {
    this.rejectPendingRequestForm = this.formBuilder.group({
      note: new FormControl(''),
    });
  }

  handleEditorTextChange(note: string) {
    this.rejectPendingRequestForm.controls.note.setValue(note);
  }

  submit() {
    this.success(this.rejectPendingRequestForm.value.note);
    this.customModalService.close();
  }

  closeModal() {
    this.customModalService.close();
  }
}
