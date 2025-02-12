import { HttpClient } from '@angular/common/http';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { forkJoin, Subject } from 'rxjs';
import { DueDiligenceDataService } from 'src/app2/services/due-diligence-data.service';
import { FirmDataService } from 'src/app2/services/firm-data.service';
import { FundDataService } from 'src/app2/services/fund-data.service';
import { PermissionService } from 'src/app2/services/permission/permission.service';
import { TemplateDataService } from 'src/app2/services/templateData/template.service';
import { IResource } from 'src/app2/services/permission/permission.type';
import { UtilsService } from 'src/app2/services/utils.service';
import { keywordConstants } from '../../constants/constant';
import {
  filtersConstants,
  getDiligenceType,
} from '../modal/manage-permission/manage-permission.util';
import { finalize } from 'rxjs/operators';
import { DvSelectComponent } from '../dv-select/dv-select.component';

@Component({
  selector: 'add-team-permissions',
  templateUrl: './add-team-permissions.component.html',
})
export class AddTeamPermissionComponent implements OnInit, OnChanges {
  @Input() resources: IResource;
  @Input() permission_entity_type: string;
  @Input() editMode: boolean;
  @Input() selectedEntities = [];
  @Output() onResourceTypeChanged: EventEmitter<string> = new EventEmitter();
  @Output() onChangeResources: Subject<any> = new Subject();
  @Input() gridData = [];
  @Output() onAllowUnderlyingEntitiesOptionChange: EventEmitter<boolean> =
    new EventEmitter();

  addPermissionForm: FormGroup;
  current_user;
  currentFirmId;
  is_investor;
  is_manager;
  minDate;
  maxDate;
  entity_type;
  parentResources;
  diligence_types;
  entityDisplayParams;
  diligenceDisplayParams;
  filters;
  customDateFilter;
  type;
  funds;
  fundsCopy;
  selectMyFirm;
  entitySource;
  firmsCopy;
  firms;
  entity_id;
  diligenceBackup;
  entities;
  diligences;
  templates;
  templatesCopy;
  loading: boolean;
  dateRangeForDirectives;
  keywordConstants = keywordConstants;
  allowUnderlyingEntities: boolean;
  @ViewChild('diligenceEntity') diligenceEntityComponent: DvSelectComponent;
  constructor(
    private readonly UtilsService: UtilsService,
    private readonly FirmDataService: FirmDataService,
    private readonly FundDataService: FundDataService,
    private readonly DueDiligenceDataService: DueDiligenceDataService,
    private readonly PermissionService: PermissionService,
    private readonly TemplateDataService: TemplateDataService,
    private readonly Utils: UtilsService
  ) {}
  ngOnInit() {
    this.current_user = this.UtilsService.getCurrentUser();
    this.currentFirmId = this.UtilsService.getCurrentUser().firmInfo.id;
    this.is_investor = this.UtilsService.isInvestor();
    this.is_manager = this.UtilsService.isManager();
    const d = new Date();
    const pastYear = d.getFullYear() - 5;
    d.setFullYear(pastYear);
    this.minDate = d;
    this.maxDate = new Date();
    this.templates = [];
    this.entity_type = null;
    this.parentResources = [];
    this.diligence_types = getDiligenceType(this.is_manager);

    this.addPermissionForm = new FormGroup({
      resourceType: new FormControl(),
      entity: new FormGroup({
        entity_type: new FormControl(this.diligence_types[0].value),
        entity_id: new FormControl(),
        customDateFilter: new FormControl(),
      }),
      entities: new FormControl(null),
    });
    this.entity_type = this.diligence_types[0].value;

    this.addPermissionForm.valueChanges.subscribe((val) => {
      this.onChangeResources.next(val);
    });

    this.entityDisplayParams = {
      id: 'id',
      name: 'display_name',
    };
    this.diligenceDisplayParams = {
      id: 'id',
      name: 'name',
    };

    this.filters = filtersConstants;

    if (!this.editMode) {
      this.getData();
    } else {
      this.allowUnderlyingEntities = this.resources.allow_underlying_entities;
      this.onResourceTypeChanged.emit(this.resources.entity_type);
    }
  }

  getData() {
    this.loading = true;
    this.getFirmPref();
    const observables = [];
    observables.push(this.FundDataService.getFunds());
    observables.push(this.getFirms());
    observables.push(this.TemplateDataService.getTemplates(''));
    forkJoin(observables)
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe((responses: any[]) => {
        this.funds = responses[0].data.map((item) => {
          if (!item?.strategyID) {
            item.strategyID = item.strategyId;
          }
          return item;
        });
        this.fundsCopy = Object.assign({}, this.funds);
        this.firms = responses[1].data;
        this.firmsCopy = Object.assign({}, this.firms);
        this.entities = this.firms;
        this.templates = responses[2].map((x) => ({
          id: x.templateInfo.id,
          name: x.templateInfo.name,
        }));
        this.templatesCopy = [...this.templates];
        this.getParentResourceCategory();
        this.getResources(this.addPermissionForm.value.resourceType);
        this.loading = false;
      });
  }

