import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Store } from '@ngxs/store';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { ToastrService } from 'ngx-toastr';
import { QuestionnaireService } from 'src/app2/apis/questionnaire/questionnaire.service';
import { DiligenceType } from 'src/app2/apis/questionnaire/type/diligence.type';
import {
  hierarchyConstants,
  keywordConstants,
} from 'src/app2/shared/constants/constant';
import { AutoFill, AutoFillTooltip, TabType } from '../../types/auto-fill.type';
import {
  GetQuestionCount,
  UpdateDraftData,
} from '../../store/questionnaire.action';
import { DvDraftService } from '../../service/draft.service';
import { dvTabsList } from 'src/app2/shared/components/dv-tabs/dv-tabs.model';
import { CurrentUserModel } from 'src/app2/store/user/user.model';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { AutofillProjectSelectionComponent } from '../../components';
@Component({
  selector: 'app-autofill',
  templateUrl: './autofill.component.html',
  styleUrls: ['./autofill.component.css'],
})
export class AutofillComponent implements OnInit {
  selectedButton = AutoFill.Most_Recent;
  entity_id: number;
  entity_type: string;
  projects: any[];
  fund_products: any[];
  strategies: any[];
  vehicles: any[];
  related_diligences: any[];
  selected_entity_id: any;
  selected_project_id: any;
  iconName: string;
  selectedCat: any;
  category: any;
  subcategory: any;
  categoryCopy: any;
  label: string;
  entityTooltip: string;
  modalLg: boolean;
  isSecondButtonLoading: boolean = false;
  loader: boolean = false;
  filterList = [
    {
      name: 'All Categories & Sub-Categories',
      id: 'all',
    },
    {
      name: 'Select Categories & Sub-Categories',
      id: 'select',
    },
  ];
  tabTypes = [
    {
      id: TabType.Standard,
      name: 'Standard',
      disabled: false,
    },
    {
      id: TabType.Advanced,
      name: 'Advanced',
      disabled: true, // Always will be disabled as this is database autofill modal and we are just showing this to nudge free user
      tooltip:
        'Access advance settings for intelligent question matching, selection of firms, entities, tags, and Q/A library content. Available with a premium subscription.',
    },
  ];
  selectedTab = TabType.Standard;
  filterObj: any = this.filterList[0];
  AutoFill = AutoFill;
  AutoFillTooltip = AutoFillTooltip;
  standardTabLabels: dvTabsList[];
  currUser: any | CurrentUserModel;
  previewLoading: boolean;
  previewData: any;
  onlyEntity: boolean = false;
  keywordConstants = keywordConstants;
  excludedStatus = ['Invited', 'Scheduled', 'Withdrawn', 'Deleted'];
  @Input() autofillHistory = [];
  @Input() type: 'response' | 'rating';
  @Input() diligence: DiligenceType;
  @Input() success;

  @ViewChild('diligenceProjectSelection')
  diligenceProjectSelection: AutofillProjectSelectionComponent;
  constructor(
    private readonly store: Store,
    private readonly questionnaireService: QuestionnaireService,
    private readonly toaster: ToastrService,
    private readonly modal: BsModalRef,
    private readonly customModalService: CustomModalService,
    private readonly draftService: DvDraftService
  ) {}

