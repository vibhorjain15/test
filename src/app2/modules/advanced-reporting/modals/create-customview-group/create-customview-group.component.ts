import { HttpClient } from '@angular/common/http';
import { Component, Input } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { DvValidators } from 'src/app2/shared/validators/no-white-space.validator';

@Component({
  selector: 'app-create-customview-group',
  templateUrl: './create-customview-group.component.html',
  styleUrls: ['./create-customview-group.component.css'],
})
export class CreateCustomviewGroupModal {
  title: string = 'Add Group';
  customViewGroupForm: FormGroup;
  isSaving: boolean = false;

  @Input() customViewGroup = null;
  @Input() reportId;
  @Input() onSave;

  constructor(
    private readonly http: HttpClient,
    private readonly toaster: ToastrService
  ) {}

  ngOnInit(): void {
    if (this.customViewGroup) {
      this.title = 'Edit Group';
    }
    this.customViewGroupForm = new FormGroup({
      name: new FormControl(this.customViewGroup?.name, [
        DvValidators.required,
      ]),
    });
  }

  handleSaveClick(close) {
    this.customViewGroupForm.markAllAsTouched();
    if (this.customViewGroupForm.valid) {
      this.isSaving = true;
      try {
        if (this.customViewGroup) {
          let params = {
            id: this.customViewGroup.id,
            name: this.customViewGroupForm.value.name,
            state: '',
            report_id: this.reportId,
          };
          this.http
            .put(`powerbi_views/${this.customViewGroup.id}`, params)
            .subscribe(
              (response) => {
                if (this.onSave) {
                  this.onSave(response);
                }
                close();
              },
              (err) => (this.isSaving = false)
            );
        } else {
          let params = {
            name: this.customViewGroupForm.value.name,
            state: '',
            report_id: this.reportId,
          };
          this.http.post('PowerBIViews', params).subscribe(
            (response) => {
              if (this.onSave) {
                this.onSave(response);
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
}
