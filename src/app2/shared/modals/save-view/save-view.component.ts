import { Component, Input, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import {
  Regex,
  VIEW_ACCESS_LEVELS,
  errorMessageMap,
} from '../../constants/constant';
import { DvValidators } from '../../validators/no-white-space.validator';
import { GridService } from 'src/app2/services/grid.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-save-view',
  templateUrl: './save-view.component.html',
  styleUrls: ['./save-view.component.css'],
})
export class SaveViewModal implements OnInit {
  loading: boolean;
  saveViewForm: FormGroup;
  renameViewForm: FormGroup;
  minDate: Date;
  errorMessageMap = errorMessageMap;
  VIEW_ACCESS_LEVELS = VIEW_ACCESS_LEVELS;
  title;
  canHandleAccess;
  @Input() state;
  @Input() viewList;
  @Input() user;
  @Input() onSave;
  @Input() action;
  constructor(
    private readonly gridService: GridService,
    private readonly toasterService: ToastrService
  ) {}

  ngOnInit(): void {
    this.canHandleAccess =
      this.user.isSuperAdmin || this.user.isBusinessAdmin || this.user.isOwner;
    switch (this.action) {
      case 'add':
        this.title = 'Save Current Grid View';
        this.saveViewForm = new FormGroup({
          name: new FormControl('', [
            DvValidators.required,
            Validators.required,
            Validators.maxLength(150),
            Validators.pattern(Regex.avoidFirstSplCharacter),
            this.uniqueNameValidator,
          ]),
          description: new FormControl('', [Validators.maxLength(150)]),
          is_default: new FormControl(''),
          access_level: new FormControl(this.VIEW_ACCESS_LEVELS.USER),
        });
        break;
      case 'rename':
        this.title = 'Edit View';

        this.renameViewForm = new FormGroup({
          name: new FormControl(this.state.name, [
            DvValidators.required,
            Validators.required,
            Validators.maxLength(150),
            Validators.pattern(Regex.avoidFirstSplCharacter),
            this.uniqueNameValidator,
          ]),
          description: new FormControl(this.state.description, [
            Validators.maxLength(150),
          ]),
          access_level: new FormControl(this.state.level),
        });
        break;
    }
  }

  uniqueNameValidator = (control): ValidationErrors | null => {
    const nameExists =
      this.viewList &&
      this.viewList.some((item) => {
        return (
          item.id != this.state.id &&
          item.name?.toLowerCase()?.trim() ===
            (control.value?.toLowerCase() || '').trim()
        );
      });
    return nameExists ? { nameExists: true } : null;
  };

  submit(close) {
    if (this.action === 'add') {
      if (!this.saveViewForm.valid) {
        this.saveViewForm.markAllAsTouched();
        return;
      }
      this.loading = true;
      let params = {
        ...this.state,
        name: this.saveViewForm.get('name').value,
        description: this.saveViewForm.get('description').value,
        is_default: this.saveViewForm.get('is_default').value ? true : false,
        level: this.saveViewForm.get('access_level').value,
      };
      this.gridService.saveView(params).subscribe(
        (response) => {
          this.toasterService.success('View Saved Successfully.');
          if (this.onSave) {
            this.onSave(response);
          }
          this.loading = false;
          close();
        },
        () => {
          this.toasterService.error('Failed to save view!');
          this.loading = false;
        }
      );
    } else if (this.action === 'rename') {
      if (!this.renameViewForm.valid) {
        this.renameViewForm.markAllAsTouched();
        return;
      }
      this.loading = true;
      let params = {
        ...this.state,
        name: this.renameViewForm.get('name').value,
        description: this.renameViewForm.get('description').value,
        level: this.renameViewForm.get('access_level').value,
      };
      this.gridService.updateView(params).subscribe(
        (response) => {
          this.toasterService.success('View Updated Successfully.');
          if (this.onSave) {
            this.onSave(response);
          }
          this.loading = false;
          close();
        },
        () => {
          this.toasterService.error('Failed to update view!');
          this.loading = false;
        }
      );
    }
  }
}