  ngOnInit(): void {
    this.category = this.store.selectSnapshot((state) =>
      Object.values(state.questionnaire.categories)
    );
    this.currUser = this.store.selectSnapshot(
      (state) => state.user.currentUser
    );

    this.categoryCopy = JSON.parse(JSON.stringify(this.category));
    this.categoryCopy.forEach((cat) => {
      cat.list = Object.values(cat.list);
      cat.isCatSelected = false;
    });
    // Logic to decide iconname and label
    let entity_type = this.diligence.entity_type;
    if (entity_type == 'Fund') {
      this.iconName = 'fund';
      this.label = AutoFill.From_a_Product;
      this.entityTooltip = AutoFillTooltip.From_a_Product;
    } else if (entity_type == 'Strategy') {
      this.iconName = 'strategy';
      this.label = AutoFill.From_a_Strategy;
      this.entityTooltip = AutoFillTooltip.From_a_Strategy;
    } else if (entity_type == 'Vehicle') {
      this.iconName = 'vehicle-car';
      this.label = AutoFill.From_a_Vehicle;
      this.entityTooltip = AutoFillTooltip.From_a_Vehicle;
    }

    // FETCHING ALL THE DATA
    this.questionnaireService
      .getAllDiligences(
        this.diligence.entity_id,
        this.diligence.entity_type,
        this.diligence.id
      )
      .subscribe((res: any) => {
        this.projects = res.filter(
          (diligence) =>
            diligence.id != this.diligence.id &&
            this.excludedStatus.indexOf(diligence.status) == -1 &&
            !!diligence.name
        );
      });

    this.questionnaireService
      .getAllProductEntities(this.diligence.entity_id)
      .subscribe((res: any) => {
        this.fund_products = res;
      });

    let params = {
      include_contacts: false,
      include_custom_fields: false,
      include_dates: true,
      is_active: true,
      filters: {},
      search_for: hierarchyConstants.Strategy,
    };
    this.questionnaireService.getAllStrategies(params).subscribe((res: any) => {
      this.strategies = res.data;
    });
    delete params.search_for;
    this.questionnaireService.getVehicles(params).subscribe((res: any) => {
      this.vehicles = res;
    });

    this.questionnaireService
      .getRelatedDiligences(this.diligence.id)
      .subscribe((res: any) => {
        this.related_diligences = res;
      });

    this.setStandardTabLabels();
  }

  setStandardTabLabels() {
    if (this.type === 'response')
      this.standardTabLabels = [
        {
          name: AutoFill.Most_Recent,
          condition: true,
          active: true,
          tooltip: AutoFillTooltip.Most_Recent,
        },
        {
          name: this.label,
          condition: this.diligence.entity_type != 'Firm' && !!this.label,
          active: false,
          tooltip: this.entityTooltip,
        },
        {
          name: AutoFill.From_Diligence_Project,
          condition: true,
          tooltip: AutoFillTooltip.From_Diligence_Project,
          active: false,
        },
        {
          name: AutoFill.From_Mapped_Responses,
          condition: this.diligence.diligence_type == 'dd_review',
          tooltip: AutoFillTooltip.From_Mapped_Responses,
          active: false,
        },
      ];
  }

