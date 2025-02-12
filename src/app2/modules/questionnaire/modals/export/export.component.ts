import { HttpClient } from '@angular/common/http';
import { Component, Inject, Input, OnInit, ViewChild } from '@angular/core';
import { Store } from '@ngxs/store';
import { ToastrService } from 'ngx-toastr';
import { forkJoin } from 'rxjs';
import { QuestionnaireService } from 'src/app2/apis/questionnaire/questionnaire.service';
import { RouterService } from 'src/app2/services/router.service';
import { GeneratePresentationReportComponent } from '../../components';
import { dvTabsList } from 'src/app2/shared/components/dv-tabs/dv-tabs.model';
import { CurrentUserModel } from 'src/app2/store/user/user.model';
import { DownloadMedium } from 'src/app2/shared/constants/constant';
import { LayoutUtilsService } from 'src/app2/services/layout-utils.service';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';

enum ExportType {
  Word,
  Excel,
  OriginalDoc,
  PresentationReport,
}

@Component({
  selector: 'app-export-modal',
  templateUrl: './export.component.html',
  styleUrls: ['./export.component.css'],
})
export class ExportModal implements OnInit {
  loading: boolean = false;
  is_investor: boolean;
  is_freeSubscription: boolean;
  firm_preferences: any;
  firm_preferences_copy;
  templates: any[];
  saving_preferences: boolean;
  filterTemplate = '';
  @Input() current_user: CurrentUserModel;
  @Input() diligence;
  @Input() successCallback;
  exportSub;
  export_preference_properties = [];
  radioModel;
  questions;
  selected_questions;
  loading_data: boolean = true;
  exportDownloadLabel;
  downloadMedium;
  exportTabList: dvTabsList[] = [
    {
      name: 'Stylized Word Export',
      link: ExportType.Word,
      active: true,
      condition: true,
      tooltip: '',
    },
    {
      name: 'Excel Export',
      link: ExportType.Excel,
      active: false,
      condition: true,
      tooltip: '',
    },
  ];
  is_word_export: boolean = true;
  selected_export_type = ExportType.Word;
  selected_template;
  is_question_selection_enabled: boolean = false;
  selector_params = {
    id: 'id',
    name: 'text',
  };
  exportButtonLabel = 'Download';
  replaceBetweenQuestions: boolean = true;
  exportToOriginalWithoutReplacing: boolean = false;

  @ViewChild('presentationReport')
  presentationReportComponent: GeneratePresentationReportComponent;

  constructor(
    private readonly http: HttpClient,
    private readonly toastr: ToastrService,
    private route: RouterService,
    private readonly store: Store,
    private readonly questionnaire: QuestionnaireService,
    private readonly modalRef: CustomModalService,
    private readonly LayoutUtils: LayoutUtilsService,
    private readonly sweetAlert: SweetAlertService
  ) {}

  ngOnInit(): void {
    this.is_investor = this.current_user.isInvestor;
    this.is_freeSubscription = this.current_user.isFreeSubscription;
    this.firm_preferences = JSON.parse(
      JSON.stringify(
        this.store.selectSnapshot((state) => state.user.firmPreference)
      )
    );
    this.firm_preferences_copy = { ...this.firm_preferences };
    if (this.is_freeSubscription) {
      this.exportTabList[0].name = 'Standard Word Export';
    }
    if (!this.is_investor) {
      let disabledTooltip =
        this.diligence.diligence_type != 'dd_doc'
          ? this.current_user.isFreeSubscription
            ? 'Digitize questionnaires received in Word and Excel and export back into the original format with a premium subscription. Click this tab to visit our upgrade page.'
            : 'Available for questionnaires digitized with the document parser.'
          : null;

      this.exportTabList.push({
        link: ExportType.OriginalDoc,
        name: 'Export to Original File',
        active: false,
        disabled: this.diligence.diligence_type != 'dd_doc',
        condition: true,
        tooltip: disabledTooltip,
      });
    } else if (this.is_investor && !this.diligence.notVisible) {
      this.exportTabList.push({
        link: ExportType.PresentationReport,
        name: 'Generate Presentation Report',
        disabled:
          this.current_user.isFreeSubscription ||
          !this.firm_preferences.show_presentation_module,
        condition: true,
        tooltip: this.current_user.isFreeSubscription
          ? 'This is available with a premium subscription. Click this tab to write to us to learn about digitizing your due diligence workflows and creating custom presentation reports.'
          : !this.firm_preferences.show_presentation_module
          ? 'Please write to us to learn about creating custom presentation reports. Click this tab to open the form.'
          : '',
        active: false,
      });
    }
    this.LayoutUtils.initializeRootScope();
    this.initialize();
  }

  initialize() {
    forkJoin(
      this.loadTemplates(),
      this.loadQuestions(),
      (templates, questions) => ({
        templates,
        questions,
      })
    ).subscribe((response) => {
      this.templates = response.templates ?? [];
      this.questions = response.questions;
      this.downloadMedium = this.firm_preferences_copy.doc_access_preference;
      if (
        this.firm_preferences_copy.doc_access_preference == DownloadMedium.BOTH
      ) {
        this.exportButtonLabel = 'Download & Email';
      }
      this.exportDownloadLabel = this.exportButtonLabel;
      this.setSelectedExportType(ExportType.Word);
    });
  }

  loadTemplates() {
    return this.http.get(`DocumentExportTemplates`);
  }

  navigateToPremium() {
    if (this.is_investor) {
      this.modalRef.close();
      this.LayoutUtils.toggleFeedbackPanel();
    } else {
      this.sweetAlert.premiumAlert();
    }
  }

