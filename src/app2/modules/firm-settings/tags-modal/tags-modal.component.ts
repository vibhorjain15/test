import { Component, OnInit, Input, DoCheck } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { FirmTagService } from 'src/app2/services/firm-tags.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { Regex, errorMessageMap } from 'src/app2/shared/constants/constant';
import { TagType, typeOptions } from 'src/app2/shared/constants/tag.constant';
import { InterpolatePipe } from 'src/app2/shared/pipes/interpolate.pipe';
import { TagsType } from 'src/app2/shared/types/Tags.type';
import {
  noHtmlValidator,
  noWhitespaceValidator,
} from 'src/app2/shared/validators/no-white-space.validator';
import { filterResponseTypes, validateAllFormFields } from './tags-modal.util';
import { ToastrService } from 'ngx-toastr';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-tags-modal',
  templateUrl: './tags-modal.component.html',
})
export class TagsModal implements OnInit, DoCheck {
  @Input() entityType? = '';
  @Input() entityTypeId?: string;
  @Input() entityId?: any;
  @Input() source?: string;
  @Input() isEditable?: boolean = false;
  @Input() schema_format?: any;
  @Input() existing_tags: TagsType[];
  @Input() editIndex?: number = -1;
  @Input() maxOrder?: any;
  @Input() tagName?: any = '';
  @Input() onSave: any;
  @Input() allowAddAnother: boolean = true;
  tagForm: FormGroup;
  entityTypeName;
  isInvestor: boolean;
  userMode: 'investor' | 'manager';
  option: any;

  title = 'Firms : Create Custom Field(s)';
  firstButtonLabel: string = 'Save';
  secondButtonLabel: string = 'Save & Add another';
  isLoading: boolean = false;
  isSecondaryLoading: boolean = false;

  typeOptions = typeOptions;
  dynamicTypeOptions;
  has_other_option_edit = [];
  questionsList: any = [];
  templateList: any = [];
  loading_questions = false;
  baseUrlSample =
    ' Add the base URL followed by {} to add extension/path later on. Example : https://diligencevault.com/{}';
  loadingCategories: boolean;
  categoriesList: any;
  anlaystEvaluationTemplates: any[];
  allTemplate: any[];
  allRatingCustomFields: any;
  loadingTemplates: boolean;
  hasDuplicateTemplateError: boolean;
  TagType = TagType;

  constructor(
    private utils: UtilsService,
    private tagsService: FirmTagService,
    private readonly interpolatePipe: InterpolatePipe,
    private readonly toaster: ToastrService
  ) {}

  ngOnInit() {
    this.typeOptions = this.utils.sortByAplhaIgnoreCase(
      this.typeOptions,
      'text'
    );
    this.tagForm = new FormGroup({
      tagName: new FormControl(this.tagName ?? null, [
        Validators.required,
        noWhitespaceValidator,
        noHtmlValidator,
      ]),
      tagType: new FormControl(TagType.Text, [Validators.required]),
      dynamicSource: new FormControl('contact', [Validators.required]),
      display_format: new FormControl(''),
      only_review_emplates: new FormControl(false),
      template: new FormControl(null),
      category: new FormControl(null),
      question: new FormControl(null),
      tagDescription: new FormControl('', [noHtmlValidator]),
      hasMultiple: new FormControl(false),
      isMandatory: new FormControl(false),
      hasUrl: new FormControl(false),
      baseUrlName: new FormControl(''),
    });
    this.isEditable = this.editIndex !== -1;
    this.buttonLabels();
    this.entityTypeName = this.utils.getDisplayEntityType(this.entityType);
    this.isInvestor = this.utils.isInvestor();
    this.getModalTitle();
    this.getTemplates();

    this.userMode = this.isInvestor ? 'investor' : 'manager';

    this.loadResponsesTypes();
    if (this.schema_format.dynamic) {
      const dynamicFieldSource =
        this.schema_format.dynamic.format.allowed_subtype;
      this.dynamicTypeOptions = dynamicFieldSource.filter(
        (source) => source.hidden_from != this.userMode
      );
    }
    if (this.editIndex !== -1) {
      const tagVals: TagsType = this.existing_tags[this.editIndex];

      this.tagForm.patchValue({
        tagName: tagVals.alias,
        tagType: tagVals.type,
        dynamicSource: !tagVals.sub_type ? 'contact' : tagVals.sub_type,
        tagDescription: tagVals.description,
        hasMultiple: tagVals.has_multiple,
        isMandatory: tagVals.is_mandatory,
        hasUrl: tagVals.has_href,
        baseUrlName: tagVals.href,
        display_format: tagVals.display_format,
        category: null,
        question: null,
        template: null,
      });
      this.option = {
        responseType: null,
        row: [],
        columns: [],
        options: [],
        dynamicElements: null,
        attachmentUploadEnabled: false,
        has_other_option: false,
      };
      if (
        this.tagForm.value.tagType === TagType.Dropdown ||
        this.tagForm.value.tagType === TagType.CheckBox
      ) {
        const options = tagVals.options.map((option) => {
          if (option.value === 'Other') {
            this.option.has_other_option = true;
            this.has_other_option_edit = [option];
          }
          return {
            id: option.id,
            is_active: true,
            text: option.value,
            type: 'text',
            type_options: { type: 'text' },
          };
        });
        this.option.options = options;
      }
      this.typeOptions = filterResponseTypes(
        this.typeOptions,
        this.tagForm.value.tagType
      );
    } else {
      this.option = {
        responseType: this.tagForm.value.tagType,
        rows: [],
        columns: [],
        options: [],
        dynamic_element: null,
        attachmentUploadEnabled: false,
        has_other_option: false,
      };
      this.tagForm.patchValue({
        hasMultiple: false,
        isMandatory: false,
        hasUrl: false,
      });
    }
  }

