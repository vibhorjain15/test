import { HttpClient } from '@angular/common/http';
import { Component, OnInit, ViewChild } from '@angular/core';
import { RouterService } from 'src/app2/services/router.service';
import { ToastrService } from 'ngx-toastr';
import { UtilsService } from 'src/app2/services/utils.service';
import { ExportDataService } from 'src/app2/services/export-data.service';
import { FundDataService } from 'src/app2/services/fund-data.service';
import { FormControl, FormGroup } from '@angular/forms';
import { UserState } from 'src/app2/store/user/user.state';
import { Select, Store } from '@ngxs/store';
import { finalize, take, tap } from 'rxjs/operators';
import {
  DvValidators,
  noHtmlValidator,
} from 'src/app2/shared/validators/no-white-space.validator';
import { NgxFileDropEntry } from 'ngx-file-drop';
import { DatePipe } from '@angular/common';
import { ReportUtilsService } from '../util/reportUtil.service';

@Component({
  selector: 'new-report',
  templateUrl: './new-reports.component.html',
  styleUrls: ['./new-reports.component.css'],
})
export class NewReportComponent implements OnInit {
  request: any;
  minDate: any;
  maxAsOfDate: any;
  isBulk: boolean;
  step_number: number;
  review_entity_type: string;
  newFlowSelected: boolean;
  selectedOnly: boolean;
  selected_entities: any;
  completedDiligences: any;
  inner_report_template: any;
  filters_section: any;
  entityTypesArr: any;
  diligence_templates: any;
  active_step: any;
  current_page: number;
  filterBy: string;
  selection_list: any;
  selected_diligences: any;
  filter: any;
  diligences: any;
  combinedData: any;
  alreadyUsedDiligences: any;
  entity_type: string;
  customDateFilter: any;
  formData: { include_custom_review_diligences: boolean };
  selected_report_templates: any;
  diligencesCopy: any;
  loading_prefs: boolean;
  defaultRange: any;
  diligence_report_templates: any;
  mapping_templates: any;
  display_wizard_footer: boolean;
  diligence_funds: any;
  diligence_firms: any;
  diligence_strategies: any;
  diligence_vehicles: any;
  active_step_template: any;
  add_new_report: any;
  show_review_step: boolean;
  show_dilignece_zero_text: boolean;
  originalDiligencesResponse: any;
  select_all_entities: boolean;
  disable_select_all: boolean;
  report_name: any;
  as_of_date: any;
  loading: boolean;
  showSecondPannel: boolean;
  diligence: any;
  funds: any;
  firms: any;
  templates: any;
  options: { template_id: any };
  selected_template: any;
  combinedDiligences;
  predefinedDate;
  newReportsForm: FormGroup;
  activeReviewTemplate = 0;
  dateRange;
  @ViewChild('dvStepper') stepInstance;
  @Select(UserState.getCurrentUserData) user;
  @Select(UserState.getFirmPreferenceData) firmPref;
  widthclass = 'resports';
  loadingDefinitions: boolean = true;
  files: any;
  constructor(
    private readonly http: HttpClient,
    private readonly router: RouterService,
    private readonly toaster: ToastrService,
    private readonly Utils: UtilsService,
    private readonly ExportDataservice: ExportDataService,
    private readonly FundDataservice: FundDataService,
    private readonly datePipe: DatePipe,
    private readonly reportUtilService: ReportUtilsService
  ) {}

