import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'mfw-request',
  templateUrl: './mfw-request.component.html',
  styleUrls: ['./mfw-request.component.css']
})
export class MfwRequestModal implements OnInit {
  mfwForm: FormGroup;
  @Input() feedbackTypeid: number;
  loading: boolean = false;

  constructor(private http: HttpClient, private toaster: ToastrService) { }

  ngOnInit(): void {
    this.mfwForm = new FormGroup({
      text: new FormControl('', Validators.required)
    });
  }

  requestResearch(modalCallback) {
    if (!this.mfwForm.valid) {
      this.mfwForm.markAllAsTouched();
      return;
    }
    this.loading = true;
    const payload: any = {
      FTypeID: this.feedbackTypeid,
      FeedbackText: this.mfwForm.get('text').value
    }

    this.http.post(`feedback`, payload).subscribe(() => {
      this.toaster.success('Thank you for your feedback!');
      this.loading = false;
      modalCallback();
    });
  }
}

