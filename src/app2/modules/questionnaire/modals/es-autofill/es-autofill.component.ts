import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { Store } from '@ngxs/store';
import { ToastrService } from 'ngx-toastr';
import { QuestionnaireService } from 'src/app2/apis/questionnaire/questionnaire.service';
import { DiligenceType } from 'src/app2/apis/questionnaire/type/diligence.type';
import {
  DiligenceTypeEnum,
  hierarchyConstants,
  keywordConstants,
} from 'src/app2/shared/constants/constant';
import {
  AutoFill,
  autoFillHistoryParse,
  AutoFillTooltip,
  TabType,
} from '../../types/auto-fill.type';
import {
  GetQuestionCount,
  UpdateDraftData,
} from '../../store/questionnaire.action';
import { DvDraftService } from '../../service/draft.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { finalize } from 'rxjs/operators';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { AutofillEntitySettingsComponent } from '../../components/autofill-entity-settings/autofill-entity-settings.component';
import { AutofillContentSettingsComponent } from '../../components/autofill-content-settings/autofill-content-settings.component';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { ModalComponent } from 'src/app2/shared/components/modal/modal.component';
import { AutofillProjectSelectionComponent } from '../../components';
import { CurrentUserModel } from 'src/app2/store/user/user.model';
@Component({
  selector: 'es-autofill',
  templateUrl: './es-autofill.component.html',
  styleUrls: ['./es-autofill.component.css'],
})
/*
  this component is the extension of the autofill component 
  the basic code is taken from the same component without any change.
  new changes are added on top of that. 
*/
export class EsAutofillComponent implements OnInit {
  @Input() diligence: DiligenceType;
  @Input() success;
  @Input() autofillHistory = [];
  selectedButton = AutoFill.Most_Recent;
  products: any[];
  strategies: any[];
  vehicles: any[];
  selectedEntityId: any;
  selectedProjectId: any;
  selectedCat: any;
  category: any;
  subcategory: any;
  categoryCopy: any;
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
  filterObj: any = this.filterList[0];
  AutoFill = AutoFill;
  AutoFillTooltip = AutoFillTooltip;
  excludedStatus = ['Invited', 'Scheduled', 'Withdrawn', 'Deleted'];
  tabTypes = [
    {
      id: TabType.Standard,
      name: 'Standard',
      disabled: false,
    },
    {
      id: TabType.Advanced,
      name: 'Advanced',
      disabled: false,
      tooltip: '',
    },
  ];
  selectedTab = TabType.Standard;
  TabType = TabType;
  lastAutofillDetails: any;
  user: CurrentUserModel;
  tags = [];
  previewData: any;
  @ViewChild('entitySettings') entitySettings: AutofillEntitySettingsComponent;
  @ViewChild('contentSettings')
  contentSettings: AutofillContentSettingsComponent;
  @ViewChild('modal') modalComponent: ModalComponent;
  @ViewChild('diligenceProjectSelection')
  diligenceProjectSelection: AutofillProjectSelectionComponent;
  selectedTags = [];
  selectedEntityName: string;
  selectedFirmName: string;
  mostRecentLabel: string;
  previewLoading: boolean;
  firmPreferences: any;
  showMatchSettings: boolean;
  questionMatchValue: number;
  questionMatchInfoText: string;
  questionMatchElementTooltip: string;
  modalTitle: string = 'Auto-fill';
  standardTabLabels: { name: any; active: boolean; condition: any }[];
  entitiesLoading: boolean;
  firstLoader;
  secondLoader;
  constructor(
    private readonly store: Store,
    private readonly questionnaireService: QuestionnaireService,
    private readonly modal: BsModalRef,
    private readonly toaster: ToastrService,
    private readonly draftService: DvDraftService,
    private readonly sweetAlert: SweetAlertService,
    private readonly customModal: CustomModalService
  ) {}