  handleFilterChange(filter) {
    if (filter.id == 'all') {
      this.modalLg
        ? this.modal.setClass('modal-lg')
        : this.modal.setClass('modal-md');
      this.filterObj = filter;
    } else {
      this.modal.setClass('modal-xl');
      this.filterObj = filter;
    }
  }
  handleAutoFill(close, saveDraft = false) {
    let title =
      'Are you sure you want to autofill? all your unsaved changes will be lost';
    this.draftService.showCountAlert(
      () => {
        this.onAutoFill(close, saveDraft);
      },
      () => {
        this.onAutoFill(close, saveDraft);
        this.store.dispatch(new UpdateDraftData(null));
      },
      title,
      undefined,
      'Save & autofill',
      `Don't save & autofill`
    );
  }
  onAutoFill(close, saveDraft, isPreview = false) {
    if (this.type == 'response') {
      let params: any = {
        duediligence_id: this.diligence.id,
      };
      if (this.selectedButton == AutoFill.From_a_Product) {
        params['entity_id'] = this.selected_entity_id;
        params['entity_type'] = 'Fund';
        params['entity_settings'] = [
          {
            'Entity Type': 'Fund',
          },
          {
            Funds: [this.selected_entity_id],
          },
        ];
      } else if (this.selectedButton == AutoFill.From_a_Strategy) {
        params['entity_id'] = this.selected_entity_id;
        params['entity_type'] = 'strategy';
        params['entity_settings'] = [
          {
            'Entity Type': 'Strategy',
          },
          {
            Strategies: [this.selected_entity_id],
          },
        ];
      } else if (this.selectedButton == AutoFill.From_a_Vehicle) {
        params['entity_id'] = this.selected_entity_id;
        params['entity_type'] = 'Vehicle';
        params['entity_settings'] = [
          {
            'Entity Type': 'Vehicle',
          },
          {
            Vehicles: [this.selected_entity_id],
          },
        ];
      } else if (this.selectedButton == AutoFill.From_Diligence_Project) {
        const diligenceProjectSelection =
          this.diligenceProjectSelection?.getDiligenceSettings();
        params['entity_settings'] = diligenceProjectSelection;
        params['entity_id'] = this.selected_project_id;
        params['entity_type'] = 'DueDiligence';
      } else if (this.selectedButton === AutoFill.From_Mapped_Responses) {
        params['entity_id'] = null;
        params['entity_type'] = null;
        params['autofill_mapped_responses'] = true;
      }

      if (this.filterObj.id == 'select') {
        let selectedSubcategory = [];
        for (let category of this.categoryCopy) {
          for (let subcategory of category.list)
            if (category.isCatSelected || subcategory.isSelected)
              selectedSubcategory.push(subcategory.id);
        }
        if (selectedSubcategory.length == 0) {
          this.toaster.error('Please select category or subcategory');
          this.loader = false;
          return;
        }
        params['duediligence_id'] = this.diligence.id;
        params['autofill_selected_entity_type'] = 'subcategory';
        params['autofill_selected_entities'] = selectedSubcategory;
        params['categories'] = selectedSubcategory;
      }
      let apiCall;
      if (this.selectedButton === AutoFill.From_Mapped_Responses)
        apiCall = this.questionnaireService.postAutoFillMappedResponses(params);
      else apiCall = this.questionnaireService.postAutoFill(params);

      params.content_settings = this.onlyEntity
        ? [
            {
              label: `Only include responses associated to ${
                this.diligence.entity_id === this.currUser.firmInfo.id &&
                this.diligence.entity_type === keywordConstants.Firm
                  ? 'My Firm'
                  : this.diligence.entity_name
              }`,
              value: this.onlyEntity,
            },
          ]
        : [];

      params.is_drafts_enabled = saveDraft;

      if (isPreview) return params; // Just return the params without making any api call to use it for preview

      if (!saveDraft) this.loader = true;
      else this.isSecondButtonLoading = true;

      this.questionnaireService.postAutoFill(params).subscribe(
        (res: any) => {
          this.loader = false;
          this.isSecondButtonLoading = false;
          let count = res.affected_row_count;
          if (!count) {
            this.toaster.info('No previous data was found');
          } else {
            this.store.dispatch(new GetQuestionCount());
            this.toaster.success(
              `${count} response${count > 1 ? 's' : ''} auto-filled`
            );
          }
          this.success(res);
          close();
        },
        (error) => {
          this.loader = false;
          this.isSecondButtonLoading = false;
        }
      );
    } else {
      let params = {};
      this.questionnaireService
        .postAutoFillRatings(
          params,
          this.diligence.id,
          this.selected_project_id
        )
        .subscribe(
          (res: any) => {
            this.loader = false;
            if (res.affected_rows) {
              this.toaster.success(
                `Autofilled ratings/scores for ${res.affected_rows} response${
                  res.affected_rows > 1 ? 's' : ''
                }`
              );
            } else this.toaster.info('No previous data was found');

            this.success(res);
            close();
          },
          (error) => (this.loader = false)
        );
    }
  }
  onButtonClick(index) {
    this.selectedButton = this.standardTabLabels[index].name;
    if (this.selectedButton === AutoFill.From_Mapped_Responses)
      this.handleFilterChange(this.filterList[0]);
    this.selected_entity_id = '';
    this.selected_project_id = '';
  }

  showAutofillHistory() {
    this.customModalService.invoke('autofill-history', {
      initialState: {
        autofillHistory: this.autofillHistory,
        diligence: this.diligence,
        success: (deleteStatus) => {
          if (deleteStatus) {
            // if responses are deleted, close the parent modal as well
            this.success(true);
          }
        },
      },
    });
  }

  getAutofillPreviewCounts() {
    const payload = this.onAutoFill(null, false, true);
    if (!payload) {
      return;
    }
    this.previewLoading = true;
    delete payload.priority_filters;
    this.questionnaireService
      .getDBAutofillPreviewCounts(payload)
      .subscribe((data) => {
        this.previewData = data;
        this.previewLoading = false;
      });
  }
}
