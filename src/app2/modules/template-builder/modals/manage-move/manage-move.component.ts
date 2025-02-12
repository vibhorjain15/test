import { AfterViewInit, Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngxs/store';
import {
  ConvertCategory,
  CopyQuestions,
  MoveQuestions,
  MoveSubCategories,
  UpdateError,
  UpdateTemplate,
} from '../../store/template-builder.action';
import { ToastrService } from 'ngx-toastr';
import { ERROR_CODES } from 'src/app2/shared/constants/constant';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { RouterService } from 'src/app2/services/router.service';
@Component({
  selector: 'manage-move',
  templateUrl: './manage-move.component.html',
  styleUrls: ['./manage-move.component.css'],
})
export class ManageMoveComponent implements OnInit, AfterViewInit {
  @Input() type?: string = 'question';
  @Input() CategoryList: any[] = [];
  @Input() selectedQuestions = [];
  @Input() parentCatId: number;
  @Input() parentCatName: string;
  color = {
    primary: '#126b82',
    orange: '#f0592b',
    success: '#27b098',
    default: '#333',
  };
  subCategoryList?: any[] = [];
  categorySelected: any = '';
  buttonLoader = false;
  secondButtonLoader = false;
  subCategorySelected: any = '';
  searchParameter: string = ''; // for filtering out searched categories in modal
  CategoryListCopy; // copy for category list (deep copy)
  title: string = ''; // title for modal
  sourceQuestionSectionID: number;
  isAccordionOpen = false;
  copyQuestionsToSubcategories = {};
  firstButtonTitle = '';
  templateData: any = '';
  isCopy: boolean = false;
  inpLabel: string = '';
  accordionIsOpen: any = {}; // control and maintain the state of accordion
  constructor(
    private readonly store: Store,
    private readonly toaster: ToastrService,
    private readonly sweetAlertService: SweetAlertService,
    private readonly routerService: RouterService
  ) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    if (this.type == 'question' && this.isCopy) {
      this.inpLabel = 'Copy Questions To';
      this.title = 'Copy Questions';
      this.firstButtonTitle = 'Copy Questions';
    } else if (this.type == 'question' && !this.isCopy) {
      this.inpLabel = 'Move Questions To';
      this.title = 'Move Questions';
      this.firstButtonTitle = 'Move Questions';
    } else {
      this.inpLabel = 'Move To';
      this.title = 'Move Sub-categories';
      this.firstButtonTitle = 'Move Sub-categories';
    }

    this.CategoryListCopy = JSON.parse(JSON.stringify(this.CategoryList));
    if (this.type == 'question')
      this.sourceQuestionSectionID = this.selectedQuestions[0].sectionID;

    this.templateData = this.store.selectSnapshot(
      (state) => state.template.template
    );
  }

  moveSubcatCategory(catId) {
    if (catId != this.parentCatId) this.categorySelected = catId;
  }
  // when the delete icon in the tags are clicked
  onDelete(index: number, type: string) {
    if (type === 'sub-category') this.subCategoryList.splice(index, 1);
    else this.selectedQuestions.splice(index, 1);
  }

  // when the value of input field is changed
  onParameterChange(parameter: string) {
    this.accordionIsOpen = {};
    this.CategoryList = this.CategoryListCopy.filter((obj) => {
      return obj.label.toLowerCase().includes(parameter.toLowerCase());
    });
  }

  emittedValue(event, catId, index: number) {
    if (catId === this.categorySelected) return;
    else this.copyQuestionsToSubcategories = {};
    this.accordionIsOpen = {};
    this.accordionIsOpen[index] = true;
    this.categorySelected = catId;
    this.subCategorySelected = '';
  }

  // whenever move button - primary is clicked
  moveButton(close, type: string) {
    this.buttonLoader = true;
    if (type == 'sub-category') {
      if (this.categorySelected) {
        const payload = {
          destination_section_id: this.categorySelected,
          sections: this.subCategoryList,
          source_section_id: this.subCategoryList[0].parentID,
          template_id: this.templateData.templateInfo.id,
          template_version: this.templateData.templateInfo.version,
        };

        this.store.dispatch(new MoveSubCategories(payload)).subscribe(
          (res) => {
            if (res.template?.error?.status === ERROR_CODES.BAD_REQUEST) {
              this.sweetAlertService
                .error({
                  title: res.template.error.error.message,
                  confirmButtonText: 'Refresh',
                })
                .then((isConfirm) => {
                  if (isConfirm.value) {
                    this.routerService.navigateWithParams(
                      'app.diligence.template.preview',
                      { templateId: payload.template_id },
                      { reload: true }
                    );
                  }
                });
            } else {
              this.buttonLoader = false;
              this.store.dispatch(new UpdateTemplate({}));
              this.toaster.success('Sub-categories moved successfully');
              close();
            }
          },
          (error) => {
            this.buttonLoader = false;
          }
        );
      } else {
        this.buttonLoader = false;
        this.toaster.error('Please Select a category');
      }
    } else if (type == 'question' && !this.isCopy) {
      if (this.subCategorySelected) {
        const payload = {
          destination_section_id: this.subCategorySelected,
          questions: this.selectedQuestions,
          source_section_id: this.sourceQuestionSectionID,
          template_id: this.templateData.templateInfo.id,
          template_version: this.templateData.templateInfo.version,
          parentCategoryID: this.categorySelected,
        };
        this.store.dispatch(new MoveQuestions(payload)).subscribe(
          (res) => {
            if (res.template?.error?.status === ERROR_CODES.BAD_REQUEST) {
              this.sweetAlertService
                .error({
                  title: res.template.error?.error?.message,
                  confirmButtonText: 'Refresh',
                })
                .then((isConfirm) => {
                  if (isConfirm.value) {
                    this.store.dispatch(new UpdateError(null));
                    this.routerService.navigateWithParams(
                      'app.diligence.template.preview',
                      { templateId: payload.template_id },
                      { reload: true }
                    );
                  }
                });
            } else {
              this.buttonLoader = false;
              close();
              this.store.dispatch(new UpdateTemplate({}));
              this.toaster.success('Questions moved successfully');
            }
          },
          (error) => {
            this.buttonLoader = false;
          }
        );
      } else {
        this.buttonLoader = false;
        this.toaster.error(
          'Please select a category and sub-category to move question(s)'
        );
      }
    } else if (type == 'question' && this.isCopy) {
      this.copyQuestions(close);
    }
  }

  selectedSubCategoryCheckbox(isSelected: boolean, subCategoryID: number) {
    if (isSelected) {
      this.copyQuestionsToSubcategories[subCategoryID] = true;
    } else {
      delete this.copyQuestionsToSubcategories[subCategoryID];
    }
  }

  convertCategory(close) {
    this.secondButtonLoader = true;
    const payload = {
      sections: this.subCategoryList,
    };
    this.store.dispatch(new ConvertCategory(payload)).subscribe(
      (res) => {
        this.secondButtonLoader = false;
        this.store.dispatch(new UpdateTemplate({}));
        this.toaster.success('New Category created');
        close();
      },
      (error) => {
        this.secondButtonLoader = false;
      }
    );
  }

  copyQuestions(close) {
    const selectedQuestionID = this.selectedQuestions.map((ques) => {
      return ques.id;
    });
    const selectedSectionID = Object.keys(
      this.copyQuestionsToSubcategories
    ).map((id) => {
      return +id;
    });

    if (selectedSectionID[0]) {
      const payload = {
        question_ids: selectedQuestionID,
        destination_section_ids: selectedSectionID,
        destination_template_id: this.templateData.templateInfo.id,
      };

      this.store.dispatch(new CopyQuestions(payload)).subscribe(
        (res) => {
          if (res.template?.error?.status === ERROR_CODES.BAD_REQUEST) {
            this.sweetAlertService
              .error({
                title: res.template.error?.error?.message,
                confirmButtonText: 'Refresh',
              })
              .then((isConfirm) => {
                if (isConfirm.value) {
                  this.store.dispatch(new UpdateError(null));
                  this.routerService.navigateWithParams(
                    'app.diligence.template.preview',
                    { templateId: payload.destination_template_id },
                    { reload: true }
                  );
                }
              });
          } else if (res.template?.error?.error?.message) {
            this.toaster.error(res.template?.error?.error?.message);
          } else {
            this.buttonLoader = false;
            close();
            this.store.dispatch(new UpdateTemplate({}));
            this.toaster.success('Questions copied');
          }
        },
        (error) => {
          this.buttonLoader = false;
        }
      );
    } else {
      this.buttonLoader = false;
      this.toaster.error(
        'Please select a category and sub-category to move question(s)'
      );
    }
  }
}
