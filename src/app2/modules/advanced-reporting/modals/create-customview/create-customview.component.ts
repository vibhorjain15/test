import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { from } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { DvValidators } from 'src/app2/shared/validators/no-white-space.validator';

@Component({
  selector: 'app-create-customview',
  templateUrl: './create-customview.component.html',
  styleUrls: ['./create-customview.component.css'],
})
export class CreateCustomViewModal implements OnInit {
  title: string = 'Save Current View';
  customViewForm: FormGroup;
  isSaving: boolean = false;
  isNewGroup: boolean = false;

  @Input() customView = null;
  @Input() customViewGroups = [];
  @Input() reportObj;
  @Input() reportId;
  @Input() onSave;

  constructor(private readonly http: HttpClient) {}

  ngOnInit(): void {
    if (this.customView) {
      this.title = 'Edit View';
    }
    this.customViewForm = new FormGroup({
      name: new FormControl(this.customView?.name, [DvValidators.required]),
      groupId: new FormControl(this.customView?.parent_id, [
        Validators.required,
      ]),
      groupName: new FormControl(null, [DvValidators.required]),
      isNewGroup: new FormControl(!this.customViewGroups?.length),
    });

    this.handleIsNewGroupChange(!this.customViewGroups?.length);
  }

  handleIsNewGroupChange(val) {
    this.isNewGroup = val;
    if (val) {
      this.customViewForm.get('groupName').setValue(null);
      this.customViewForm.get('groupName').enable();
      this.customViewForm.get('groupId').disable();
    } else {
      this.customViewForm.get('groupName').disable();
      this.customViewForm.get('groupId').setValue(this.customView?.parent_id);
      this.customViewForm.get('groupId').enable();
    }
  }

  handleSaveClick(close) {
    this.customViewForm.markAllAsTouched();
    if (this.customViewForm.valid) {
      this.isSaving = true;
      try {
        if (this.customViewForm.value.isNewGroup) {
          this.addNewCustomGroup().subscribe(
            (customViewGroup: any) => {
              this.addOrUpdateCustomView(customViewGroup.id).subscribe(
                (customView) => {
                  if (this.onSave) {
                    this.onSave({ customView, customViewGroup });
                  }
                  close();
                }
              );
            },
            (err) => (this.isSaving = false)
          );
        } else {
          this.addOrUpdateCustomView(
            this.customViewForm.value.groupId
          ).subscribe(
            (customView) => {
              if (this.onSave) {
                this.onSave({ customView });
              }
              close();
            },
            (err) => (this.isSaving = false)
          );
        }
      } catch (err) {
        this.isSaving = false;
      }
    }
  }

  addNewCustomGroup() {
    let params = {
      name: this.customViewForm.value.groupName,
      state: '',
      report_id: this.reportId,
    };
    return this.http.post('PowerBIViews', params);
  }

  addOrUpdateCustomView(parentId) {
    if (this.customView) {
      let params = {
        id: this.customView.id,
        name: this.customViewForm.value.name,
        state: this.customView.state,
        report_id: this.reportId,
        parent_id: parentId,
      };
      return this.http.put(`powerbi_views/${this.customView.id}`, params);
    } else {
      return from(
        this.reportObj.getReport().bookmarksManager.capture({
          allPages: true,
        })
      ).pipe(
        mergeMap((reportResponse: any) => {
          let params = {
            name: this.customViewForm.value.name,
            state: reportResponse.state,
            report_id: this.reportId,
            parent_id: parentId,
          };
          return this.http.post('PowerBIViews', params);
        })
      );
    }
  }
}
