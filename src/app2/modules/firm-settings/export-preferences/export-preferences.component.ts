import { Component, OnDestroy, OnInit } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { ToastrService } from "ngx-toastr";
import { UtilsService } from "src/app2/services/utils.service";
import { BaseDataService } from "src/app2/services/base-data.service";
import { SweetAlertService } from "src/app2/services/sweet-alert.service";
import { CustomModalService } from "src/app2/services/modal/customModal.service";
import { ExportPrefService } from "src/app2/services/export-preference/export-preference.service";
import { UserState } from "src/app2/store/user/user.state";
import { Select } from "@ngxs/store";
import * as $ from "jquery";
import { take } from "rxjs/operators";
import { RouterService } from "src/app2/services/router.service";
import { DownloadMedium } from "src/app2/shared/constants/constant";

@Component({
  selector: 'app-export-preferences',
  templateUrl: './export-preferences.component.html',
  styleUrls: ['./export-preferences.component.css'],
})
export class ExportPreferencesComponent implements OnInit, OnDestroy {
  is_investor: boolean;
  is_freeSubscription: boolean;
  firm_preferences: Object;
  firm_preferences_copy;
  templates = [];
  saving_preferences: boolean;
  filterTemplate = '';
  currentUser;
  exportSub;
  export_preference_properties = [];
  exportPrefList = [
    { label: 'Download', value: DownloadMedium.DOWNLOAD },
    { label: 'Download & Email', value: DownloadMedium.BOTH },
  ];
  @Select(UserState.getCurrentUserData) user;

  constructor(
    private readonly Utils: UtilsService,
    private readonly http: HttpClient,
    private readonly toastr: ToastrService,
    private readonly baseDataService: BaseDataService,
    private readonly NewModalFactory: CustomModalService,
    private readonly ExportPrefService: ExportPrefService,
    private readonly sweetAlertService: SweetAlertService,
    private readonly routerService: RouterService
  ) {}

  ngOnInit(): void {
    this.user.pipe(take(1))
      .subscribe((data) => {
        if (data) {
          this.currentUser = data;
          this.is_investor = data.isInvestor;
          this.is_freeSubscription = data.isFreeSubscription;
          this.initialize();
        }
      });
    this.exportSub = this.ExportPrefService.newTemplate.subscribe(
      ({ temp, isEdit }) => {
        if (isEdit) {
          let index = this.templates.indexOf(
            this.templates.find((val) => val.id === temp.id)
          );
          this.templates[index] = temp;
        } else {
          this.templates.push(temp);
          this.selectDefaultTemplate(temp);
        }
      }
    );
  }

  initialize() {
    this.loadPreferences();
    this.loadTemplates();
    this.export_preference_properties = this.is_investor
      ? ['include_ratings_word_export', 'include_flags_word_export']
      : [];
    this.export_preference_properties =
      this.export_preference_properties.concat([
        'include_question_only_export',
        'exclude_empty_response',
        'exclude_comments',
        'enable_grid_numbering',
        'enable_question_instructions_export',
        'enable_category_instructions_export',
        'enable_internal_notes_export',
        'enable_followups_export',
        'include_project_documents',
      ]);
  }

  loadPreferences() {
    this.http.get(`firm_preferences`).subscribe((response) => {
      this.firm_preferences = response;
      this.firm_preferences_copy = { ...this.firm_preferences };
    });
  }

  loadTemplates() {
    this.http
      .get(`DocumentExportTemplates`)
      .subscribe((response: any) => (this.templates = response));
  }

  submit() {
    this.saving_preferences = true;
    this.http.put(`firm_preferences`, this.firm_preferences_copy).subscribe(
      (response) => {
        this.toastr.success(
          'Word/Excel export preferences successfully saved',
          '',
          {
            timeOut: 5000,
          }
        );
        this.firm_preferences = response;
        this.firm_preferences_copy = { ...this.firm_preferences };
        this.saving_preferences = false;
      },
      (error) => {
        this.saving_preferences = false;
        this.loadPreferences();
        const avoid_error_logging_statuses =
          this.baseDataService.getAvoidErrorLoggingStatusList();
        this.toastr.error('Something went wrong. Please try again.');
        if (!Array.from(avoid_error_logging_statuses).includes(error.status)) {
          this.Utils.logError('Updating WordExport Preferences failed', error);
        }
      }
    );
  }

  downloadTemplate(template) {
    this.http
      .get(`DocumentExportTemplates/${template.id}/signed_url`)
      .subscribe((response) => {
        const url = response;
        const $link = $(
          `<a href=\"${url}\" target='_blank' class='hidden'></a>`
        );
        $('body').append($link);
        $link[0].click();
        $link.remove();
      });
  }

  addNewTemplate() {
    if (this.is_freeSubscription && !this.is_investor) {
      this.sweetAlertService.premiumAlert();
    } else if (!this.is_freeSubscription) {
      this.NewModalFactory.invoke('manage-export-template', {
        initialState: {
          template_list: this.templates,
        },
      });
    }
  }

  selectDefaultTemplate(template) {
    if (
      this.firm_preferences_copy.default_document_export_template_id ===
      template.id
    )
      this.firm_preferences_copy.default_document_export_template_id = null;
    else
      this.firm_preferences_copy.default_document_export_template_id =
        template.id;
  }

  editTemplate(template, index) {
    if (!template.is_system_template) {
      this.NewModalFactory.invoke('manage-export-template', {
        initialState: {
          template: { ...template },
          template_list: this.templates,
        },
      });
    }
  }

  removeTemplate(template, index) {
    this.http.delete(`DocumentExportTemplates/${template.id}`).subscribe(() => {
      this.toastr.success('Template removed successfully');
      this.templates.splice(index, 1);
      if (
        template.id ===
        this.firm_preferences_copy.default_document_export_template_id
      ) {
        this.firm_preferences_copy.default_document_export_template_id = null;
      }
    });
  }

  confirmTemplateDeletion(template, index) {
    if (!template.is_system_template) {
      this.sweetAlertService.confirm({
        title: 'Are you sure you want to remove this template?',
        focusCancel: true,
        showLoaderOnConfirm: true,
        preConfirm: () => {
          this.removeTemplate(template, index);
        },
      });
    }
  }

  trackByIndex(index: number, element): number {
    return index;
  }
  ngOnDestroy(): void {
    this.exportSub?.unsubscribe();
  }

  handleExportPreferenceChange(property: string) {
    // Toggle export preferences if only question export is selected
    if (property == 'include_question_only_export') {
      for (let index in this.export_preference_properties) {
        if (this.export_preference_properties[index] != property) {
          this.firm_preferences_copy[this.export_preference_properties[index]] =
            !this.firm_preferences_copy['include_question_only_export'];
        }
      }
    } else {
      let is_any_preference_selected =
        this.export_preference_properties.filter(
          (prop) =>
            this.firm_preferences_copy[prop] &&
            prop != 'include_question_only_export'
        ).length > 0;

      this.firm_preferences_copy['include_question_only_export'] =
        !is_any_preference_selected;
    }
  }
}