  ngOnChanges(changes: SimpleChanges) {
    // not used now as we don't remove entities for which permissions is assigned
    if (
      changes.selectedEntities &&
      changes.selectedEntities.currentValue !==
        changes.selectedEntities.previousValue
    ) {
      if (this.funds) {
        this.fundsCopy = [];
        this.funds.forEach((fund) => {
          let fundIndex = this.selectedEntities.indexOf(
            this.selectedEntities.find(
              (entity) =>
                entity.entity_type === keywordConstants.Product &&
                entity.entity_id == fund.id
            )
          );
          if (fundIndex === -1) {
            this.fundsCopy.push(Object.assign({}, fund));
          }
        });
      }
      if (this.firms) {
        this.firmsCopy = [];
        this.firms.forEach((firm) => {
          let firmIndex = this.selectedEntities.indexOf(
            this.selectedEntities.find(
              (entity) =>
                entity.entity_type === keywordConstants.Firm &&
                entity.entity_id == firm.id
            )
          );
          if (firmIndex === -1) {
            this.firmsCopy.push(Object.assign({}, firm));
          }
        });
      }
      if (this.templates) {
        this.templatesCopy = [];
        this.templates.forEach((template) => {
          let templateIndex = this.selectedEntities.indexOf(
            this.selectedEntities.find(
              (entity) =>
                entity.entity_type === keywordConstants.Template &&
                entity.entity_id == template.id
            )
          );
          if (templateIndex === -1) {
            this.templatesCopy.push(Object.assign({}, template));
          }
        });
      }
      if (this.addPermissionForm) {
        if (this.addPermissionForm.value.resourceType === 'DueDiligence') {
          this.filterDiligences(this.selectedEntities, this.diligenceBackup);
        }

        if (
          this.addPermissionForm.value.resourceType == keywordConstants.Product
        ) {
          this.entitySource = this.fundsCopy;
        } else if (
          this.addPermissionForm.value.resourceType === keywordConstants.Firm
        ) {
          this.entitySource = this.firmsCopy;
        } else if (
          this.addPermissionForm.value.resourceType == keywordConstants.Template
        ) {
          this.entitySource = this.templatesCopy;
        }
      }
    }
  }

  getFirmPref() {
    this.PermissionService.firm_preferences(
      (response) => {
        this.customDateFilter = this.UtilsService.getPredefinedDateRanges(
          response.default_daterange_months
        );
        this.customDateFilter.range =
          response?.default_daterange_months ?? 'null';
        if (response.default_daterange_months) {
          this.dateRangeForDirectives = {
            startDate: this.Utils.formatDatetime(
              this.customDateFilter.startDate
            ),
            endDate: this.Utils.formatDatetime(this.customDateFilter.endDate),
            range: response?.default_daterange_months ?? 'null',
          };
        } else {
          this.dateRangeForDirectives =
            this.Utils.formatDate(this.customDateFilter.startDate) ==
              this.Utils.formatDate(this.customDateFilter.endDate) &&
            this.customDateFilter.range == 'null'
              ? null
              : {
                  startDate: this.Utils.formatDatetime(
                    this.customDateFilter.startDate
                  ),
                  endDate: this.Utils.formatDatetime(
                    this.customDateFilter.endDate
                  ),
                  range: 'null',
                };
        }
      },
      () => {}
    );
  }

  getFirms() {
    const params = {
      include_contacts: false,
      include_custom_fields: false,
      include_dates: false,
      is_active: true,
      filters: {},
    };
    return this.FirmDataService.getFirms(params);
  }

  getResources(type) {
    this.onResourceTypeChanged.emit(type); // to change visibility options for Template type
    this.selectMyFirm = false;
    this.entitySource = null;
    this.allowUnderlyingEntities = false;
    if (type === 'my_firm') {
      this.entity_type = keywordConstants.MyFirm;
      this.entitySource = [];
      this.setMyFirmSelection();
      this.selectMyFirm = true;
      if (this.is_manager) {
        this.allowUnderlyingEntities = true;
      }
    } else if (type == 'Firm') {
      this.entitySource = this.gridData
        ? this.filterByReference(this.firmsCopy, this.gridData)
        : this.firmsCopy;
      if (!this.is_manager) {
        this.allowUnderlyingEntities = true;
      }
    } else if (type == 'Fund') {
      this.entitySource = this.gridData
        ? this.filterByReference(this.fundsCopy, this.gridData)
        : this.fundsCopy;
    } else if (type == 'DueDiligence') {
      this.setDiligenceType(this.addPermissionForm.value.entity.entity_type);
    } else if (type == 'Template') {
      this.entitySource = this.gridData
        ? this.filterByReference(this.templatesCopy, this.gridData)
        : this.templatesCopy;
      // this.entitySource = this.templatesCopy;
    }
    this.onUnderlyingEntitiesOptionChange(this.allowUnderlyingEntities);
  }

