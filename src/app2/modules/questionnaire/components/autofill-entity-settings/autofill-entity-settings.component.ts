import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { Store } from '@ngxs/store';
import { DiligenceType } from 'src/app2/apis/questionnaire/type/diligence.type';
import { AutoFill, TabType } from '../../types/auto-fill.type';
import { FirmDataService } from 'src/app2/services/firm-data.service';
import { FormControl, FormGroup } from '@angular/forms';
import { forkJoin } from 'rxjs';
import {
  DiligenceTypeEnum,
  hierarchyConstants,
  keywordConstants,
  SingularToPluralTypes,
} from 'src/app2/shared/constants/constant';
import { FundDataService } from 'src/app2/services/fund-data.service';
import { QuestionnaireService } from 'src/app2/apis/questionnaire/questionnaire.service';

@Component({
  selector: 'autofill-entity-settings',
  templateUrl: './autofill-entity-settings.component.html',
  styleUrls: ['./autofill-entity-settings.component.css'],
})
export class AutofillEntitySettingsComponent implements OnInit {
  @Input() diligence: DiligenceType;
  @Input() selectedButton: AutoFill;
  @Input() selectedTab: TabType;
  firmPreferences: any;
  includeStandard: boolean;
  prioritizeMostRecent: boolean;
  onlyFirm: boolean;
  onlyEntity: boolean;
  AutoFill = AutoFill;
  TabType = TabType;
  firms: any;
  firmsLoading: boolean;
  entityForm: FormGroup;
  entitiesLoading: boolean;
  entities: any[] = [];
  entitiesCopy: any[];
  entityTypes = [
    { name: 'All Entities', id: 'All' },
    { name: 'My Firm', id: keywordConstants.Firm },
    { name: 'Strategy', id: keywordConstants.Strategy },
    { name: 'Product', id: keywordConstants.Product },
    { name: 'Vehicle', id: keywordConstants.Vehicle },
  ];
  entityType: string;
  user: any;
  keywordConstants = keywordConstants;
  showFirmToggle: boolean;
  showEntityToggle: boolean;
  infoText: string;
  constructor(
    private readonly store: Store,
    private readonly firmDataService: FirmDataService,
    private readonly fundDataService: FundDataService,
    private readonly questionnaireService: QuestionnaireService
  ) {}