  ngOnInit(): void {
    this.user = this.store.selectSnapshot((state) => state.user.currentUser);
    this.firmPreferences = this.store.selectSnapshot(
      (state) => state.user.firmPreference
    );
    if (this.user.isFreeSubscription) {
      this.tabTypes.find((x) => x.id === TabType.Advanced).disabled = true;
      this.tabTypes.find((x) => x.id === TabType.Advanced).tooltip =
        'Access advanced settings for intelligent question matching, selection of firms, entities, tags, and Q/A library content. Available with a premium subscription.';
    }
    this.category = this.store.selectSnapshot((state) =>
      Object.values(state.questionnaire.categories || {})
    );
    this.categoryCopy = JSON.parse(JSON.stringify(this.category));
    this.categoryCopy.forEach((cat) => {
      cat.list = Object.values(cat.list);
      cat.isCatSelected = false;
    });
    this.initData();
  }

  initData() {
    this.entitiesLoading = true;
    let params = {
      include_contacts: false,
      include_custom_fields: false,
      include_dates: true,
      is_active: true,
      filters: {},
      search_for: hierarchyConstants.Strategy,
    };
    if (this.diligence.entity_type == keywordConstants.Product) {
      this.questionnaireService
        .getAllProductEntities(this.diligence.entity_id)
        .subscribe((res: any) => {
          this.products = res;
          this.entitiesLoading = false;
        });
    } else if (this.diligence.entity_type == keywordConstants.Strategy) {
      this.questionnaireService
        .getAllStrategies(params)
        .subscribe((res: any) => {
          this.strategies = res.data;
          this.entitiesLoading = false;
        });
    } else if (this.diligence.entity_type == keywordConstants.Vehicle) {
      delete params.search_for;
      this.questionnaireService.getVehicles(params).subscribe((res: any) => {
        this.vehicles = res.data;
        this.entitiesLoading = false;
      });
    }
    this.setAutofillHistory();
    if (this.user.isManager && !this.user.isFreeSubscription) {
      this.getQuestionTags();
    }
    this.setSelectedEntityAndFirmName();
    this.showMatchSettings =
      this.firmPreferences.autofill_enable_match_settings &&
      this.user.isManager;
    this.questionMatchValue =
      this.firmPreferences.autofill_match_settings_percentage > 0
        ? this.firmPreferences.autofill_match_settings_percentage
        : this.user.isFreeSubscription
        ? 100
        : 95;
    this.getQuestionMatchInfoText();
    this.setStandardTabLabels();
  }

  setStandardTabLabels() {
    let entityLabel;
    if (this.diligence.entity_type == keywordConstants.Product) {
      entityLabel = AutoFill.From_a_Product;
    } else if (this.diligence.entity_type == keywordConstants.Strategy) {
      entityLabel = AutoFill.From_a_Strategy;
    } else if (this.diligence.entity_type == keywordConstants.Vehicle) {
      entityLabel = AutoFill.From_a_Vehicle;
    }

    this.mostRecentLabel =
      this.user.isManager && !this.user.isFreeSubscription
        ? 'Q/A Center'
        : AutoFill.Most_Recent;

    this.standardTabLabels = [
      {
        name: this.mostRecentLabel,
        active: true,
        condition: true,
      },
      {
        name: entityLabel,
        active: false,
        condition: this.diligence.entity_type != 'Firm' && entityLabel,
      },
      {
        name: AutoFill.From_Diligence_Project,
        active: false,
        condition: true,
      },
      {
        name: AutoFill.From_Mapped_Responses,
        active: false,
        condition:
          this.diligence.diligence_type === DiligenceTypeEnum.dd_review,
      },
    ];
  }

  getQuestionTags() {
    this.questionnaireService.getQuestionTags().subscribe((tags: any) => {
      this.tags = tags;
    });
  }

  setAutofillHistory() {
    autoFillHistoryParse(this.autofillHistory, this.user);
    this.lastAutofillDetails = this.autofillHistory.find(
      (x) => !x.removed_at && x.responses_count
    );
  }