  filterByReference = (gridData, selectedRows) => {
    let res = [];
    gridData = Object.assign([], gridData);
    res = gridData?.filter((el) => {
      return !selectedRows?.find((element) => {
        return element.entity_id == el.id;
      });
    });
    return res;
  };

  onDiligenceEntityChange(value) {
    this.addPermissionForm.get('entity').patchValue({
      entity_type: this.entity_type,
      entity_id: value,
    });
    this.getDiligenceByEntity();
  }

  getDiligenceByEntity() {
    if (
      this.addPermissionForm.value.entity.entity_id &&
      this.customDateFilter
    ) {
      if (
        this.entity_type == keywordConstants.Firm ||
        this.entity_type === keywordConstants.MyFirm
      ) {
        this.DueDiligenceDataService.getDiligenceByFirm(
          this.addPermissionForm.value.entity.entity_id,
          {
            start_date: this.customDateFilter.startDate,
            end_date: this.customDateFilter.endDate,
          }
        ).subscribe((res) => {
          this.diligenceBackup = res;
          this.filterDiligences(this.selectedEntities, res);
        });
      } else {
        this.DueDiligenceDataService.getDiligenceByFund(
          this.addPermissionForm.value.entity.entity_id,
          {
            start_date: this.customDateFilter.startDate,
            end_date: this.customDateFilter.endDate,
          }
        ).subscribe((res) => {
          this.diligenceBackup = res;
          this.filterDiligences(this.selectedEntities, res);
        });
      }
    }
  }

  filterDiligences(selectedEntities, diligences) {
    let entitySource = [];
    diligences.forEach((project) => {
      let projectIndex = selectedEntities?.indexOf(
        (entity) =>
          entity.entity_type == keywordConstants.Project &&
          entity.entity_id == project.id
      );
      if (projectIndex == -1 || projectIndex == undefined) {
        entitySource.push(project);
      }
    });
    this.entitySource = this.gridData
      ? this.filterByReference(entitySource, this.gridData)
      : entitySource;
  }
  setMyFirmSelection() {
    this.addPermissionForm.patchValue({
      entities: this.firms.filter((val) => val.id === this.currentFirmId),
    });
  }

  getParentResourceCategory() {
    this.parentResources = [
      { name: 'Firm', id: 3, display_name: 'Firm' },
      { name: 'Fund', id: 1219, display_name: 'Product' },
      { name: 'DueDiligence', id: 1105, display_name: 'Project' },
      { name: 'Template', id: 1221, display_name: 'Template' },
    ];
    if (this.is_manager)
      this.parentResources = [
        { name: 'my_firm', id: 11088, display_name: 'My Firm' },
        { name: 'Firm', id: 3, display_name: 'Investor' },
        { name: 'Fund', id: 1219, display_name: 'Product' },
        { name: 'DueDiligence', id: 1105, display_name: 'Project' },
        { name: 'Template', id: 1221, display_name: 'Template' },
      ];
    this.addPermissionForm.patchValue({
      resourceType: this.permission_entity_type
        ? this.permission_entity_type
        : this.parentResources[0].name,
    });
  }

  getEntityTypeName(type) {
    let displayName = this.UtilsService.getDisplayEntityType(
      this.resources.entity_type
    );
    if (this.is_manager && displayName === keywordConstants.Firm) {
      displayName = 'Investor';
    }
    return displayName;
  }

  setDiligenceType(type) {
    if (type !== this.entity_type) {
      this.addPermissionForm.get('entity').patchValue({
        entity_type: type,
        entity_id: null,
      });
      this.diligenceEntityComponent?.clear();
    }
    this.diligences = null;
    this.entitySource = [];
    this.entity_type = type;
    if (this.entity_type === keywordConstants.Firm) {
      this.entities = this.firms;
    } else if (this.entity_type === keywordConstants.MyFirm) {
      this.entities = [];
      this.entity_id = this.currentFirmId;
      this.addPermissionForm.get('entity').patchValue({
        entity_type: keywordConstants.MyFirm,
        entity_id: this.currentFirmId,
      });
      this.getDiligenceByEntity();
    } else {
      this.entities = this.funds;
    }
  }

  onChange(event) {
    this.customDateFilter = {
      ...this.customDateFilter,
      startDate: this.Utils.formatDatetime(event.startDate),
      endDate: this.Utils.formatDatetime(event.endDate),
      range: event.range,
      selectedRange: event.startDate ? '' : 'No Filter',
    };
    this.dateRangeForDirectives = {
      startDate: event.startDate,
      endDate: event.endDate,
      range: event.range,
    };
    this.getDiligenceByEntity();
  }

  onClearDateFilter() {
    this.customDateFilter = {
      selectedRange: 'No Filter',
      startDate: null,
      endDate: null,
      range: 'null',
    };
    this.dateRangeForDirectives = null;
    this.getDiligenceByEntity();
  }

  handleonChangeEntity(allEntities) {
    this.addPermissionForm.patchValue({
      entities: allEntities,
    });
  }

  onUnderlyingEntitiesOptionChange(value) {
    this.onAllowUnderlyingEntitiesOptionChange.emit(value);
  }
}