  ngOnInit(): void {
    this.user = this.store.selectSnapshot((state) => state.user.currentUser);
    this.firmPreferences = this.store.selectSnapshot(
      (state) => state.user.firmPreference
    );
    this.initData();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes && this.user && this.firmPreferences) {
      this.initData();
    }
  }

  initData() {
    this.includeStandard = this.firmPreferences.autofill_include_standard;
    this.prioritizeMostRecent =
      this.user.isManager && !this.user.isFreeSubscription
        ? this.includeStandard &&
          this.firmPreferences.autofill_prioritize_most_recent
        : false;
    if (this.selectedTab === TabType.Standard) {
      // don't show firm toggle for manager internal projects with no investor association
      this.showFirmToggle = !(
        this.user.isManager &&
        this.diligence.is_internal &&
        (!this.diligence.investorfirm_id ||
          this.diligence.investorfirm_id === this.user.firmInfo.id)
      );
      if (
        this.diligence.diligence_type === DiligenceTypeEnum.dd_review &&
        !this.diligence.managerfirm_name
      ) {
        // don't show firm toggle for AE project associated with multiple entities
        this.showFirmToggle = false;
      }

      // don't show entity toggle when we are not in most recent screen or investor side, the entity type is firm
      this.showEntityToggle =
        this.selectedButton === AutoFill.Most_Recent &&
        (this.user.isManager ||
          this.diligence.entity_type !== keywordConstants.Firm);
    }
    this.onlyFirm =
      this.user.isManager &&
      !this.user.isFreeSubscription &&
      !this.includeStandard
        ? false
        : this.firmPreferences.autofill_restrict_same_requestor;
    this.onlyEntity = this.firmPreferences.autofill_restrict_same_entity;
    if (this.selectedTab === TabType.Advanced) {
      this.entityForm = new FormGroup({
        firms: new FormControl([]),
        entities: new FormControl([]),
      });
      this.entityType = this.entityTypes[0].id;
      this.getFirms();
      this.getEntities();
    }
    this.getInfoText();
  }

  onIncludeStandardChange(value) {
    if (!value) {
      this.onlyFirm = false;
      this.prioritizeMostRecent = false;
    }
  }

  getInfoText() {
    if (this.selectedButton === AutoFill.Most_Recent) {
      if (this.user.isInvestor) {
        if (this.showEntityToggle) {
          this.infoText =
            'When these toggles are enabled, only responses associated to the same entity and to the same firm will be auto-filled.';
        } else {
          this.infoText =
            'When the firm toggle is enabled, only responses associated to the same firm will be auto-filled.';
        }
      } else {
        if (this.showFirmToggle) {
          this.infoText =
            'When these toggles are enabled, only responses previously submitted for the same entity and to the same firm will be auto-filled.';
        } else {
          this.infoText =
            ' When the entity toggle is enabled, only responses for the same entity will be auto-filled.';
        }
      }
    } else {
      if (this.user.isInvestor) {
        this.infoText =
          'When the firm toggle is enabled, only responses associated to the selected entity and to the same firm will be auto-filled.';
      } else if (this.user.isFreeSubscription) {
        if (this.showFirmToggle) {
          this.infoText =
            'When the firm toggle is enabled, only responses previously submitted for the selected entity and to the same firm will be auto-filled.';
        } else {
          this.infoText = '';
        }
      } else {
        this.infoText =
          'Enabling project responses will include responses from investor requests and standard DDQs.';
        if (this.showFirmToggle) {
          this.infoText +=
            ' When the firm toggle is enabled, only responses previously submitted for the selected entity and to the same firm will be auto-filled.';
        }
      }
    }
  }

  getFirms() {
    if (this.firms?.length) {
      return;
    }
    const params = {
      include_contacts: false,
      include_custom_fields: false,
      include_dates: false,
      is_active: true,
      filters: {},
    };
    this.firmsLoading = true;
    this.firmDataService.getFirms(params).subscribe((response: any) => {
      this.firms = response.data.map((firm) => {
        return {
          id: firm.id,
          name: firm.display_name,
        };
      });
      this.firmsLoading = false;
    });
  }

  getEntities() {
    if (this.entitiesCopy?.length) {
      this.entities = [...this.entitiesCopy];
      this.setEntityValues();
      return;
    }
    const observables = [];
    observables.push(this.fundDataService.getFunds());
    const params = {
      include_contacts: false,
      include_custom_fields: false,
      include_dates: true,
      is_active: true,
      filters: {},
      search_for: hierarchyConstants.Strategy,
    };
    observables.push(this.questionnaireService.getAllStrategies(params));
    delete params.search_for;
    observables.push(this.questionnaireService.getVehicles(params));
    this.entitiesLoading = true;
    forkJoin(observables).subscribe((res: any[]) => {
      if (this.user.isManager) {
        this.entities.push({
          id: this.user.firmInfo.id,
          name: this.user.firmInfo.name,
          entityType: keywordConstants.Firm,
          groupType: 'My Firm',
        });
      }
      const products = res[0].data.map((product) => {
        return {
          id: product.id,
          name: product.display_name,
          entityType: keywordConstants.Product,
          groupType: 'Products',
        };
      });
      this.entities.push(...products);
      const strategies = res[1].data.map((strategy) => {
        return {
          id: strategy.id,
          name: strategy.display_name,
          entityType: keywordConstants.Strategy,
          groupType: 'Strategies',
        };
      });
      this.entities.push(...strategies);
      const vehicles = res[2].data.map((vehicle) => {
        return {
          id: vehicle.id,
          name: vehicle.display_name,
          entityType: keywordConstants.Vehicle,
          groupType: 'Vehicles',
        };
      });
      this.entities.push(...vehicles);
      this.entitiesCopy = [...this.entities];
      this.entitiesLoading = false;
      this.setEntityValues();
    });
  }

  setEntityValues() {
    // pre-populate advanced tab dropdown based on firm pref
    const firmId = this.user.isManager
      ? this.diligence.investorfirm_id
      : this.diligence.managerfirm_id;
    if (this.onlyFirm && this.firms.find((x) => x.id === firmId)) {
      this.entityForm.get('firms').patchValue([+firmId]);
    }
    if (this.onlyEntity) {
      let entity;
      if (
        this.diligence.entity_id === this.user.firmInfo.id &&
        this.diligence.entity_type === keywordConstants.Firm
      ) {
        entity = this.entities.find(
          (x) => x.entityType === keywordConstants.Firm
        );
      } else if (this.diligence.entity_type !== keywordConstants.Firm) {
        entity = this.entities.find(
          (x) =>
            x.id === this.diligence.entity_id &&
            x.entityType === this.diligence.entity_type
        );
      }
      if (entity) {
        this.entityType = this.diligence.entity_type;
        this.entityForm.get('entities').patchValue([entity]);
      }
    }
    this.setEntityType(this.entityType);
  }

  setEntityType(entityType) {
    this.entityType = entityType;
    this.entityForm.patchValue({
      entities: null,
    });
    if (this.entityType === 'All') {
      this.entities = [...this.entitiesCopy];
    } else {
      this.entities = this.entitiesCopy.filter(
        (x) => x.entityType === entityType
      );
      if (entityType === keywordConstants.Firm) {
        // in case of "My Firm", auto select the value
        const entities: any[] = this.entityForm.get('entities').value;
        if (!entities.find((x) => x.entityType === keywordConstants.Firm)) {
          entities.push(this.entities[0]);
          this.entityForm.get('entities').patchValue([...entities]);
        }
      }
    }
  }

  getSelectedEntities() {
    let entities: Map<string, Array<number>> = new Map();
    let firms = [];
    if (this.selectedTab === TabType.Advanced) {
      const formValue = this.entityForm.value;
      const selectedEntities =
        this.onlyEntity && formValue.entities ? formValue.entities : [];
      selectedEntities.map((entity) => {
        if (entities.has(entity.entityType)) {
          entities.set(entity.entityType, [
            ...entities.get(entity.entityType),
            entity.id,
          ]);
        } else {
          entities.set(entity.entityType, [entity.id]);
        }
      });
      firms = this.onlyFirm && formValue.firms ? formValue.firms : [];
    } else {
      if (this.showFirmToggle && this.onlyFirm) {
        firms.push(
          this.user.isManager
            ? this.diligence.investorfirm_id
            : this.diligence.managerfirm_id
        );
      }
      if (this.showEntityToggle && this.onlyEntity) {
        entities.set(this.diligence.entity_type, [this.diligence.entity_id]);
      }
    }
    return {
      firms,
      entities,
      includeStandard: this.includeStandard,
      prioritizeMostRecent: this.prioritizeMostRecent,
    };
  }

  getContentSettingSnapShot() {
    return [
      this.user.isManager &&
        !this.user.isFreeSubscription && {
          label: 'Include project responses',
          value: this.includeStandard,
        },
      {
        label: 'Prioritize the most recent responses',
        value: this.prioritizeMostRecent,
      },
      this.showFirmToggle && {
        label: `Only include responses ${
          this.user.isManager ? 'submitted' : 'associated'
        } to ${
          this.user.isManager
            ? this.diligence.investorfirm_name
            : this.diligence.managerfirm_name
        }`,
        value: this.onlyFirm,
      },
      this.showEntityToggle && {
        label: `Only include responses associated to ${
          this.diligence.entity_id === this.user.firmInfo.id &&
          this.diligence.entity_type === keywordConstants.Firm
            ? 'My Firm'
            : this.diligence.entity_name
        }`,
        value: this.onlyEntity,
      },
    ].filter((value) => value);
  }

  getEntitySettingsSnapShot() {
    return [
      {
        'Include responses submitted to specific investor firms': this.onlyFirm,
      },
      {
        'Selected Firm(s)': this.entityForm.get('firms').value,
      },
      {
        'Include responses from specific entities': this.onlyEntity,
      },
      this.onlyEntity && {
        'Entity Type':
          this.entityType === 'All' ? 'All entities' : this.entityType,
      },
      this.onlyEntity &&
        this.entityType !== 'All' && {
          [SingularToPluralTypes[this.entityType]]: this.entityForm
            .get('entities')
            .value.map((entities) => entities.id),
        },
      this.onlyEntity &&
        this.entityType === 'All' && {
          Funds: this.entityForm
            .get('entities')
            .value.filter((entity) => entity.entityType === 'Fund')
            ?.map((entity) => entity.id),
        },
      this.onlyEntity &&
        this.entityType === 'All' && {
          Firms: this.entityForm
            .get('entities')
            .value.filter(
              (entity) => entity.entityType === keywordConstants.Firm
            )
            ?.map((entity) => entity.id),
        },
      this.onlyEntity &&
        this.entityType === 'All' && {
          Strategies: this.entityForm
            .get('entities')
            .value.filter(
              (entity) => entity.entityType === keywordConstants.Strategy
            )
            ?.map((entity) => entity.id),
        },
      this.onlyEntity &&
        this.entityType === 'All' && {
          Vehicles: this.entityForm
            .get('entities')
            .value.filter(
              (entity) => entity.entityType === keywordConstants.Vehicle
            )
            ?.map((entity) => entity.id),
        },
    ].filter((value) => value);
  }
}