  ngOnInit() {
    this.newReportsForm = new FormGroup({
      templateId: new FormControl(''),
      report_name: new FormControl('', [
        DvValidators.required,
        noHtmlValidator,
      ]),
      as_of_date: new FormControl('', []),
      is_merged: new FormControl(false),
    });
    this.request = {};

    this.getFirmPref();

    this.getFunds();
    this.minDate = new Date();
    this.maxAsOfDate = this.Utils.getMaxAsOfDate();
    this.step_number = 0;
    this.review_entity_type = 'All';
    this.newFlowSelected = false;
    this.selected_entities = [];
    this.completedDiligences = [];
    this.inner_report_template = [];
    this.filters_section = {};
    this.selectedOnly = false;
    this.entityTypesArr = ['Fund', 'Firm'];
    this.diligence_templates = [
      {
        name: 'Purpose',
        display_name: 'Purpose',
        id: -3,
      },
      {
        name: 'Select Report Design',
        display_name: 'Select Report Design',
        id: -1,
      },
      {
        name: 'Review&Export',
        display_name: 'Review&Export',
        id: -2,
      },
    ];
    this.active_step = this.diligence_templates[0];
    this.current_page = 0;
    this.filterBy = '';
    this.selection_list = [];
    this.selected_diligences = [];

    this.filter = {
      include_custom_review_diligences: false,
    };

    this.getTemplates();
    this.diligences = [];
    this.combinedData = [];
    this.alreadyUsedDiligences = [];
    this.entity_type = 'All';
    this.formData = {
      include_custom_review_diligences: false,
    };
    this.selected_report_templates = [];
  }

  getFirmPref() {
    this.loading_prefs = true;
    this.firmPref.pipe(take(1)).subscribe((response) => {
      if (response) {
        this.customDateFilter = this.Utils.getPredefinedDateRanges(
          response.default_daterange_months
        );
        if (response.default_daterange_months) {
          this.dateRange = {
            startDate: this.Utils.formatDatetime(
              this.customDateFilter.startDate
            ),
            endDate: this.Utils.formatDatetime(this.customDateFilter.endDate),
            range: response?.default_daterange_months ?? 'null',
          };
        } else {
          this.dateRange = null;
        }
        this.loading_prefs = false;
        this.startNewReport();
      }
    });
  }

  removeSelectedDD(entry: { id: any }) {
    const index = this.combinedDiligences.findIndex(
      (diligencesCopy: { id: any }) => diligencesCopy.id === entry.id
    );
    this.combinedDiligences.splice(index, 1);
  }

  getMappings() {
    this.loadingDefinitions = true;
    this.diligences = [];
    this.diligencesCopy = [];
    this.diligence_report_templates = [];
    this.http.get('reports/new/mappings').subscribe((response: any) => {
      this.mapping_templates = response;
      this.request.selected_template = this.mapping_templates[0];
      this.getDiligences();
      this.loadingDefinitions = false;
    });
  }

  setEntityType(entity_type: any) {
    this.review_entity_type = entity_type;
    this.filter.diligence_entity = null;
    this.filterByEntity(entity_type);
    this.diligence_funds = this.getDiligenceFunds();
    this.diligence_firms = this.getDiligenceFirms();
    this.diligence_strategies = this.getDiligenceStrategies();
    this.diligence_vehicles = this.getDiligenceVehicles();
    this.filters_section.show = false;
    this.filterBy = null;
  }

  filterByEntity(type: string) {
    if (this.active_step_template && this.active_step_template.id) {
      if (type === 'Firm') {
        return (this.diligences = this.diligencesCopy.filter(
          (diligence: { entity_type: string; template_id: any }) =>
            diligence.entity_type === 'Firm' &&
            diligence.template_id === this.active_step_template.id
        ));
      } else if (type === 'Fund') {
        return (this.diligences = this.diligencesCopy.filter(
          (diligence: { entity_type: string; template_id: any }) =>
            diligence.entity_type === 'Fund' &&
            diligence.template_id === this.active_step_template.id
        ));
      } else if (type === 'Strategy') {
        return (this.diligences = this.diligencesCopy.filter(
          (diligence: { entity_type: string; template_id: any }) =>
            diligence.entity_type === 'Strategy' &&
            diligence.template_id === this.active_step_template.id
        ));
      } else if (type === 'Vehicle') {
        return (this.diligences = this.diligencesCopy.filter(
          (diligence: { entity_type: string; template_id: any }) =>
            diligence.entity_type === 'Vehicle' &&
            diligence.template_id === this.active_step_template.id
        ));
      } else if (type === 'Custom' || type === 'Review') {
        return (this.diligences = this.diligencesCopy.filter(
          (diligence: { entity_type: string; template_id: any }) =>
            diligence.entity_type === 'Review' &&
            diligence.template_id === this.active_step_template.id
        ));
      } else if (type === 'All') {
        return (this.diligences = this.diligencesCopy.filter(
          (diligence: { id: any; template_id: any }) =>
            diligence.id &&
            diligence.template_id === this.active_step_template.id
        ));
      }
    }
  }

