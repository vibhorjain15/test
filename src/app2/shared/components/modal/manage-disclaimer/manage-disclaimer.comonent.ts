import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { validateAllFormFields } from 'src/app2/modules/firm-settings/tags-modal/tags-modal.util';
import { ManageDisclaimerService } from 'src/app2/services/manage-disclaimer/manage-disclaimer.service';
import {
  DisclaimerRequestType,
  IDisclaimerObject,
} from 'src/app2/services/manage-disclaimer/manage-disclaimer.types';

@Component({
  selector: 'manage-disclaimer',
  templateUrl: './manage-disclaimer.component.html',
})
export class ManageDisclaimerModal implements OnInit {
  @Input() disclaimerObj: IDisclaimerObject;
  manageDisclaimerForm: FormGroup;
  isEdit: boolean = false;
  loading: boolean = false;
  tinyMceInit;
  constructor(private readonly ManageDisService: ManageDisclaimerService) {}
  ngOnInit() {
    if (this.disclaimerObj) {
      this.isEdit = true;
      this.manageDisclaimerForm = new FormGroup({
        name: new FormControl(this.disclaimerObj.name, [Validators.required]),
        text: new FormControl(this.disclaimerObj.text, [Validators.required]),
      });
    } else {
      this.manageDisclaimerForm = new FormGroup({
        name: new FormControl('', [Validators.required]),
        text: new FormControl('', [Validators.required]),
      });
    }

    this.tinyMceInit = {
      placeholder: 'Please enter some text',
    };
  }

  handleEditChange(text) {
    this.manageDisclaimerForm.patchValue({
      text: text,
    });
    this.manageDisclaimerForm.get('text').markAsTouched({ onlySelf: true });
  }

  save(callback) {
    validateAllFormFields(this.manageDisclaimerForm);
    if (this.manageDisclaimerForm.valid) {
      this.loading = true;
      let { name, text } = this.manageDisclaimerForm.value;
      if (this.isEdit) {
        let params: IDisclaimerObject = { ...this.disclaimerObj, name, text };
        this.ManageDisService.updatedDisclaimer(
          params,
          () => {
            this.loading = false;
            callback();
          },
          () => {
            this.loading = false;
          }
        );
        return;
      }
      let params: DisclaimerRequestType = { name, text };
      this.ManageDisService.createDisclaimer(
        params,
        () => {
          this.loading = false;
          callback();
        },
        () => {
          this.loading = false;
        }
      );
    }
  }
}
