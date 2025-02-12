import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Store } from '@ngxs/store';
import * as moment from 'moment';
import { finalize } from 'rxjs/operators';
import { QuestionnaireService } from 'src/app2/apis/questionnaire/questionnaire.service';
import { DiligenceType } from 'src/app2/apis/questionnaire/type/diligence.type';
import { UtilsService } from 'src/app2/services/utils.service';
import {
  keywordConstants,
  SingularToPluralTypes,
} from 'src/app2/shared/constants/constant';
import { CurrentUserModel } from 'src/app2/store/user/user.model';

@Component({
  selector: 'autofill-project-selection',
  templateUrl: './autofill-project-selection.component.html',
  styleUrls: ['./autofill-project-selection.component.css'],
})
export class AutofillProjectSelectionComponent implements OnInit {
  @Input() diligence: DiligenceType;
  @Input() user: CurrentUserModel;
  @Output() onProjectSelected: EventEmitter<number> = new EventEmitter();
  filterProjects: boolean = true;
  entityTypes = [
    { name: 'Firm', id: keywordConstants.Firm },
    { name: 'Strategy', id: keywordConstants.Strategy },
    { name: 'Product', id: keywordConstants.Product },
    { name: 'Vehicle', id: keywordConstants.Vehicle },
  ];
  entityType: string;
  entityTypeName: string;
  entityId: any;
  projectId: any;
  projects: any[] = [];
  projectsCopy: any[] = [];
  keywordConstants = keywordConstants;
  customDateFilter: any;
  dateRange: any;
  entities: { id: any; entityType: any; name: any }[];
  entitiesCopy: { id: any; entityType: any; name: any }[] = [];
  loadingProjects: boolean = true;

  constructor(
    private readonly store: Store,
    private readonly utils: UtilsService,
    private readonly questionnaireService: QuestionnaireService,
    readonly datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    const user = this.store.selectSnapshot((state) => state.user.currentUser);
    if (user.isManager) {
      this.entityTypes.find((x) => x.id === keywordConstants.Firm).name =
        'My Firm';
    }
    const defaultEntityType =
      this.entityTypes.find((x) => x.id === this.diligence.entity_type) ??
      this.entityTypes[0];
    this.entityType = defaultEntityType.id;
    this.entityTypeName = defaultEntityType.name;
    this.getFirmPref();
  }

  getProjects() {
    this.loadingProjects = true;
    const params = {
      start_date: this.dateRange?.startDate ?? null,
      end_date: this.dateRange?.endDate ?? null,
    };
    this.questionnaireService
      .getAutofillProjects(this.diligence.id, params)
      .pipe(finalize(() => (this.loadingProjects = false)))
      .subscribe((projects: any[]) => {
        this.projects = projects;
        this.projectsCopy = [...this.projects];
        this.generateEntities();
      });
  }

  getFirmPref() {
    const firmPreferences = this.store.selectSnapshot(
      (state) => state.user.firmPreference
    );
    this.customDateFilter = this.utils.getPredefinedDateRanges(
      firmPreferences.default_daterange_months
    );
    if (firmPreferences.default_daterange_months) {
      this.dateRange = {
        startDate: this.utils.formatDatetime(this.customDateFilter.startDate),
        endDate: this.utils.formatDatetime(this.customDateFilter.endDate),
        range: firmPreferences.default_daterange_months ?? 'null',
      };
    } else {
      this.dateRange = null;
      this.getProjects(); // for other date range options, this will be called from onDateRangeChange() function
    }
  }

  setEntityType(entityType) {
    this.entityType = entityType;
    this.entityTypeName = this.entityTypes.find(
      (x) => x.id === entityType
    ).name;
    this.entities = this.entitiesCopy?.filter(
      (x) => x.entityType === entityType
    );
    this.onEntityChanged(this.entities.length ? this.entities[0].id : null); // auto select the first entity
  }

  generateEntities() {
    this.entitiesCopy = this.projectsCopy.map((diligence) => {
      return {
        id: diligence.entity_id,
        entityType: diligence.entity_type,
        name: diligence.entity_name,
      };
    });
    // remove duplicates
    this.entitiesCopy = this.entitiesCopy.filter(
      (entity, index, array) =>
        array.findIndex(
          (x) =>
            x.id === entity.id &&
            x.entityType === entity.entityType &&
            x.name === entity.name
        ) === index
    );
    this.entities = this.entitiesCopy.filter(
      (x) => x.entityType === this.entityType
    );

    // if entity is selected previously, pick that entity
    // else pick the one associated with the project
    // else pick thr first one in the list
    let defaultEntity;
    if (this.entities.length) {
      defaultEntity =
        this.entities.find(
          (x) => x.id === this.entityId ?? this.diligence.entity_id
        ) ?? this.entities[0];
    }
    this.onEntityChanged(defaultEntity?.id);
  }

  filterDiligences() {
    if (!this.projectsCopy.length) {
      return;
    }
    this.projects = this.projectsCopy.filter(
      (diligence) =>
        diligence.entity_type === this.entityType &&
        diligence.entity_id === this.entityId
    );
  }

  onEntityChanged(entityId) {
    this.entityId = entityId;
    this.projectId = null;
    this.onProjectSelection(this.projectId);
    this.filterDiligences();
  }

  onDateRangeChange(event) {
    if (event && event.startDate && event.endDate) {
      this.dateRange = {
        startDate: event.startDate,
        endDate: event.endDate,
      };
      this.getProjects();
    }
  }

  onClearDateFilter() {
    setTimeout(() => {
      this.dateRange = null;
      this.getProjects();
    });
  }

  onProjectSelection(id) {
    this.onProjectSelected.emit(id);
  }

  getDiligenceSettings() {
    return [
      {
        'Entity Type': this.entityType,
      },
      {
        [SingularToPluralTypes[this.entityType]]: [this.entityId],
      },
      {
        Date:
          this.datePipe.transform(this.dateRange?.startDate, 'dd MMM YYYY') +
          ' - ' +
          this.datePipe.transform(this.dateRange?.endDate, 'dd MMM YYYY'),
      },
    ];
  }
}