  getDiligenceFunds() {
    if (this.active_step_template && this.active_step_template.id) {
      const arr = [];
      const dupes = [];
      this.diligences.map((diligence) => {
        if (
          diligence.entity_type === 'Fund' &&
          diligence.template_id === this.active_step_template.id &&
          dupes.indexOf(diligence.entity_id) === -1
        ) {
          arr.push(diligence);
          dupes.push(diligence.entity_id);
        }
      });
      return arr;
    }
  }

  getDiligenceStrategies() {
    if (this.active_step_template && this.active_step_template.id) {
      const arr = [];
      const dupes = [];
      this.diligences.map((diligence) => {
        if (
          diligence.entity_type === 'Strategy' &&
          diligence.template_id === this.active_step_template.id &&
          dupes.indexOf(diligence.entity_id) === -1
        ) {
          arr.push(diligence);
          dupes.push(diligence.entity_id);
        }
      });
      return arr;
    }
  }

  getDiligenceVehicles() {
    if (this.active_step_template && this.active_step_template.id) {
      const arr = [];
      const dupes = [];
      this.diligences.map((diligence) => {
        if (
          diligence.entity_type === 'Vehicle' &&
          diligence.template_id === this.active_step_template.id &&
          dupes.indexOf(diligence.entity_id) === -1
        ) {
          arr.push(diligence);
          dupes.push(diligence.entity_id);
        }
      });
      return arr;
    }
  }

  getDiligenceFirms() {
    if (this.active_step_template && this.active_step_template.id) {
      const arr = [];
      const dupes = [];
      this.diligences.map((diligence) => {
        if (
          diligence.entity_type === 'Firm' &&
          diligence.template_id === this.active_step_template.id &&
          dupes.indexOf(diligence.entity_id) === -1
        ) {
          arr.push(diligence);
          dupes.push(diligence.entity_id);
        }
      });
      return arr;
    }
  }

  getDiligenceTemplates(frequencyArr: any) {
    const arr = [];
    const dupes = [];
    let count = 1;
    for (let idx = 0; idx < this.diligences.length; idx++) {
      const diligence = this.diligences[idx];
      frequencyArr.map((frequencyObj) => {
        if (
          dupes.indexOf(diligence.template_id) === -1 &&
          diligence.template_id === frequencyObj.template_id
        ) {
          const displayName = 'Select Project - Step ' + count;
          count++;
          arr.push({
            id: diligence.template_id,
            name: diligence.template_name,
            frequency: frequencyObj.frequency,
            display_name: displayName,
          });
          dupes.push(diligence.template_id);
        }
      });
    }
    return arr;
  }

  filterDiligences(value: { entity_id: any }, type: string) {
    if (
      (type === 'Fund' ||
        type === 'Firm' ||
        type === 'Vehicle' ||
        type === 'Strategy') &&
      this.active_step_template &&
      this.active_step_template.id
    ) {
      this.diligences = this.diligencesCopy.filter(
        (diligence: { entity_id: any; template_id: any }) =>
          diligence.entity_id === value.entity_id &&
          diligence.template_id === this.active_step_template.id
      );
    }
  }

  toggleFiltersSection() {
    this.filters_section.show = !this.filters_section.show;
  }