  undoAutofill(audit) {
    this.draftService.showCountAlert(
      () => this.undoAutofillAlert(audit),
      () => {
        setTimeout(() => {
          this.undoAutofillAlert(audit);
        }, 0);
      }
    );
  }
  undoAutofillAlert(audit) {
    this.sweetAlert.confirm({
      title: `Are you sure you want delete auto-filled responses in this project?`,
      text:
        audit.total_count !== audit.responses_count
          ? `Out of ${audit.total_count} auto-filled responses, ${
              audit.total_count - audit.responses_count
            } responses have manual edits and will not be deleted. This will delete the other ${
              audit.responses_count
            } responses and cannot be undone.`
          : `This will delete ${audit.responses_count} responses and cannot be undone.`,
      confirmButtonText: 'Yes, Delete',
      showLoaderOnConfirm: true,
      focusCancel: true,
      preConfirm: () => {
        return new Promise<void>((resolve) => {
          this.questionnaireService
            .undoAutofill(this.diligence.id, audit.id)
            .pipe(finalize(() => resolve()))
            .subscribe((res: any) => {
              this.store.dispatch(new UpdateDraftData(null));
              this.toaster.success('Responses deleted successfully');
              this.success(true);
              this.modalComponent.closeModal();
            });
        });
      },
    });
  }

  showAutofillHistory() {
    this.customModal.invoke('autofill-history', {
      initialState: {
        autofillHistory: this.autofillHistory,
        diligence: this.diligence,
        success: (deleteStatus) => {
          if (deleteStatus) {
            // if responses are deleted, close the parent modal as well
            this.success(true);
            this.modalComponent.closeModal();
          }
        },
      },
    });
  }

  getAutofillPreviewCounts() {
    const payload = this.createAutofillPayload();
    if (!payload) {
      return;
    }
    this.previewLoading = true;
    delete payload.priority_filters;
    this.questionnaireService
      .getAutofillPreviewCounts(payload)
      .subscribe((data) => {
        this.previewData = data;
        this.previewLoading = false;
      });
  }

  handleFilterChange(filter) {
    this.modal.setClass(filter.id == 'all' ? 'modal-md' : 'modal-xl');
    this.filterObj = filter;
  }

  onSliderChange(number) {
    this.questionMatchValue = number;
  }

  handleAutoFill(close, isDraft = false) {
    let title =
      'Are you sure you want to autofill? all your unsaved changes will be lost';
    this.draftService.showCountAlert(
      () => {
        this.onAutoFill(close, isDraft);
      },
      () => {
        this.onAutoFill(close, isDraft);
        this.store.dispatch(new UpdateDraftData(null));
      },
      title,
      undefined,
      'Save & Autofill',
      `Don't save & autofill`
    );
  }

