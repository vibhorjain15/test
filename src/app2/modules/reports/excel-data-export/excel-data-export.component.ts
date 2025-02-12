import { HttpClient } from '@angular/common/http';
import {
  Component,
  ElementRef,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { UtilsService } from 'src/app2/services/utils.service';
import { ExportDataService } from 'src/app2/services/export-data.service';
import { TemplatesDataService } from 'src/app2/services/template-data.service';
import {
  DownloadMedium,
  FILTER_TERNARY_OPERATORS,
  ReportTypes,
} from 'src/app2/shared/constants/constant';
import { ToastrService } from 'ngx-toastr';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { Select, Store } from '@ngxs/store';
import { UserState } from 'src/app2/store/user/user.state';
import { take } from 'rxjs/operators';
import { DateRangePickerComponent } from 'src/app2/shared/components/date-range-picker/date-range-picker.component';
@Component({
  selector: 'app-excel-data-export',
  templateUrl: './excel-data-export.component.html',
  styleUrls: ['./excel-data-export.component.css'],
})
export class ExcelDataExportComponent implements OnInit {
  current_user: any;
  currentFirmId: number;
  firm_name: string;
  ReportTypes = ReportTypes;
  selectedQuestions: any[];
  searchText: string;
  manager_ids: any[];
  entities: { name: string }[];
  selected_entity_type: { name: string };
  FILTER_TERNARY_OPERATORS = FILTER_TERNARY_OPERATORS;
  selectedOnly: boolean;
  selected_entities_combined: any[];
  selected_entities: any[];
  completedDiligences: any[];
  current_page: number;
  filterByString: string;
  selection_list: any[];
  showAdvanceOptions: boolean;
  include_responses_excel_export: boolean;
  include_comments_excel_export: boolean;
  include_ratings_excel_export: boolean;
  split_comments: boolean;
  include_internal_key: boolean;
  transpose_excel_columns: boolean;
  include_flags_excel_export: boolean;
  loading: boolean;
  selected_type: string;
  global_ternary_operator: string;
  loading_prefs: boolean;
  templates: any;
  responseTypes: any;
  firms: any;
  selected_template: any = null;
  options: { template_id: any };
  is_loading: boolean;
  customDateFilter: { startDate: any; endDate: any; selectedRange: any };
  defaultDateRange: any;
  defaultCustomDateFilter: any;
  select_all_entities: boolean;
  disable_select_all: boolean;
  @Select(UserState.getCurrentUserData) user;
  @Select(UserState.getFirmPreferenceData) firmPref;
  @ViewChildren('myRef') containers: QueryList<ElementRef>;
  @ViewChild('dateRangePicker') dateRangePicker: DateRangePickerComponent;
  count = 0;
  dateRange: any;
  filteredListMeta = { count: 0, items: [] };
  exportButtonLabel = 'Download';
  downloadMedium;
  constructor(
    private readonly Utils: UtilsService,
    private readonly http: HttpClient,
    private readonly ExportDataService: ExportDataService,
    private readonly TemplateDataService: TemplatesDataService,
    private readonly toaster: ToastrService,
    private readonly ModalFactory: CustomModalService,
    private readonly store: Store
  ) {}

  ngOnInit(): void {
    this.initializeValues();
    this.getData();
  }

  initializeValues() {
    this.selected_type = this.ReportTypes.TEMPLATE;
    this.selectedQuestions = [];
    this.searchText = '';
    this.manager_ids = [];
    this.entities = [
      { name: 'Firm' },
      { name: 'Product' },
      { name: 'Strategy' },
      { name: 'Vehicle' },
    ];
    this.selected_entity_type = this.entities[0];
    this.global_ternary_operator = this.FILTER_TERNARY_OPERATORS.AND;
    this.selectedOnly = false;
    this.selected_entities_combined = [];
    this.selected_entities = [];
    this.completedDiligences = [];
    this.current_page = 0;
    this.filterByString = '';
    this.selection_list = [];
    this.showAdvanceOptions = false;
    this.user.pipe(take(1))
      .subscribe((data) => {
        if (data) {
          this.current_user = data;
          this.currentFirmId = data.firmInfo.id;
          this.firm_name = data.firmInfo.name;
        }
      });
  }

  getData() {
    this.getFirmPref();
    this.getTemplates();
    this.TemplateDataService.getResponseTypes().subscribe(
      (responseTypes: any) => {
        this.responseTypes = responseTypes;
      }
    );
    this.getFirms();
  }

  getFirmPref() {
    this.loading_prefs = true;
    this.firmPref.pipe(take(2)).subscribe((response) => {
      if (response) {
        this.downloadMedium = response.doc_access_preference;
        if (response.doc_access_preference == DownloadMedium.BOTH) {
          this.exportButtonLabel = 'Download & Email';
        }
        this.customDateFilter = this.Utils.getPredefinedDateRanges(
          response.default_daterange_months
        );
        this.customDateFilter.selectedRange = this.Utils.getDateRanges().find(
          (val) => `${val.value}` === `${response.default_daterange_months}`
        )?.label;
        this.dateRange = {
          startDate: this.Utils.formatDatetime(this.customDateFilter.startDate),
          endDate: this.Utils.formatDatetime(this.customDateFilter.endDate),
          range: response?.default_daterange_months ?? 'null',
        };
        this.defaultDateRange = { ...this.dateRange };
        this.customDateFilter = {
          ...this.customDateFilter,
          startDate: this.dateRange?.startDate,
          endDate: this.dateRange?.endDate,
        };
        this.defaultCustomDateFilter = { ...this.customDateFilter };
        this.loading_prefs = false;
        this.include_responses_excel_export =
          response.include_responses_excel_export;
        this.include_comments_excel_export =
          response.include_comments_excel_export;
        this.include_ratings_excel_export =
          response.include_ratings_excel_export;
        this.split_comments = response.split_comments;
        this.include_internal_key = response.include_internal_key;
        this.transpose_excel_columns = response.transpose_excel_columns;
        this.include_flags_excel_export = response.include_flags_excel_export;
      }
    });
  }

  onDateChange(date) {
    this.customDateFilter = date;
    if (date) {
      this.dateRange = {
        startDate: date.startDate,
        endDate: date.endDate,
      };
      this.onFilterChange();
    }
  }

  getTemplates() {
    this.ExportDataService.getTemplates().subscribe((response: any) => {
      this.templates = response;
    });
  }

  getFirms() {
    const params = {
      include_contacts: false,
      include_custom_fields: false,
      include_dates: true,
      is_active: true,
      filters: {},
    };
    this.loading = true;
    this.http
      .post('service/dvapi_service/firm_search', params)
      .subscribe((response: any) => {
        this.firms = response.data;
        this.loading = false;
      });
  }

  onTypeChange(type: any) {
    this.selected_type = type;
  }

  onClearDateFilter() {
    this.dateRange = null;
    this.onFilterChange();
  }

  changeEntityType(type: any) {
    if (this.selected_entities.length) {
      const combined_ids = this.selected_entities_combined.map((x) => x.id);
      for (let entity of Array.from(this.selected_entities)) {
        entity.type = this.selected_entity_type.name;
        if (
          combined_ids.indexOf(parseInt(entity.id)) === -1 &&
          this.selectedQuestions.length
        ) {
          this.selected_entities_combined.push(entity);
        }
      }
      this.selected_entities = [];
    }
    this.selected_entity_type = type;
  }

  removeSelectedEntity(entry: { id: any }) {
    const index = this.selected_entities_combined.findIndex(
      (entity) => entity.id === entry.id
    );
    this.selected_entities_combined.splice(index, 1);
  }

  clearEntityFilters() {
    this.selected_entities_combined = [];
  }

  formatTemplatesTooltip(entity: { templates: any }) {
    let templatesNames = entity.templates.map((x) => x.template_name);
    templatesNames = templatesNames.join(', ');
    return templatesNames;
  }

  addEntities() {
    if (this.selected_entities.length && this.selectedQuestions.length) {
      const combined_ids = this.selected_entities_combined.map((x) => x.id);
      for (let entity of Array.from(this.selected_entities)) {
        entity.type = this.selected_entity_type.name;
        if (combined_ids.indexOf(parseInt(entity.id)) === -1) {
          this.selected_entities_combined.push(entity);
        }
      }
      this.selected_entities = [];
    }
  }

  composeOptions() {
    this.options = { template_id: this.selected_template.id };
  }

  validateFilters() {
    if (!this.selected_template) {
      this.toaster.error('Please select a Template');
      return false;
    }
    return true;
  }

  openQuestionSelectionModal() {
    this.ModalFactory.invoke('manage-question-selection', {
      initialState: {
        selectedQuestions: this.selectedQuestions.filter((x) => x.is_selected),
        responseTypes: this.responseTypes,
        response: (questions: any) => {
          this.selectedQuestions = questions;
        },
      },
      class: 'gray modal-lg',
    });
  }

  validateProjects() {
    if (this.selectedOnly && this.selection_list.length < 1) {
      this.toaster.error('Please select projects');
      return false;
    }
    return true;
  }

  generateReport() {
    let params: any;
    if (this.selected_type === this.ReportTypes.TEMPLATE) {
      if (this.validateFilters() && this.validateProjects()) {
        params = {
          template_id: this.selected_template.id,
          template_name: this.selected_template.name,
          firm_name: this.firm_name,
          include_responses_excel_export: this.include_responses_excel_export,
          include_comments_excel_export: this.include_comments_excel_export,
          include_ratings_excel_export: this.include_ratings_excel_export,
          split_comments: this.split_comments,
          include_internal_key: this.include_internal_key,
          transpose_excel_columns: this.transpose_excel_columns,
          include_flags_excel_export: this.include_flags_excel_export,
        };
        this.updatePayloadWithDates(params);
        if (this.selectedOnly) {
          params.diligence_ids = this.selection_list
            .map((x) => x.id)
            .toString();
        }
        this.showInfoToaster();
        this.ExportDataService.createReport(params).subscribe(
          (response: any) => {
            this.showSuccessToaster();
          }
        );
      }
    } else {
      if (!this.selectedQuestions.length) {
        this.toaster.error('Please select atleast one question');
        return;
      }
      const selectedQuestionGroup = this.selectedQuestions.filter(
        (x) => x.is_selected
      );
      if (!selectedQuestionGroup.length) {
        this.toaster.error('Please select atleast one question');
        return;
      }
      const selected_question_ids = [];
      for (let quesGroup of Array.from(selectedQuestionGroup)) {
        for (let quesId of Array.from(quesGroup.questions_ids)) {
          selected_question_ids.push(quesId);
        }
      }
      params = {
        firm_name: this.firm_name,
        firm_id: this.currentFirmId,
        recipients: this.current_user.userName,
        question_ids: selected_question_ids,
        manager_ids: this.manager_ids,
      };
      this.updatePayloadWithDates(params);
      this.showInfoToaster();
      this.ExportDataService.createReportForQuestions(params).subscribe(() => {
        this.showSuccessToaster();
      });
    }
  }

  updatePayloadWithDates(params) {
    if (!this.dateRange) {
      params.start_date = null;
      params.end_date = null;
    } else {
      params.start_date = this.dateRange.startDate;
      params.end_date = this.dateRange.endDate;
    }
  }

  showInfoToaster() {
    this.toaster.info('Request being processed.', 'Wait');
  }

  showSuccessToaster() {
    let message =
      "Once the document is ready for download, it will be accessible in the 'My Downloads' section.";
    if (this.downloadMedium == DownloadMedium.BOTH) {
      message =
        "Once the document is ready for download, it will be accessible in the 'My Downloads' section and in your inbox.";
    }
    this.toaster.clear();
    this.toaster.success(message, 'Request processed successfully.');
  }

  onFilterChange() {
    if (this.selectedOnly) {
      this.getAllCompletedDiligences();
      this.clearSelection();
      this.filterByString = '';
    }
  }

  getResponseTypeById(id: any) {
    return this.responseTypes.find((x) => x.id === id);
  }

  getAllCompletedDiligences() {
    if (this.validateFilters()) {
      this.is_loading = true;
      const params: any = {
        template_id: this.selected_template.id,
      };
      this.updatePayloadWithDates(params);

      this.http
        .get('Excel_report_diligences', { params: params })
        .subscribe((response: any) => {
          this.completedDiligences = response;
          this.is_loading = false;
          this.markSelection(this.completedDiligences);
        });
    }
  }

  onSelectionChange(selection: any) {
    if (selection) {
      this.getAllCompletedDiligences();
    } else {
      this.clearSelection();
      this.filterByString = '';
    }
  }

  markSelection(diligences: any) {
    const ids = this.selection_list.map((x) => x.id);
    diligences.forEach(
      (diligence) => (diligence.is_selected = ids.includes(diligence.id))
    );
  }

  selectAll() {
    if (!this.count) return;
    this.filteredListMeta.items.forEach((diligence: any, index: number) => {
      this.addToSelection(diligence, index);
    });

    this.select_all_entities = false;
    this.disable_select_all = true;
  }

  addToSelection(diligence: any, index: number) {
    if (!this.selection_list.find((x) => x.id === diligence.id)) {
      diligence.is_selected = true;
      this.completedDiligences[index].is_selected = true;
      this.selection_list.push(diligence);
    }
  }

  removeFromSelection(diligence: any) {
    this.handleDeselection([diligence]);
    this.selection_list.splice(this.selection_list.indexOf(diligence), 1);
  }

  clearSelection() {
    this.handleDeselection(this.selection_list);
    this.selection_list.length = 0;
    this.disable_select_all = false;
  }

  handleDeselection(diligences: any[]) {
    diligences.forEach((diligence) => {
      const diligence_from_main_list = this.completedDiligences.find(
        (element) => element.id === diligence.id
      );
      if (diligence_from_main_list) {
        diligence_from_main_list.is_selected = false;
      }
    });
    this.select_all_entities = false;
  }

  goBack() {
    return window.history.back();
  }

  resetDates() {
    this.customDateFilter = { ...this.defaultCustomDateFilter };
    this.dateRange = { ...this.defaultDateRange };
    this.dateRangePicker?.setDateRange(this.defaultDateRange, true);
  }
  resetFilter() {
    this.resetDates();
    this.selected_template = null;
    this.searchText = '';
    this.filterByString = '';
    this.selectedOnly = false;
    this.selectedQuestions = [];
    this.manager_ids = [];
    this.completedDiligences.length = 0;
    this.clearSelection();
    this.clearEntityFilters();
  }
  ngAfterContentChecked() {
    this.count = this.containers?.length;
  }
}

