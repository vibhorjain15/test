import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import {
  DeleteCategories,
  DeleteSubCategories,
  GetQuestions,
  UpdateCategoryList,
  UpdateRouteParams,
  UpdateSubcategoryList,
  UpdateTemplate,
} from '../../store/template-builder.action';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { RouterService } from 'src/app2/services/router.service';
import { TemplateService } from 'src/app2/apis/template/template.service';
import { ToastrService } from 'ngx-toastr';
import { handelConflict } from '../../store/template-builder.util';
import { ERROR_CODES } from 'src/app2/shared/constants/constant';
import { TemplateState } from '../../store/template-builder.state';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'categories-list',
  templateUrl: './categories-list.component.html',
  styleUrls: ['./categories-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriesListComponent implements OnInit, OnChanges, OnDestroy {
  @Input() categoryData = [];
  @Input() loading = false;
  @Input() activeRow = null;
  search = '';
  categoryDataCopy = [];
  isQuestionData = false;
  localState = {
    subcategoryId: null,
    categoryId: null,
    templateId: null,
    addNew: false,
  };
  openMap = {};
  activeSubCat;
  @Select(TemplateState.getRouteParams) params;
  catId;
  subCatId;
  sub;
  actionIconsList = [
    {
      name: `search`,
      key: 'action-search',
      tooltip: `Search`,
      iconClass: ``,
    },
    {
      name: `plus`,
      key: `action-plus`,
      tooltip: `New Category`,
      iconClass: `Add Question`,
    },
  ];
  actionButtonsList = [];
  title = 'Categories and Sub-categories';
  constructor(
    private store: Store,
    private readonly model: CustomModalService,
    private readonly SweetAlert: SweetAlertService,
    private readonly router: RouterService,
    private template: TemplateService,
    private readonly toast: ToastrService,
    private routerState: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.categoryDataCopy = JSON.parse(JSON.stringify(this.categoryData));
    this.categoryData.sort((a, b) => a.destination_index - b.destination_index);
    this.categoryData.forEach((cat) => {
      cat.list.sort((a, b) => a.destination_index - b.destination_index);
    });
    this.localState = this.router.getState(this.routerState).params;
    this.store.dispatch(
      new UpdateRouteParams({
        categoryId: +this.localState.categoryId,
        subCategoryId: +this.localState.subcategoryId,
      })
    );
    this.sub = this.params.subscribe(({ cat, subCat }) => {
      if (cat && subCat) {
        if (this.catId == cat && this.subCatId == subCat) return;
        this.catId = cat;
        this.subCatId = subCat;
        this.store.dispatch(new GetQuestions({ sectionId: this.subCatId }));
        this.getQuestionList(this.subCatId, this.catId);
      } else if (cat) {
        this.activeSubCat = cat;
        this.catId = cat;
        this.router.navigateWithParams(
          'app.diligence.template.categories.subcategories',
          {
            categoryId: cat,
            templateId: this.localState.templateId,
          }
        );
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes?.activeRow &&
      changes.activeRow.currentValue !== changes.activeRow.previousValue
    ) {
      this.activeRow = changes.activeRow.currentValue;
    }
    if (
      changes?.categoryData &&
      changes.categoryData.currentValue !== changes.categoryData.previousValue
    ) {
      this.categoryData.sort(
        (a, b) => a.destination_index - b.destination_index
      );
      this.categoryData.forEach((cat) => {
        cat.list.forEach((val) =>
          val.id == this.activeRow ? (this.activeSubCat = cat.id) : null
        );
        cat.list.forEach((val) => (val.isSelected = false));
        cat.list.sort((a, b) => a.destination_index - b.destination_index);
        if (!(cat.id in this.openMap)) this.openMap[cat.id] = true;
        cat.isOpen = this.openMap[cat.id];
        cat.categoryIcons = [
          { name: 'pencil', tooltip: 'Edit' },
          {
            name: 'trashcan',
            tooltip:
              this.categoryData.length === 1
                ? 'You cannot delete the only category in this template'
                : 'Delete',
            isDisabled: this.categoryData.length === 1,
          },
        ];
        cat.subCategoryIcons = [
          { name: 'pencil', tooltip: 'Edit' },
          {
            name: 'trashcan',
            tooltip:
              cat.list.length === 1
                ? 'You cannot delete the only subcategory in this category '
                : 'Delete',
            isDisabled: cat.list.length === 1,
          },
        ];
      });
      this.categoryDataCopy = JSON.parse(JSON.stringify(this.categoryData));
      if (this.search)
        this.categoryData = this.categoryDataCopy.filter(
          (val) =>
            val.label.toLowerCase().includes(this.search.toLowerCase()) ||
            val.list.filter((x) =>
              x.label.toLowerCase().includes(this.search.toLowerCase())
            ).length
        );
    }
  }

  getQuestionList(id, parentID) {
    this.router.navigateWithParams(
      'app.diligence.template.categories.subcategories.questions',
      {
        categoryId: parentID,
        subcategoryId: id,
        templateId: this.localState.templateId,
      }
    );
    this.store.dispatch(
      new UpdateRouteParams({ categoryId: +parentID, subCategoryId: +id })
    );
  }

  handleUpdateList(list, index) {
    if (JSON.stringify(this.categoryData) === JSON.stringify(list)) return;
    this.categoryData = list;
    this.template
      .updateCategoryIndexAfterSort(list[index]?.id, {
        destination_index: index,
      })
      .subscribe(
        () => this.store.dispatch(new UpdateCategoryList(list)),
        (error) => this.handle409Error(error?.status, error?.error?.message)
      );
  }

  handleUpdateSubList(list, id, index) {
    let data = this.categoryData.find((val) => {
      if (val.id === id) {
        return val;
      }
    });
    if (JSON.stringify(data?.list) === JSON.stringify(list)) return;
    this.template
      .updateCategoryIndexAfterSort(list[index]?.id, {
        destination_index: index,
      })
      .subscribe(
        () => {
          this.store.dispatch(new UpdateSubcategoryList(list, id));
        },
        (error) => this.handle409Error(error?.status, error?.error?.message)
      );
    this.categoryData.forEach((val) => {
      if (val.id === id) {
        val.list = list;
      }
    });
  }

  handleOnClick(event, data) {
    event.stopPropagation();
    if (data.isMultiSelect) {
      data.isOpen = true;
      this.openMap[data.id] = true;
    } else {
      data.isOpen = !data.isOpen;
      this.openMap[data.id] = !this.openMap[data.id];
    }
  }

  handleMoveClick(event, data) {
    event.stopPropagation();
    data.isMultiSelect = !data.isMultiSelect;
    if (!data.isMultiSelect)
      data.list.forEach((val) => (val.isSelected = false));
  }

  handleAllSelect(isCheck, data) {
    data.list.forEach((val) => (val.isSelected = isCheck));
    data.activeNext = !!data.list.find((val) => val.isSelected);
  }

  handleCatCheckbox(val, subData, data) {
    subData.isSelected = val;
    if (data.isAllSelect) {
      data.isAllSelect = false;
    }
    data.isAllSelect = data.list.every((subCategory) => subCategory.isSelected);
    data.activeNext = !!data.list.find((val) => val.isSelected);
  }

  handleAddClick(event, data) {
    event.stopPropagation();
    this.model.invoke('manage-category', {
      initialState: {
        type: 'sub-category',
        parentID: data.id,
        data: data,
        currentLength: this.categoryDataCopy.filter(
          (val) => val.id === data.id
        )[0].list.length,
      },
    });
  }

  handleMoveSelectedClick(event, data) {
    event.stopPropagation();

    let filteredData = data.list.filter((obj) => !!obj.isSelected);
    if (!filteredData.length) this.toast.error('Please select a sub-category');
    else
      this.model.invoke('manage-move', {
        initialState: {
          type: 'sub-category',
          subCategoryList: filteredData,
          CategoryList: this.categoryData,
          parentCatId: data.id,
          parentCatName: data.name,
          data: data,
        },
      });
  }

  handleSearchChange(data) {
    if (!data) this.categoryData = this.categoryDataCopy;
    this.search = data;
    this.categoryData = this.categoryDataCopy.filter(
      (val) =>
        val.label.toLowerCase().includes(data.toLowerCase()) ||
        val.list.filter((x) =>
          x.label.toLowerCase().includes(data.toLowerCase())
        ).length
    );
  }

  handleAddSubCatClick(event, data) {
    event.stopPropagation();
    data.catName = data.name;
    this.model.invoke('manage-category', {
      initialState: {
        type: 'sub-category',
        parentID: data.id,
        categoryName: data.name,
      },
    });
  }

  handleRowClick(data) {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
    this.activeRow = data.id;
    this.activeSubCat = data.parentID;
    this.getQuestionList(data.id, data.parentID);
  }

  handleParentRowClick(data) {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
    this.openMap[data.id] = true;
    if (!data.list.length) {
      return;
    }
    this.activeRow = data.list[0].id;
    this.activeSubCat = data.id;
    this.getQuestionList(data.list[0].id, data.list[0].parentID);
  }

  handleDeleteCategory(category, type = 'category') {
    let entityScoreRules = this.store.selectSnapshot(
      (state) => state.template.entityScoreRules
    );
    this.SweetAlert.confirm({
      title: `Are you sure you want to delete "${category.name}" ?`,
      text:
        entityScoreRules?.length > 0
          ? `Deleting the ${type} will also result in the deletion of all associated rules. This action is irreversible and cannot be undone.`
          : null,
      confirmButtonText: 'Yes, delete it!',
      showLoaderOnConfirm: true,
      focusCancel: true,
      preConfirm: async () => {
        try {
          if (type === 'category') {
            await this.store
              .dispatch(new DeleteCategories(category.id))
              .toPromise();
          } else
            await this.store
              .dispatch(new DeleteSubCategories(category.id))
              .toPromise();
          this.SweetAlert.close();
          this.store.dispatch(new UpdateTemplate({}));
        } catch (error) {
          handelConflict(
            error,
            this.localState.templateId,
            this.SweetAlert,
            this.router,
            this.model
          );
        }
      },
    });
  }

  handleIconClick({ name: iconName }, type, category, subCatagory = null) {
    if (type === 'catagory') {
      if (iconName === 'pencil') {
        this.model.invoke('manage-category', {
          initialState: {
            category,
            type: 'category',
          },
        });
      } else this.handleDeleteCategory(category);
    } else {
      if (iconName === 'pencil') {
        this.model.invoke('manage-category', {
          initialState: {
            category: subCatagory,
            type: 'sub-category',
          },
        });
      } else this.handleDeleteCategory(subCatagory, 'sub-category');
    }
  }

  handleCategoryAddClick() {
    this.model.invoke('manage-category', {
      initialState: {
        type: 'category',
        currentLength: this.categoryDataCopy.length,
      },
    });
  }

  handle409Error(status, errorMessage) {
    this.loading = false;
    if (status === ERROR_CODES.BAD_REQUEST) {
      this.SweetAlert.error({
        title: errorMessage,
        confirmButtonText: 'Refresh',
      }).then((isConfirm) => {
        if (isConfirm.value) {
          this.router.navigateWithParams(
            'app.diligence.template.preview',
            {
              templateId: this.localState.templateId,
            },
            {
              reload: true,
            }
          );
        }
      });
    } else if (errorMessage) {
      this.toast.error(errorMessage);
    }
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
  handleActionIconClick(iconKey: ActionIcon) {
    this.title = '';
    if (iconKey === 'action-plus') {
      this.title = 'Categories and Sub-categories';
      this.handleCategoryAddClick();
    } else if (iconKey === 'action-search') {
      this.actionIconsList = [];
      this.actionButtonsList = [
        {
          key: `action-search`,
          type: `input-search`,
          class: `flex-1`,
          placeholder: 'Search Categories or sub-categories',
          name: `search`,
          isPrimary: false,
          isDisabled: false,
          hide: false,
          tooltip: `Search in questions`,
        },
        {
          key: `cancel-action-search`,
          type: `icon`,
          name: `times`,
          isPrimary: false,
          isDisabled: false,
          hide: false,
          tooltip: `Cancel`,
        },
      ];
    } else if (iconKey === 'cancel-action-search') {
      this.title = 'Categories and Sub-categories';
      this.actionIconsList = [
        {
          name: `search`,
          key: 'action-search',
          tooltip: `Search`,
          iconClass: ``,
        },
        {
          name: `plus`,
          key: `action-plus`,
          tooltip: `New Category`,
          iconClass: `Add Question`,
        },
      ];
      this.actionButtonsList = [];
    }
  }
}

type ActionIcon =
  | `action-plus`
  | `action-search`
  | `action-search`
  | `cancel-action-search`;
