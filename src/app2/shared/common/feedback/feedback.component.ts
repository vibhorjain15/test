import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
  FormArray,
} from '@angular/forms';
import { Select, Store } from '@ngxs/store';
import { ToastrService } from 'ngx-toastr';
import { ToggleWritetoUs } from 'src/app2/store/user/user.action';
import { UserState } from 'src/app2/store/user/user.state';

import {
  trigger,
  style,
  transition,
  animate,
} from '@angular/animations';

export const slideInUpAnimation = trigger('slideInUp', [
  transition(':enter', [
    style({ transform: 'translateY(100%)' }),
    animate('0.5s ease-out', style({ transform: 'translateY(0)' })),
  ]),
]);

export const slideDownAnimation = trigger('slideDown', [
  transition(':leave', [
    animate('0.5s ease-in', style({ transform: 'translateY(100%)' })),
  ]),
]);
@Component({
  selector: 'app-feedback',
  templateUrl: './feedback.component.html',
  styleUrls: ['./feedback.component.css'],
  animations: [slideInUpAnimation, slideDownAnimation],
})
export class FeedbackComponent implements OnInit {
  @Input() modelController: FormControl = null;
  @Input() showFeedback = false;
  @Output() close: EventEmitter<void> = new EventEmitter<void>();
  loading_data = true;
  feedback_request_types;
  FTypeID;
  FeedbackText;
  feedback_form: FormGroup;
  testForm: FormGroup;
  feedVals = {};
  feedback_type = {};
  i = 0;
  title: string = 'Save Current View';
  isactive = 0;
  isSubbmited: boolean;
  @Input() visible;

  @Select(UserState.getOpenWritetoUs) canShow;
  constructor(
    private readonly http: HttpClient,
    private readonly toaster: ToastrService,
    private readonly fb: FormBuilder,
    private readonly store: Store
  ) {
    this.constructForm();
  }

  ngOnInit(): void {
    this.getFeedbackTypes();
  }
  getFeedbackTypes() {
    this.http.get(`feedback_types`).subscribe((response: any) => {
      this.loading_data = false;
      this.feedback_request_types = response;
      if (response) {
        this.feedbackForm();
      }
    });
  }

  constructForm() {
    this.feedback_form = new FormGroup({
      config: new FormArray([]),
      FeedbackText: new FormControl(''),
    });
  }

  feedbackForm() {
    this.addConfigBlock();
  }
  setActiveButton(index) {
    this.isactive = index;
  }

  addConfigBlock() {
    let settingBlock = this.feedback_form.get('config') as FormArray;
    this.feedback_request_types.forEach((e: any, i: any) => {
      settingBlock.push(this.fb.group({ ['key' + this.i]: e.value }));
      this.i++;
    });
  }

  cancel(event) {
    event.preventDefault();
    this.store.dispatch(new ToggleWritetoUs());
    this.close.emit();
  }

  processRequest(event) {
    event.preventDefault();
    this.isSubbmited = true;
    if (this.feedback_form.invalid) {
      return;
    }
    const params = {
      FTypeID:
        this.isactive === 0
          ? this.feedback_request_types[0].id
          : this.feedback_request_types[this.isactive].id,
      FeedbackText: this.feedback_form.get('FeedbackText').value,
    };
    this.http.post('feedback', params).subscribe(
      (response: any) => {
        const message = 'Thank you for your feedback!';
        this.store.dispatch(new ToggleWritetoUs());
        this.toaster.success(message, '', { timeOut: 5000 });
      },
      (error) => {}
    );
  }
}