  createAutofillPayload(isDraft = false) {
    let params: any = {
      duediligence_id: this.diligence.id,
      source_tab: this.tabTypes.find((x) => x.id === this.selectedTab).name,
      is_drafts_enabled: isDraft,
    };
    if (this.selectedTab === TabType.Standard) {
      if (this.selectedButton == AutoFill.From_a_Product) {
        params.entity_id = this.selectedEntityId;
        params.entity_type = keywordConstants.Product;
      } else if (this.selectedButton == AutoFill.From_a_Strategy) {
        params.entity_id = this.selectedEntityId;
        params.entity_type = keywordConstants.Strategy;
      } else if (this.selectedButton == AutoFill.From_a_Vehicle) {
        params.entity_id = this.selectedEntityId;
        params.entity_type = keywordConstants.Vehicle;
      } else if (this.selectedButton == AutoFill.From_Diligence_Project) {
        params.entity_id = this.selectedProjectId;
        params.entity_type = 'DueDiligence';
      } else if (this.selectedButton === AutoFill.From_Mapped_Responses) {
        params.entity_id = null;
        params.entity_type = null;
        params.autofill_mapped_responses = true;
      }
    }

    if (this.filterObj.id == 'select') {
      let selectedSubcategory = [];
      for (let category of this.categoryCopy) {
        for (let subcategory of category.list)
          if (category.isCatSelected || subcategory.isSelected) {
            selectedSubcategory.push(subcategory.id);
          }
      }
      if (selectedSubcategory.length == 0) {
        this.toaster.error('Please select category or subcategory');
        this.loader = false;

        this.firstLoader = false;
        this.secondLoader = false;
        return;
      }
      params.duediligence_id = this.diligence.id;
      params.autofill_selected_entity_type = 'subcategory';
      params.autofill_selected_entities = selectedSubcategory;
    }

    if (this.selectedButton !== AutoFill.From_Mapped_Responses) {
      // properties related to the new design
      const selectedEntities = this.entitySettings?.getSelectedEntities();
      params.filters = [];
      if (
        this.selectedTab === TabType.Advanced ||
        this.selectedButton !== AutoFill.From_Diligence_Project
      ) {
        params.priority_filters = {
          same_entity_id: this.diligence.entity_id,
          same_firm_id: this.user.isManager
            ? this.diligence.investorfirm_id
            : this.diligence.managerfirm_id,
          priority_library_content: !selectedEntities.prioritizeMostRecent,
        };
        if (selectedEntities?.firms?.length) {
          params.filters.push({
            filter_type: 'exact',
            filter_name: 'associated_investor_id',
            filter_value: selectedEntities.firms,
          });
        }
        if (selectedEntities?.entities?.size) {
          selectedEntities.entities.forEach((value: number[], key: string) => {
            params.filters.push({
              filter_type: 'exact',
              filter_name: key,
              filter_value: value,
            });
          });
        }
        if (
          this.selectedTab === TabType.Standard &&
          this.user.isManager &&
          !this.user.isFreeSubscription &&
          selectedEntities
        ) {
          params.exclude_standardddq_investor_requests =
            !selectedEntities.includeStandard;
        }
      }

      const diligenceProjectSelection =
        this.diligenceProjectSelection?.getDiligenceSettings();
      const contentSettingValues =
        this.contentSettings?.getSelectedContentSettings();

      //Have to add the setting snapshot to the payload to show it as history detail
      if (this.selectedTab === TabType.Advanced) {
        params.content_settings =
          this.contentSettings?.getContentSettingSnapShot();
        params.entity_settings =
          this.entitySettings?.getEntitySettingsSnapShot();
      } else if (this.selectedTab === TabType.Standard) {
        if (this.user.isManager && !this.user.isFreeSubscription)
          params.content_settings =
            this.entitySettings?.getContentSettingSnapShot();
        // Take content settings for standard tab from entity settings
        else
          params.entity_settings =
            this.entitySettings?.getContentSettingSnapShot();
        if (this.selectedButton === AutoFill.From_Diligence_Project) {
          params.entity_settings = diligenceProjectSelection;
        }
      }

      params.exclude_preapproved_content = contentSettingValues
        ? !contentSettingValues.includePreApproved
        : this.user.isManager && !this.user.isFreeSubscription
        ? false
        : true;
      params.exclude_expired_content = contentSettingValues
        ? !contentSettingValues.includeExpired
        : true;
      if (!params.hasOwnProperty('exclude_standardddq_investor_requests')) {
        params.exclude_standardddq_investor_requests = contentSettingValues
          ? !contentSettingValues.includeStandard
          : false;
      }
      if (contentSettingValues?.includeVerified) {
        params.filters.push({
          filter_type: 'exact',
          filter_name: 'is_verified',
          filter_value: 1,
        });
      }
      if (this.selectedTags?.length) {
        params.filters.push({
          filter_type: 'exact',
          filter_name: 'tags_id',
          filter_value: this.selectedTags,
        });
        params.tags = this.selectedTags;
      }
    }

    // percentage match if user selects a value other than 100.
    if (
      this.showMatchSettings &&
      !this.user.isFreeSubscription &&
      this.questionMatchValue < 100
    ) {
      params.min_similarity = this.questionMatchValue / 100;
    }
    return params;
  }