  getModalTitle() {
    this.title = `${this.entityTypeName} : ${
      this.isEditable ? 'Update' : 'Create'
    } Custom Field`;
  }

  ngDoCheck() {
    if (this.tagForm.value.hasUrl) {
      this.tagForm
        .get('baseUrlName')
        .setValidators([
          Validators.required,
          Validators.pattern(Regex.validUrl),
        ]);
    } else {
      this.tagForm.get('baseUrlName').clearValidators();
    }
    this.tagForm.get('baseUrlName').updateValueAndValidity();
    if (this.tagForm.value.tagType !== this.option?.responseType) {
      this.option['responseType'] = this.tagForm.value.tagType;
      this.option = JSON.parse(JSON.stringify(this.option));
    }
    if (
      [
        TagType.CheckBox,
        TagType.Link,
        TagType.Dropdown,
        TagType.Dynamic,
        TagType.Paragraph,
        TagType.Rating,
      ].includes(this.tagForm.value.tagType)
    ) {
      this.tagForm.value.hasUrl = false;
    }

    if (this.tagForm.value.tagType == TagType.Question) {
      this.tagForm.get('question').setValidators([Validators.required]);
      this.tagForm.get('template').setValidators([Validators.required]);
    } else if (this.tagForm.value.tagType == TagType.Rating) {
      this.tagForm.get('template').setValidators([Validators.required]);
      this.tagForm.get('display_format').setValidators([Validators.required]);
    } else {
      this.tagForm.get('baseUrlName').clearValidators();
    }
    if (this.tagForm.value.tagType != TagType.Rating) {
      this.tagForm.patchValue({
        only_review_emplates: false,
      });
      this.reviewTemplateSelection(false);
    }
    this.tagForm.get('question').updateValueAndValidity();
    this.tagForm.get('display_format').updateValueAndValidity();
    this.tagForm.get('template').updateValueAndValidity();
  }

  getTemplates() {
    this.loadingTemplates = true;
    if (['firm', 'strategy', 'fund', 'vehicle'].includes(this.entityType)) {
      forkJoin([
        this.tagsService.getAllActiveTemplates(),
        this.tagsService.getAllAnalystEvaluationTemplates(),
        this.tagsService.getAllCustomFields(this.entityType),
      ])
        .pipe(
          catchError((error) => {
            this.loadingTemplates = false;
            return of([[], [], {}]); // Default values to avoid breaking the flow
          })
        )
        .subscribe(([allTemplates, analystTemplates, allCustomFields]: any) => {
          this.allTemplate = allTemplates;
          this.anlaystEvaluationTemplates = analystTemplates;
          this.allRatingCustomFields = allCustomFields['custom_fields'][
            this.entityType
          ]?.filter((field) => field.type == TagType.Rating);
          this.templateList = allTemplates;
          this.loadingTemplates = false;
          this.selectTemplate();
        });
    } else {
      this.tagsService.getAllActiveTemplates().subscribe((templates: any) => {
        this.allTemplate = templates;
        this.templateList = this.allTemplate;
        this.loadingTemplates = false;
        this.selectTemplate();
      });
    }
  }
  reviewTemplateSelection(isAnalystEvaluationSelected: boolean) {
    // Update the template list based on the selection
    this.templateList = isAnalystEvaluationSelected
      ? this.anlaystEvaluationTemplates
      : this.allTemplate;

    const selectedTemplateId = this.tagForm.value.template;

    // Clear the form value if the selected template is no longer valid
    if (
      selectedTemplateId &&
      !this.templateList.some((template) => template.id === selectedTemplateId)
    ) {
      this.tagForm.patchValue({ template: null });
    }
  }