  getDiligences() {
    if (!this.request?.selected_template) return;
    this.selected_report_templates = JSON.parse(
      this.request.selected_template?.template_details
    ).template_details;
    const params: any = {};
    params.template_ids = this.selected_report_templates.map(
      (val) => val.template_id
    );
    params.start_date = this.dateRange ? this.dateRange.startDate : null;
    params.end_date = this.dateRange ? this.dateRange.endDate : null;
    params.include_custom_review_diligences = true;
    this.show_review_step = !!this.isBulk; // if bulk report option is enabled, always show the review step, else assign the default value false
    this.request.selected_diligence = {};
    this.diligence_report_templates = [];
    this.diligences = [];
    this.diligencesCopy = [];
    this.display_wizard_footer = false;
    this.show_dilignece_zero_text = false;
    this.http
      .post('diligences/GetByTemplate', params)
      .subscribe((response: any) => {
        this.diligences = response;
        if (this.diligences.length) {
          this.display_wizard_footer = true;
        } else {
          this.show_dilignece_zero_text = true;
        }

        this.diligencesCopy = JSON.parse(JSON.stringify(response));
        this.originalDiligencesResponse = JSON.parse(JSON.stringify(response));
        this.diligence_report_templates = this.getDiligenceTemplates(
          this.selected_report_templates
        );
        if (
          this.diligence_report_templates &&
          this.diligence_report_templates.length
        ) {
          this.diligence_report_templates.map(
            (row: { selection_list: {} }) => (row.selection_list = [])
          );
        }
      });
  }

  clearEntityFilter() {
    this.filter.diligence_entity = null;
    this.filterBy = null;
    this.setEntityType(this.review_entity_type);
  }

  projectsSelectionBeforeEnter(template: any, index: any) {
    this.active_step_template = template;
    this.filterByEntity(this.review_entity_type);
    this.diligence_funds = this.getDiligenceFunds();
    this.diligence_firms = this.getDiligenceFirms();
    this.diligence_strategies = this.getDiligenceStrategies();
    this.diligence_vehicles = this.getDiligenceVehicles();
    this.filter.diligence_entity = null;
    this.show_review_step = true;
  }

  addToSelection(entry, diligence = null, index = null) {
    // if (
    //   this.diligence_report_templates[index].selection_list.length >=
    //   this.diligence_report_templates[index].frequency
    // ) {
    //   this.toaster.error('', 'Maximum limit reached');
    //   return;
    // }

    const ids = this.diligence_report_templates[index].selection_list.map(
      (val) => val.id
    );
    if (!ids.includes(diligence.id)) {
      diligence.is_selected = true;
      this.diligence_report_templates[index].selection_list.push(diligence);
    }
  }

  removeFromSelection(entry, diligence: { entity_type: any }) {
    this.handleDeselection([diligence]);
    entry.selection_list.splice(entry.selection_list.indexOf(diligence), 1);
  }

  combineSelectedDiligences() {
    this.combinedDiligences = [];
    if (this.isBulk) {
      return;
    }
    this.diligence_report_templates.map((entry: { selection_list: any }) =>
      entry.selection_list.map((diligence: any) =>
        this.combinedDiligences.push(diligence)
      )
    );
  }

  clearSelectionList(entry: any) {
    this.handleDeselection(entry.selection_list);
    entry.selection_list.length = 0;
    this.disable_select_all = false;
  }

  handleDeselection(diligences) {
    diligences.forEach((diligence: { id: any }) => {
      const diligence_from_main_list = this.diligencesCopy.find(
        (val) => val.id === diligence.id
      );

      if (diligence_from_main_list) {
        diligence_from_main_list.is_selected = false;
      }
    });

    this.select_all_entities = false;
  }

  startNewReport() {
    this.getMappings();
    this.request.DDTypeDisplayName = 'Review Diligence';
    this.stepInstance?.next();
  }

  exportReport() {
    const { report_name, as_of_date } = this.newReportsForm.value;
    if (!report_name) {
      this.toaster.error('Please enter a report name');
      return;
    }
    if (this.isBulk) {
      this.generateBulkReports();
      return;
    }
    if (this.combinedDiligences.length) {
      this.loading = true;

      const params: any = {};
      params.document_id = this.request.selected_template.id;
      params.name = report_name;
      params.as_of_date = as_of_date ? new Date(as_of_date) : null;
      params.diligence_ids = this.combinedDiligences.map((val) => val.id);
      return this.http.post('reports/new/generate', params).subscribe(
        (response: any) => {
          this.toaster.success('', 'Report exported successfully');
          this.loading = false;
          this.showSecondPannel = false;
          this.filter = {};
          this.diligence = [];
          this.router.navigate('app.reports.realtime-reports.list');
        },
        (error: any) => {
          this.loading = false;
        }
      );
    } else {
      this.toaster.error('', 'Please select at least one project!');
    }
  }
  getFunds() {
    this.FundDataservice.getFunds().subscribe((response: any) => {
      this.funds = response;
    });
  }

