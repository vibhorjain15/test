import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import {
  EntityType,
  ErrorStatusCode,
  keywordConstants,
  PeriodOptions,
  USER_ROLES,
} from 'src/app2/shared/constants/constant';
import { HttpClient } from '@angular/common/http';
import { DvSelectorListComponent } from 'src/app2/shared/components/dv-selector-list/dv-selector-list.component';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { DateRangePickerComponent } from 'src/app2/shared/components/date-range-picker/date-range-picker.component';
import { ToastrService } from 'ngx-toastr';
import { FirmDataService } from 'src/app2/services/firm-data.service';
import { UserState } from 'src/app2/store/user/user.state';
import { Select } from '@ngxs/store';
import { take } from 'rxjs/operators';
import { saveAs } from 'file-saver';
import { of } from 'rxjs';
import * as moment from 'moment';
import { ErrorHandlerService } from 'src/app2/services/error-handler.service';
import { PermissionService } from 'src/app2/services/permission/permission.service';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app2/shared/shared.module';

@Component({
  selector: 'app-manage-aum-tr',
  templateUrl: './manage-aum-tr.component.html',
  styleUrls: ['./manage-aum-tr.component.css'],
  standalone: true,
  imports: [CommonModule, SharedModule],
})
export class ManageAumTrComponent implements AfterViewInit, OnInit {
  period_options: any[] = PeriodOptions;
  table_type_options: any[] = [
    {
      id: -1,
      name: 'Both AUM and Track Record',
    },
    {
      id: 0,
      name: 'AUM',
    },
    {
      id: 1,
      name: 'Track Record',
    },
  ];
  entity_type_options: any[] = [
    {
      id: 1220,
      name: 'Firm',
    },
    {
      id: 5004,
      name: 'Strategy',
    },
    {
      id: 1219,
      name: 'Product',
    },
    {
      id: 1217,
      name: 'Vehicle',
    },
  ];
  entity_type_id_mapping = {
    '-1': {
      name: 'My Firm',
      url: 'firms',
      dv_selector_name: 'firms',
    },
    1220: {
      name: 'Firm',
      url: 'firms',
      dv_selector_name: 'firms',
    },
    1219: {
      name: 'Product',
      url: 'funds',
      dv_selector_name: 'products',
    },
    1217: {
      name: 'Vehicle',
      url: 'vehicles',
      dv_selector_name: 'vehicles',
    },
    5004: {
      name: 'Strategy',
      url: 'strategies',
      dv_selector_name: 'strategies',
    },
  };
  download_aum_tr_configuration_form: FormGroup;
  entities: any[] = [];
  selector_params = {
    id: 'id',
    name: 'display_name',
  };
  selected_entities: any = {};
  selected_entity_type;
  selected_entity_types: number[] = [];
  max_date = new Date();
  min_date = new Date('01-01-1940');
  dv_selector_params = null;
  is_downloading: boolean = false;
  selected_entities_count: number = 0;
  custom_date = {
    range: 12,
  };
  currentFirm;
  isDateRangeSelectionApplied: boolean = false;
  endDate = new Date();
  loading: boolean = false;
  @Select(UserState.getCurrentUserData) user;
  @ViewChild('entitySelector', { static: false })
  entity_selector: DvSelectorListComponent;
  @ViewChild('yearPicker') year_picker: DateRangePickerComponent;

  constructor(
    private readonly http: HttpClient,
    private readonly ModalFactory: CustomModalService,
    private readonly toaster: ToastrService,
    private readonly firmDataService: FirmDataService,
    private readonly errorHandlerService: ErrorHandlerService,
    private readonly permissionService: PermissionService
  ) {
    this.download_aum_tr_configuration_form = new FormGroup({
      years_control: new FormControl(null, [Validators.required]),
      table_type_control: new FormControl(null),
      period_control: new FormControl(null),
      entity_type_control: new FormControl(null, [Validators.required]),
    });
  }

