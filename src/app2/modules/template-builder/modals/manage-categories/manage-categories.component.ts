import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngxs/store';
import { finalize, take } from 'rxjs/operators';
import { DvTextLimits } from 'src/app2/shared/constants/constant';
import { noHtmlValidator, noWhitespaceValidator } from 'src/app2/shared/validators/no-white-space.validator';
import {
  CreateBulkCategories,
  CreateBulkSubCategories,
  CreateCategories,
  CreateSubCategories,
  UpdateCategories,
  UpdateSubCategories,
  UpdateTemplate,
} from '../../store/template-builder.action';

@Component({
  selector: 'manage-category',
  templateUrl: './manage-categories.component.html',
  styleUrls: ['./manage-categories.component.css'],
})
export class ManageCategoriesComponent implements OnInit {
  @Input() category = null;
  @Input() currentLength = 0;
  @Input() type: 'category' | 'sub-category' = 'category';
  @Input() parentID;
  @Input() categoryName;
  @Input() data?;
  loading = false;
  isEdit = false;
  manageCategoryForm: FormGroup;
  isSingleEntry = false;
  isMultileAnswerAllowed = false;
  title = 'Adding New Categories';
  pluralMap = { category: 'categories', 'sub-category': 'sub-categories' };
  typeMap = { category: 'category', 'sub-category': 'Subcategory' };
  newOptions = [];
  tinyValue = null;
  tinyInit;
  bulkOptions;
  subTitle = null;
  isTouched = false;
  dvTextLimits = DvTextLimits;
  isBulkOptionsInvalid = false;
  isBulkTypeValid = true;
  constructor(private store: Store) {}

  ngOnInit(): void {
    if (this.type === 'category') {
      this.categoryName = null;
    }
    this.bulkOptions = this.type === 'category' ? 'category' : 'sub-category';
    this.tinyInit = {
      statusbar: true,
      placeholder: 'Examples or any guidelines on answering',
    };
    if (this.category) {
      this.isEdit = true;
      this.isSingleEntry = true;
      this.manageCategoryForm = new FormGroup({
        name: new FormControl(this.category.label, [
          Validators.required,
          Validators.maxLength(this.dvTextLimits.CATEGORY_TEXT_LIMIT),
          noWhitespaceValidator,
          noHtmlValidator
        ]),
      });
      this.isMultileAnswerAllowed = this.category.isMultiple;
      this.tinyValue = this.category.headerText;
    } else
      this.manageCategoryForm = new FormGroup({
        name: new FormControl(null, [
          Validators.required,
          Validators.maxLength(this.dvTextLimits.CATEGORY_TEXT_LIMIT),
          noWhitespaceValidator,
          noHtmlValidator
        ]),
      });
    this.generateModalTitle();
    if (this.isEdit) {
      this.title = `Edit ${this.type}: ${this.category.label}`;
    }
  }

  generateModalTitle() {
    if (this.type === 'category') {
      const templateName = this.store.selectSnapshot(
        (state) => state.template.template.templateInfo.name
      );
      this.title = `New Category in Template: ${templateName}`;
    } else if (this.type === 'sub-category') {
      this.title = this.isSingleEntry
        ? `New Sub-category`
        : `New Sub-categories`;
      this.subTitle = `CAT: ${
        this.category?.catName ?? this.data?.name ?? this.categoryName
      }`;
    }
  }

  handleCheckChange(val) {
    this.newOptions = [];
    this.isSingleEntry = val;
    if (!val) {
      this.isTouched = false;
      this.manageCategoryForm.get('name').setErrors(null);
    } else {
      this.manageCategoryForm.get('name').setErrors({ required: true });
      this.manageCategoryForm.get('name').markAsUntouched();
    }
    this.generateModalTitle();
  }

  storeDispatch(action, close) {
    this.store
      .dispatch(action)
      .pipe(
        finalize(() => {
          this.loading = false;
        }),
        take(1))
      .subscribe(() => {
        this.loading = false;
        close();
      });
  }

  handleEditChange(data) {
    this.tinyValue = data;
  }

  save(close) {
    if (!this.isBulkTypeValid) return;
    this.loading = true;
    this.isTouched = true;
    this.manageCategoryForm.markAllAsTouched();
    if (this.isSingleEntry && this.manageCategoryForm.valid) {
      if (this.type === 'category')
        this.storeDispatch(
          this.isEdit
            ? new UpdateCategories(this.category.id, {
                name: this.manageCategoryForm.value.name,
                headerText: null,
                isMultiple: false,
              })
            : new CreateCategories({
                name: this.manageCategoryForm.value.name,
              }),
          close
        );
      else {
        this.storeDispatch(
          this.isEdit
            ? new UpdateSubCategories(this.category.id, {
                name: this.manageCategoryForm.value.name,
                headerText: this.tinyValue,
                isMultiple: this.isMultileAnswerAllowed,
              })
            : new CreateSubCategories({
                name: this.manageCategoryForm.value.name,
                headerText: this.tinyValue,
                isMultiple: this.isMultileAnswerAllowed,
                parentID: this.parentID,
              }),
          close
        );
        this.store.dispatch(new UpdateTemplate({}));
      }
    } else {
      let newOptions = this.newOptions.filter((x) => x.text?.trim().length);
      if (newOptions && newOptions.length) {
        this.isBulkOptionsInvalid =
          this.newOptions.filter(
            (x) => x.text?.length > this.dvTextLimits.CATEGORY_TEXT_LIMIT
          ).length > 0;
        if (this.isBulkOptionsInvalid) {
          this.loading = false;
          return;
        }
        let params: any = {
          sections: newOptions.map((val) => {
            return { name: val.text };
          }),
        };
        if (this.type === 'category') {
          this.storeDispatch(new CreateBulkCategories(params), close);
        } else {
          params = { ...params, parentSection_id: this.parentID };
          this.storeDispatch(new CreateBulkSubCategories(params), close);
        }
        this.store.dispatch(new UpdateTemplate({}));
      } else {
        this.newOptions = newOptions;
        this.loading = false;
      }
    }
  }

  handleAnswerCheckChange(val) {
    this.isMultileAnswerAllowed = val;
  }
}