  selectTemplate() {
    if (this.editIndex !== -1) {
      const tagVals: TagsType = this.existing_tags[this.editIndex];
      if (tagVals.template_id) {
        this.tagForm.patchValue({
          template: tagVals.template_id,
        });
        this.handleChangeTemplate(tagVals.template_id);
      }
    }
  }

  handleChangeTemplate(templateId) {
    if (this.tagForm.value.tagType == TagType.Question) {
      this.tagForm.patchValue({
        question: null,
      });
      this.getQuestionsList(templateId);
    }
    if (this.tagForm.value.tagType == TagType.Rating) {
      this.tagForm.patchValue({
        category: null,
      });
      this.getCategoriesList(templateId);
    }
  }

  getCategoriesList(templateId) {
    this.loadingCategories = true;
    //use all template list to get version because we don't get in review template list data
    const template = this.allTemplate.find(
      (template) => template.id == templateId
    );
    if (template) {
      this.tagsService
        .getTemplateCategories(template.id, template.version)
        .subscribe(
          (response: any) => {
            this.categoriesList = response.filter((cat) => !cat?.parentID);
            this.categoriesList = this.categoriesList.map((category) => {
              category.disabled = !!this.allRatingCustomFields.find(
                (rating) => rating.category_group_id == category.group_id
              );
              return category;
            });
            if (this.editIndex !== -1) {
              const tagVals: TagsType = this.existing_tags[this.editIndex];
              this.tagForm.patchValue({
                category: tagVals?.category_group_id,
              });
            } else {
              const isTemplateUsed = !!this.allRatingCustomFields.find(
                (rating) =>
                  rating.template_id === template.id &&
                  !rating.category_group_id
              );
              const areAllCategoriesUsed =
                this.categoriesList.length ==
                this.categoriesList.filter((cat) => cat.disabled).length;
              this.hasDuplicateTemplateError =
                isTemplateUsed && areAllCategoriesUsed;
            }
            this.loadingCategories = false;
          },
          (error) => {
            this.loadingCategories = false;
          }
        );
    }
  }

  getQuestionsList(templateId) {
    this.loading_questions = true;
    this.tagsService.getTemplateQuestions(templateId).subscribe(
      (response: any) => {
        this.questionsList = response.filter(
          (question) =>
            ![
              'Attachment',
              'ReturnTable',
              'aumTable',
              'Grid',
              'DynamicGrid',
              'TextMultiLine',
            ].includes(question.responseType)
        );
        if (this.editIndex !== -1) {
          const tagVals: TagsType = this.existing_tags[this.editIndex];
          if (tagVals.questions && tagVals.questions.length > 0) {
            this.tagForm.patchValue({
              question: tagVals.questions[0],
            });
          }
        }
        this.loading_questions = false;
      },
      (error) => {
        this.loading_questions = false;
      }
    );
  }

  loadResponsesTypes() {
    this.typeOptions = this.typeOptions.filter(
      (val) =>
        !val.hiddenFrom?.includes(this.source) &&
        !val.hiddenFrom?.includes(this.userMode) &&
        !(
          val.hiddenFrom?.includes('freeInvestor') &&
          this.utils.isFreeInvestor()
        )
    );
  }

  handleSecondClick(callback) {
    this.save(true, callback);
  }