  ngAfterViewInit(): void {
    this.download_aum_tr_configuration_form
      .get('entity_type_control')
      .valueChanges.subscribe((value) => {
        if (value != null) {
          this.dv_selector_params = {
            name: this.entity_type_id_mapping[value].name,
            entity_type: this.entity_type_id_mapping[value].dv_selector_name,
          };

          if (this.entity_selector) {
            this.entity_selector.loading_entities = true;
          }

          let selected_entities = {
            ...this.selected_entities,
          };
          this.selected_entity_type = null;
          this.entities = [];
          let entities_observable;
          if (value == EntityType.Vehicle || value == EntityType.Fund) {
            entities_observable = this.http.get(
              this.entity_type_id_mapping[value].url
            );
          } else if (value == EntityType.Firm) {
            entities_observable = this.firmDataService.getFirms({
              include_contacts: false,
              include_custom_fields: false,
              include_dates: false,
              is_active: true,
              filters: {},
            });
          } else if (value == EntityType.Strategy) {
            entities_observable = this.http.post(
              `service/dvapi_service/product_search`,
              {
                filters: {},
                include_contacts: false,
                include_custom_fields: false,
                include_dates: false,
                search_for: 'strategy',
              }
            );
          } else if (value == -1) {
            // condition for My Firm entity type for managers
            entities_observable = of([
              {
                id: this.currentFirm.id,
                name: this.currentFirm.name,
                display_name: this.currentFirm.display_name,
                is_selected: false,
              },
            ]);
          }
          entities_observable.subscribe(
            (response: any) => {
              if (value == EntityType.Firm || value == EntityType.Strategy) {
                this.entities = response.data;
              } else {
                this.entities = response;
              }
              setTimeout(() => {
                this.selected_entity_type = value;
                this.entity_selector.setSelectedEntities(
                  selected_entities[this.selected_entity_type]?.items
                );
                this.entity_selector.loading_entities = false;
              }, 100);
            },
            (err) => {
              this.entity_selector.loading_entities = false;
            }
          );
        }
      });

    this.download_aum_tr_configuration_form.patchValue({
      table_type_control: -1,
      period_control: -1,
    });
  }

  ngOnInit(): void {
    this.errorHandlerService.handleError(new Error('test error'));
    this.user.pipe(take(1)).subscribe(async (user) => {
      if (user && user.isManager) {
        this.currentFirm = user?.firmInfo;
        let firmEntityTypeOption = this.entity_type_options.find(
          (item) => item.id === EntityType.Firm
        );
        firmEntityTypeOption.name = 'Investor';
        this.entity_type_id_mapping[firmEntityTypeOption.id] = {
          ...this.entity_type_id_mapping[firmEntityTypeOption.id],
          name: 'Investor',
          dv_selector_name: 'investors',
        };
        this.entity_type_id_mapping = { ...this.entity_type_id_mapping };
        if (await this.hasAccessToCurrentFirm(user)) {
          if (!this.entity_type_options.find((item) => item.id === -1)) {
            this.entity_type_options.unshift({
              id: -1,
              name: 'My Firm',
            });
          }
        }
        this.entity_type_options = [...this.entity_type_options];
      }
    });
  }

  async hasAccessToCurrentFirm(user): Promise<boolean> {
    if (user.firmwide_role?.toLowerCase() != USER_ROLES.RESTRICTED) {
      return true;
    } else {
      let permissions: any[] = (await this.permissionService
        .getMyPermissionGridRowData(
          this.currentFirm.id,
          user.id,
          keywordConstants.Firm,
          true
        )
        .toPromise()) as any[];
      return (
        permissions.filter(
          (permission) =>
            permission.entity_type == keywordConstants.Firm &&
            permission.entity_id == this.currentFirm.id
        ).length > 0
      );
    }
  }

  handleEntitySelectionChange(selected_entities) {
    if (selected_entities && this.selected_entity_type) {
      let total_selected_entities_count =
        this.selected_entities_count -
        (this.selected_entities[this.selected_entity_type]?.items?.length ??
          0) +
        selected_entities.length;
      if (total_selected_entities_count <= 20) {
        this.selected_entities[this.selected_entity_type] = {
          items: [...selected_entities],
          is_open:
            this.selected_entities[this.selected_entity_type]?.is_open ?? false,
        };

        if (
          selected_entities.length > 0 &&
          !this.selected_entity_types.includes(this.selected_entity_type)
        ) {
          this.selected_entity_types.push(this.selected_entity_type);
        } else if (
          selected_entities.length == 0 &&
          this.selected_entity_types.includes(this.selected_entity_type)
        ) {
          this.removeEntityType(this.selected_entity_type);
        }

        this.computeSelectedEntitiesCount();
        for (let entity_type of this.selected_entity_types) {
          if (
            entity_type == this.selected_entity_type &&
            this.selected_entities[entity_type]?.items &&
            this.selected_entities[entity_type]?.items?.length > 0
          ) {
            this.selected_entities[entity_type].is_open = true;
          } else if (entity_type != this.selected_entity_type) {
            this.selected_entities[entity_type].is_open = false;
          }
        }
      } else {
        this.toaster.error(
          'Maximum of 20 entities can be selected to download'
        );
        let current_selected_entities =
          this.selected_entities[this.selected_entity_type]?.items ?? [];
        let new_selections = selected_entities.filter(
          (entity) =>
            !current_selected_entities.find((item) => item.id === entity.id)
        );

        this.entity_selector.unselectEntities(new_selections);
      }
    }
  }

  computeSelectedEntitiesCount() {
    let selected_entities_count = 0;
    for (let index in this.selected_entity_types) {
      selected_entities_count +=
        this.selected_entities[this.selected_entity_types[index]]?.items
          ?.length ?? 0;
    }
    this.selected_entities_count = selected_entities_count;
  }