  loadQuestions() {
    return this.http.post('service/excel_services/diligence_questions', {
      project_id: this.diligence.id,
      template_id: this.diligence.template_id,
    });
  }

  submit(modalCallback) {
    this.loading = true;
    let export_preferences = {};
    if (this.selected_export_type == ExportType.PresentationReport) {
      this.presentationReportComponent.submit(modalCallback);
      return;
    }
    if (this.is_word_export || !this.is_question_selection_enabled) {
      for (let index in this.export_preference_properties) {
        export_preferences[this.export_preference_properties[index]] =
          this.firm_preferences_copy[this.export_preference_properties[index]];
      }
    }

    let params: any;
    if (this.is_word_export) {
      // normal word export
      params = export_preferences;
      if (
        this.selected_template &&
        !this.selected_template.is_system_template
      ) {
        params.report_template_id = this.selected_template.id;
        params.report_template_name = this.selected_template.name;
      }
      this.exportWordReport(params, modalCallback);
    } else if (this.is_question_selection_enabled) {
      // diligence question export
      if (!this.selected_questions?.length) {
        this.toastr.error('Please select questions to export');
        this.loading = false;
        return;
      }
      params = {
        question_ids: this.selected_questions.map((question) => question.id),
      };
      this.exportQuestionReport(params, modalCallback);
    } else if (this.selected_export_type === ExportType.OriginalDoc) {
      let originalExportParams = {
        diligence_id: this.diligence.id,
        export_to_updated: this.replaceBetweenQuestions,
        replace_between_questions: false,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
      this.exportOriginalDoc(originalExportParams, modalCallback);
    } else {
      // normal excel export
      params = export_preferences;
      this.exportExcelReport(params, modalCallback);
    }
    modalCallback();
  }

  exportWordReport(params: any, modalCallback) {
    params.diligence_id = this.diligence.id;
    params.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    this.questionnaire.exportToWord(params).subscribe(() => {
      this.showToasterAndCloseModal(modalCallback);
    });
  }

  exportExcelReport(params: any, modalCallback) {
    if (!this.firm_preferences_copy?.include_comments_excel_export) {
      params.split_comments = false;
    }
    params.diligence_ids = this.diligence.id;
    params.firm_name = this.current_user.firmInfo.name;
    params.template_id = this.diligence.template_id;
    params.template_name = this.diligence.template_name;
    this.questionnaire.exportToExcel({ ...params }).subscribe(() => {
      this.showToasterAndCloseModal(modalCallback);
    });
  }

  exportQuestionReport(params: any, modalCallback) {
    params.firm_id = this.current_user.firmInfo.id;
    params.firm_name = this.current_user.firmInfo.name;
    params.project_ids = [this.diligence.id];
    params.template_id = this.diligence.template_id;
    params.template_name = this.diligence.template_name;
    params.recipients = this.current_user.userName;
    this.questionnaire.exportQuestions({ ...params }).subscribe(() => {
      this.showToasterAndCloseModal(modalCallback);
    });
  }

  showToasterAndCloseModal(modalCallback: any) {
    this.loading = false;
    let message =
      "Once the document is ready for download, it will be accessible in the 'My Downloads' section.";
    if (this.downloadMedium == DownloadMedium.BOTH) {
      message =
        "Once the document is ready for download, it will be accessible in the 'My Downloads' section and in your inbox.";
    }
    this.toastr.success(
      message,
      `Export request received and is being processed`
    );
    modalCallback();
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

  setSelectedExportType(export_type) {
    this.loading_data = true;
    this.selected_export_type = export_type;
    this.is_word_export = export_type == ExportType.Word;
    this.firm_preferences_copy = { ...this.firm_preferences };
    if (this.is_word_export) {
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

      let default_template = this.templates?.find(
        (template) =>
          template.id ===
          this.firm_preferences.default_document_export_template_id
      );
      this.selected_template =
        default_template ??
        this.templates?.find((template) => template.is_system_template);
    } else {
      this.export_preference_properties = [
        'include_responses_excel_export',
        'include_comments_excel_export',
        'split_comments',
        'include_internal_key',
        'transpose_excel_columns',
        'include_ratings_excel_export',
        'include_flags_excel_export',
      ];

      this.is_question_selection_enabled = false;
      this.selected_questions = [];
    }
    if (this.selected_export_type == 3) {
      this.exportButtonLabel = 'Export';
    } else {
      this.exportButtonLabel = this.exportDownloadLabel;
    }
    this.loading_data = false;
  }

  handleDisabledTabClick(tabIndex) {
    const selectedTab = this.exportTabList[tabIndex];
    if (
      selectedTab.link === ExportType.OriginalDoc &&
      this.current_user.isFreeSubscription
    )
      this.sweetAlert.premiumAlert();
    else if (
      selectedTab.link === ExportType.PresentationReport &&
      (this.current_user.isFreeSubscription ||
        !this.firm_preferences.show_presentation_module)
    ) {
      this.modalRef.close();
      this.LayoutUtils.toggleFeedbackPanel();
    }
  }

  exportOriginalDoc(params, modalCallback) {
    this.http
      .post('service/doc_processing_service/export_to_original', params)
      .subscribe((res) => {
        this.showToasterAndCloseModal(modalCallback);
      });
  }

  handleQuestionSelectionChange(questions) {
    this.selected_questions = questions;
  }

  redirectToTemplateDefinitions() {
    this.route.navigate('app.firm.settings.export_preferences');
  }

  goToPremium() {
    this.sweetAlert.premiumAlert();
  }

  handleReplaceBetweenQuestions(value) {
    this.exportToOriginalWithoutReplacing = !value;
  }

  handleExportToOriginalWithoutReplacing(value) {
    this.replaceBetweenQuestions = !value;
  }
}
