import { Component, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Select, Store } from '@ngxs/store';
import { UserState } from 'src/app2/store/user/user.state';
import { GetCurrentUser } from 'src/app2/store/user/user.action';
import { take, tap } from 'rxjs/operators';
import { Regex } from '../../constants/constant';

@Component({
  selector: 'app-entity-contacts',
  templateUrl: './entity-contacts.component.html',
  styleUrls: ['./entity-contacts.component.css'],
})
export class EntityContactsComponent implements OnInit {
  contactForm: FormGroup;
  message = "You've entered this Contact email already";
  @Select(UserState.getCurrentUserData) user;
  validateEmail =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  isInvestor: any;

  get contacts(): FormArray {
    return this.contactForm.get('contacts') as FormArray;
  }
  checkFormArray() {
    this.contacts.controls.forEach((x) => {
      (x as FormGroup).get('username').updateValueAndValidity();
    });
  }
  getRepName(index: number) {
    return this.contacts
      ? (this.contacts.at(index) as FormGroup).get('username')
      : null;
  }

  constructor(private fb: FormBuilder, private readonly store: Store) {}

  ngOnInit(): void {
    this.user
      .pipe(
        take(2),
        tap((userData) => {
          if (!userData) {
            this.store.dispatch(new GetCurrentUser());
          }
        })
      )
      .subscribe((data) => {
        if (data) {
          this.isInvestor = data.isInvestor;
        }
      });
    this.contactForm = this.fb.group({
      contacts: this.fb.array([this.createRep(), this.createRep(1)]),
    });
    this.removeLastContact();
  }

  createRep(index: number = 0, data: any = null) {
    data = data || { username: null, passport: null, phoneNumber: null };
    const usernameValidators = [
      Validators.pattern(this.validateEmail),
      this.checkIfUnique(index),
    ];

    if (this.isInvestor) {
      usernameValidators.unshift(Validators.required);
    }
    return this.fb.group({
      username: [
        '',
        [
          Validators.required,
          Validators.pattern(Regex.validEmail),
          this.checkIfUnique(index),
        ],
      ],
    });
  }

  addNewContact() {
    const usernameValidators = [
      Validators.pattern(Regex.validEmail),
      this.checkIfUnique(1),
    ];

    if (this.isInvestor) {
      usernameValidators.unshift(Validators.required);
    }

    this.contacts.push(
      this.fb.group({
        username: [
          '',
          [
            Validators.required,
            Validators.pattern(Regex.validEmail),
            this.checkIfUnique(1),
          ],
        ],
      })
    );
  }
  checkIfUnique(index) {
    return (control: FormControl) => {
      const formArray =
        control.parent && control.parent.parent
          ? (control.parent.parent as FormArray)
          : null;
      if (formArray && formArray.controls.length) {
        for (let i = index - 1; i >= 0; i--) {
          if (
            control.value &&
            (formArray.at(i) as FormGroup).get('username').value ==
              control.value
          )
            return { errorRepeat: true };
        }
      }
    };
  }

  removeLastContact() {
    this.contacts.removeAt(this.contacts.length - 1);
  }

  // this needs to be called from parent component on Submit button to check validity.
  isFormValid() {
    if (!this.contactForm.valid) {
      this.contactForm.markAllAsTouched();
      return this.contactForm.valid;
    }
    return true;
  }

  // this needs to be called from parent component on Submit button.
  getAddedContacts() {
    return this.contactForm.value.contacts;
  }

  // this needs to be called from parent component to reset the form
  resetForm() {
    this.contactForm = this.fb.group({
      contacts: this.fb.array([this.createRep(), this.createRep(1)]),
    });
    this.removeLastContact();
  }
}