  removeEntityType(entity_type) {
    this.selected_entity_types.splice(
      this.selected_entity_types.indexOf(entity_type),
      1
    );

    if (this.selected_entity_type == entity_type) {
      this.entity_selector.unselectEntities(
        this.selected_entities[entity_type].items
      );
    }

    delete this.selected_entities[entity_type];
    this.computeSelectedEntitiesCount();
  }

  removeEntity(entity_type, entity) {
    if (this.selected_entity_type == entity_type) {
      this.entity_selector.unSelectEntity(entity);
    } else {
      this.selected_entities[entity_type]?.items?.splice(
        this.selected_entities[entity_type]?.items?.indexOf(entity),
        1
      );
      if (this.selected_entities[entity_type].items.length == 0) {
        this.removeEntityType(entity_type);
      }
    }
    this.computeSelectedEntitiesCount();
  }

  onYearChange(val) {
    if (!this.isDateRangeSelectionApplied) {
      val = { endDate: val };
    }
    this.download_aum_tr_configuration_form.get('years_control').setValue(val);
  }

  downloadAumTrFile() {
    this.is_downloading = true;
    try {
      let entities = {};
      for (var key in this.selected_entities) {
        entities[key] = this.selected_entities[key].items.map(
          (item) => item.id
        );
      }

      if (entities['-1']) {
        // handle My Firm case for managers
        entities[EntityType.Firm] = (entities[EntityType.Firm] ?? []).concat(
          ...entities['-1']
        );
        delete entities['-1'];
      }

      let selected_table_type =
        this.download_aum_tr_configuration_form.get('table_type_control').value;
      let selected_period =
        this.download_aum_tr_configuration_form.get('period_control').value;

      let selected_years =
        this.download_aum_tr_configuration_form.get('years_control').value;
      let start_date = selected_years.startDate
        ? `${selected_years.startDate}-01-01 00:00:00`
        : null;
      let end_date = null;
      if (selected_years.endDate && this.isDateRangeSelectionApplied) {
      } else if (selected_years.endDate) {
        end_date = `${moment(selected_years.endDate).format(
          'YYYY-MM-DD'
        )} 23:59:59`;
      }

      this.http
        .post(
          'service/excel_services/aum_tr_download',
          {
            start_date,
            end_date,
            table_type: selected_table_type == -1 ? null : selected_table_type, // Type of the history table
            period: selected_period == -1 ? null : selected_period, // Period of the history table
            entity_list: entities,
            download_blank: false, // if true downloads an empty file else downloads file with existing aum/tr tables for the selected entities
          },
          {
            responseType: 'blob',
            observe: 'response',
          }
        )
        .subscribe(
          (response: any) => {
            let content_disposition_header = response.headers.get(
              'Content-Disposition'
            );
            let file_name = 'download.xlsx';
            try {
              file_name = content_disposition_header
                ?.split(';')[1]
                .split('filename')[1]
                .split('=')[1]
                .trim();
            } catch (err) {}
            saveAs(response.body, file_name);
            this.is_downloading = false;
          },
          (err) => {
            this.is_downloading = false;
            if (
              !(
                err &&
                err.status &&
                Object.values(ErrorStatusCode).includes(err.status)
              )
            ) {
              this.toaster.error(
                '',
                'Something went wrong while downloading AUM/TR file. Please try again.',
                {
                  timeOut: 1500,
                }
              );
            }
          }
        );
    } catch (err) {
      this.is_downloading = false;
      this.toaster.error(
        '',
        'Something went wrong while downloading AUM/TR file. Please try again.',
        {
          timeOut: 1500,
        }
      );
    }
  }

  goBack() {
    window.history.back();
  }

  resetSelection() {
    this.dv_selector_params = null;
    this.selected_entity_types = [];
    this.selected_entities = {};
    this.selected_entities_count = 0;
    this.selected_entity_type = null;
    this.download_aum_tr_configuration_form.patchValue({
      entity_type_control: null,
      table_type_control: -1,
      period_control: -1,
    });
    this.setDateRange([new Date(), new Date()]);
    this.endDate = new Date();
    this.isDateRangeSelectionApplied = false;
    this.download_aum_tr_configuration_form.markAsUntouched();
    // Spinner is used to indicate reset - purely for visual effects
    this.loading = true;
    setTimeout(() => (this.loading = false), 500);
  }

  openUploadModal() {
    this.ModalFactory.invoke('upload-aum-file');
  }

  setDateRange(dateRange) {
    this.year_picker?.setDateRange(dateRange);
  }

  handleEntityTypeOpenChange(entity_type, is_open) {
    this.selected_entities[entity_type].is_open = is_open;
  }
}