  save(addAnother = false, callback?: () => void) {
    validateAllFormFields(this.tagForm);
    if (this.tagForm.valid) {
      if (addAnother) this.isSecondaryLoading = true;
      else this.isLoading = true;
      const {
        hasMultiple,
        tagDescription,
        dynamicSource,
        display_format,
        question,
        template,
        category,
        tagType,
        tagName,
        hasUrl,
        baseUrlName,
        isMandatory,
      } = this.tagForm.value;
      const params = {
        entity_type: this.entityTypeId ? this.entityTypeId : 0,
        schema_type: this.entityType,
        entity_id: this.entityId ? this.entityId : 0,
        custom_fields: [],
      };

      const innerObj = {
        type: tagType,
        has_multiple: hasMultiple,
        has_href: hasUrl,
        href: hasUrl ? baseUrlName : null,
        is_mandatory: isMandatory,
        description: tagDescription,
        status: true,
        visible: 1,
        alias: tagName,
        value: '',
        questions: null,
        template_id: null,
        category_group_id: null,
        display_format: null,
        is_linked: false,
      };

      if (tagType === TagType.Paragraph) {
        innerObj.has_multiple = false;
        innerObj.has_href = false;
        innerObj.href = '';
      }

      if (tagType === TagType.Question) {
        innerObj.template_id = template;
        innerObj.questions = [question];
        innerObj.has_multiple = false;
        innerObj.has_href = false;
        innerObj.is_linked = true;
        innerObj.href = '';
      }

      if (tagType === TagType.Rating) {
        innerObj.template_id = template;
        innerObj.category_group_id = category;
        innerObj.has_multiple = false;
        innerObj.has_href = false;
        innerObj.is_linked = false;
        innerObj.href = '';
        innerObj.display_format = display_format;
      }

      if (tagType === TagType.Dropdown || tagType === TagType.CheckBox) {
        innerObj['options'] = this.option.options.map((option) => ({
          value: option.text,
          id: option.id,
        }));
        innerObj.has_multiple = false;
        innerObj.has_href = false;
        innerObj.href = '';

        if (this.option.has_other_option) {
          !this.has_other_option_edit.length
            ? innerObj['options'].push({
                value: 'Other',
                is_active: true,
                id: 0,
              })
            : innerObj['options'].push(this.has_other_option_edit[0]);
        }
        if (
          !innerObj['options'].every((x) => {
            if (!x.value) return false;
            return x.value?.trim().length > 0;
          })
        ) {
          if (addAnother) this.isSecondaryLoading = false;
          else this.isLoading = false;
          return;
        }
      }
      if (tagType === TagType.Link) {
        innerObj.has_href = false;
        innerObj.href = '';
      }
      if (tagType === TagType.Dynamic) {
        innerObj['sub_type'] = dynamicSource;
        innerObj['endpoint'] = '';
        innerObj.has_href = false;
        innerObj.href = '';
      }
      params.custom_fields.push(innerObj);
      if (this.isEditable) {
        const ogTag = this.existing_tags[this.editIndex];
        if (
          (ogTag.type === 'dropdown' || ogTag.type === 'checkbox') &&
          ogTag.options.length > innerObj['options'].length
        ) {
          for (let i = 0; i < ogTag.options.length; i++) {
            if (
              innerObj['options'].filter(
                (val) => val.id === ogTag.options[i].id
              ).length === 0
            ) {
              innerObj['options'].push({
                value: ogTag.options[i].value,
                id: ogTag.options[i].id,
                status: 0,
              });
            }
          }
        }
        params.custom_fields[0] = {
          ...ogTag,
          ...params.custom_fields[0],
        };
        this.tagsService.updateCustumTag(
          params,
          () => {
            this.successCall(addAnother, callback);
            this.getModalTitle();
          },
          () => this.failureCall(addAnother)
        );
      } else {
        this.tagsService.addCustomTag(
          params,
          () => {
            if (this.source == 'bulk-upload') {
              this.onSave(innerObj);
            }
            this.toaster.success('Tag added successfully');
            this.successCall(addAnother, callback);
          },
          () => this.failureCall(addAnother)
        );
      }
    }
  }

  successCall(addAnother, callback) {
    if (addAnother) {
      this.isSecondaryLoading = false;
      if (this.isEditable) {
        this.editIndex = -1;
        this.isEditable = false;
        this.buttonLabels();
        this.typeOptions = typeOptions;
      }
    } else {
      this.isLoading = false;
      callback();
    }
    this.resetForm();
  }

  failureCall(addAnother) {
    if (addAnother) {
      this.isSecondaryLoading = false;
    } else {
      this.isLoading = false;
    }
  }

  handleOnClick(callback) {
    this.save(false, callback);
  }

  getErrorMessage(controlName: string, fieldName?: string): string {
    const control = this.tagForm.get(controlName);
    const hasError =
      control && control?.touched && control?.invalid && control?.errors;
    if (hasError && (control.errors.required || control.errors.whitespace)) {
      return this.interpolatePipe.transform(
        errorMessageMap?.required,
        fieldName
      );
    } else if (
      hasError &&
      (control.errors?.required || control?.errors?.containsHtml)
    ) {
      return this.interpolatePipe.transform(
        errorMessageMap.containsHtml,
        fieldName
      );
    }
    if (hasError && control.errors.pattern) {
      if (controlName === 'baseUrlName') {
        return this.interpolatePipe.transform(
          errorMessageMap?.pattern,
          'Please enter a valid domain or website'
        );
      }
    }
    return '';
  }

  resetForm() {
    validateAllFormFields(this.tagForm, false);
    this.tagForm.patchValue({
      tagName: '',
      tagType: TagType.Text,
      dynamicSource: 'contact',
      tagDescription: '',
      hasMultiple: false,
      isMandatory: false,
      hasUrl: false,
      baseUrlName: '',
      question: null,
      template: '',
      category: null,
      display_format: null,
    });
    this.option = {
      responseType: null,
      row: [],
      columns: [],
      options: [],
      dynamicElements: null,
      attachmentUploadEnabled: false,
      has_other_option: false,
    };
  }

  buttonLabels() {
    this.firstButtonLabel = this.isEditable ? 'Update' : 'Save';
    this.secondButtonLabel = this.isEditable
      ? 'Update & Add another'
      : 'Save & Add another';
  }
}