  getTemplates() {
    this.ExportDataservice.getTemplates().subscribe((response: any) => {
      this.templates = response;
    });
  }

  canProceedToReviewOpinionDiligenceNext() {
    const selectedDiligences = [];
    this.diligence_report_templates.map((entry) => {
      entry.selection_list.map((diligence) => {
        selectedDiligences.push(diligence);
      });
    });

    return selectedDiligences.length;
  }

  handleDateChange(event) {
    if (event && event.startDate && event.endDate) {
      this.dateRange = {
        startDate: event.startDate,
        endDate: event.endDate,
      };
      this.diligences = [];
      this.diligencesCopy = [];
      this.getDiligences();
    }
  }

  trackById(index: number, val: any): number {
    return val.id;
  }

  handleNextReviewDili(index) {
    if (!this.canProceedToReviewOpinionDiligenceNext())
      return this.toaster.error('', 'Please select at least one project!');

    this.stepInstance.next();
    this.activeReviewTemplate = index;
  }

  handlePreviousReviewDili(index) {
    this.stepInstance.previous();
    if (index < 0) {
      index = 0;
    }
    this.activeReviewTemplate = index;
    this.newReportsForm.get('report_name').markAsUntouched({ onlySelf: true });
  }
  canProceedToDiligenceSelection() {
    this.stepInstance.next();
  }

  handleInputChange(val) {
    val = val.toLowerCase();
    if (!val) {
      this.filterByEntity(this.review_entity_type);
      return;
    }
    this.diligences = this.filterByEntity(this.review_entity_type).filter(
      (diligence: any) =>
        diligence?.name.toLowerCase().includes(val) ||
        diligence?.entity_name?.toLowerCase().includes(val)
    );
  }

  handleAsOfDateChange(date) {
    this.newReportsForm.patchValue({
      as_of_date: date,
    });
  }
  onClearDateFilter() {
    this.dateRange = null;
    this.diligences = [];
    this.diligencesCopy = [];
    this.getDiligences();
  }

  dropped(files: NgxFileDropEntry[]) {
    this.files = files;
  }

  onBulkOptionChange(value) {
    // if user selects bulk report option, always show the review step
    // if they deselect, back to the default behavior: if there are diligences, show it else don't
    if (value) {
      this.show_review_step = true;
    } else {
      this.show_review_step = !this.show_dilignece_zero_text;
    }
  }

  downloadSampleFile() {
    this.toaster.info('Please wait...', 'Downloading File', {
      timeOut: 0,
    });
    this.reportUtilService.downloadReport(
      `service/excel_services/presentation_report_download?document_id=${this.request.selected_template.id}&document_name=${this.request.selected_template.report_definition_name}`
    );
  }

  generateBulkReports() {
    this.loading = true;
    if (!this.files?.length) {
      this.toaster.error('Please upload the file');
      this.loading = false;
      return;
    }
    const formValue = this.newReportsForm.value;
    const payload = new FormData();
    payload.append('document_id', this.request.selected_template.id);
    payload.append('name', formValue.report_name);
    payload.append('is_merged', formValue.is_merged);
    payload.append(
      'as_of_date',
      this.datePipe.transform(formValue.as_of_date, 'MM-dd-yyyy')
    );
    payload.append('file', this.files[0]);
    this.ExportDataservice.generateBulkPresentationReports(payload)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(() => {
        this.toaster.success(
          'Your request is being processed. You will receive an email with the report(s).'
        );
        this.router.navigate('app.reports.realtime-reports.list');
      });
  }
}