  onAutoFill(close, isDraft) {
    if (
      this.showMatchSettings &&
      !this.user.isFreeSubscription &&
      !this.questionMatchValue
    ) {
      this.toaster.error(
        'Similarity match should be greater than 0%. We recommended starting at 80% or higher.'
      );
      return;
    }
    this.loader = true;
    if (isDraft) this.firstLoader = true;
    else this.secondLoader = true;
    const payload = this.createAutofillPayload(isDraft);
    if (!payload) {
      return;
    }
    const observable =
      this.selectedButton === AutoFill.From_Mapped_Responses
        ? this.questionnaireService.postAutoFill(payload)
        : this.questionnaireService.postESAutoFill(payload);
    observable
      .pipe(
        finalize(() => {
          this.loader = false;
          this.firstLoader = false;
          this.secondLoader = false;
        })
      )
      .subscribe((res: any) => {
        let count = res.affected_row_count;
        if (!count) {
          this.toaster.info('No previous data was found');
        } else {
          this.success(res);
          this.store.dispatch(new GetQuestionCount());
          this.toaster.success(
            `${count} response${count > 1 ? 's' : ''} auto-filled`
          );
        }
        close();
      });
  }

  onEntitySelectionChange(data) {
    this.selectedEntityId = data.id;
    this.selectedEntityName = data.name;
  }

  onButtonClick(label, index) {
    this.selectedButton =
      label === this.mostRecentLabel ? AutoFill.Most_Recent : label;
    this.standardTabLabels.map((x) => (x.active = false));
    this.standardTabLabels[index].active = true;
    if (this.selectedButton === AutoFill.From_Mapped_Responses)
      this.handleFilterChange(this.filterList[0]);
    this.selectedEntityId = '';
    this.selectedEntityName = '';
    this.selectedProjectId = '';
    this.setSelectedEntityAndFirmName();
  }

  setSelectedEntityAndFirmName() {
    // this function sets the values which are used in the help text
    if (
      this.selectedTab === TabType.Advanced ||
      this.selectedButton === AutoFill.From_Mapped_Responses ||
      this.selectedButton === AutoFill.From_Diligence_Project
    ) {
      return;
    }
    this.selectedFirmName = this.user.isManager
      ? this.diligence.investorfirm_name
      : this.diligence.managerfirm_name;
    if (this.selectedButton == AutoFill.Most_Recent) {
      this.selectedEntityName =
        this.diligence.entity_id === this.user.firmInfo.id &&
        this.diligence.entity_type === keywordConstants.Firm
          ? 'My Firm'
          : this.diligence.entity_name;
    }
  }

  setSelectedTab(data) {
    this.selectedTab = data;
    this.setSelectedEntityAndFirmName();
  }

  getQuestionMatchInfoText() {
    this.questionMatchInfoText = `This % match will determine the threshold for how closely
      the auto-filled responses match and are relevant to the text
      and context of the given questions. This will allow you to
      manage the quality of content that's auto-filled in projects.
      If no matches are found at or above the % threshold, then a
      response will not be auto-filled for that question. Autofill
      will always select the strongest match available.
      <br/>
      <br/>
      <strong>Flexible/Low (40% - 60%)</strong>
      <br/>
      A lower % match setting will auto-fill more responses with
      less accuracy. This can be used to fill more answers/as
      many questions as possible.
      <br/>
      <br/>
      <strong>Moderate/Medium (60% - 80%)</strong>
      <br/>
      A middle range % match setting will auto-fill responses with
      a moderate level of matching accuracy.
      <br/>
      <br/>
      <strong>Strict/Strong (80%- 100%)</strong>
      <br/>
      A higher % match setting will run a more narrow search
      with fewer results and a higher level of matching
      accuracy. This could be used as a first pass to only auto-fill
      the strongest matches.`;

    this.questionMatchElementTooltip = this.user.isFreeSubscription
      ? 'Populate more responses with advanced similarity matching. Available with a premium subscription.'
      : this.firmPreferences.autofill_restrict_modifications
      ? `The match % is locked in firm settings. Please contact your firm admin to change this.`
      : '';
  }
}
