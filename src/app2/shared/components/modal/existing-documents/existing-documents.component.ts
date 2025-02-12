import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Store } from '@ngxs/store';
import { finalize } from 'rxjs/operators';
import { UtilsService } from 'src/app2/services/utils.service';
import { DocumentDataService } from 'src/app2/services/document-data.service';
@Component({
  selector: 'existing-documents',
  templateUrl: './existing-documents.component.html',
  styleUrls: ['./existing-documents.component.css'],
})

/*
  Used as a direct modal in questionnaire page
  Used as a selector in entity documents page inside ManageDocumentsComponent modal
*/
export class ExistingDocumentsComponent implements OnInit {
  @Input() success: any;
  @Input() showHeader: boolean = true;
  @Output() onSuccess = new EventEmitter<any>();
  firmId: number;
  loading: boolean;
  loadingData: boolean = true;
  attachments: any[];
  searchText: string = '';
  customDateFilter: any;
  dateRangeForDirectives: { startDate: string; endDate: string; range: any };
  currentUser: any;
  firmPreferences: any;
  attachedAssignments = [];
  constructor(
    private readonly documentService: DocumentDataService,
    private readonly store: Store,
    private readonly Utils: UtilsService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.store.selectSnapshot(
      (state) => state.user.currentUser
    );
    this.firmId = this.currentUser.firmInfo.id;
    this.firmPreferences = this.store.selectSnapshot(
      (state) => state.user.firmPreference
    );
    this.initializeData();
  }

  initializeData() {
    if (this.firmPreferences) {
      this.customDateFilter = this.Utils.getPredefinedDateRanges(
        this.firmPreferences.default_daterange_months
      );
      this.dateRangeForDirectives = {
        startDate: this.Utils.formatDatetime(this.customDateFilter.startDate),
        endDate: this.Utils.formatDatetime(this.customDateFilter.endDate),
        range: this.firmPreferences?.default_daterange_months ?? 'null',
      };
    }
    this.getAllDocs();
  }

  getAllDocs() {
    this.loadingData = true;
    this.attachments = [];
    const params = {
      sort_by: 'as_of_date',
      sort_direction: 'Ascending',
      start_date: this.dateRangeForDirectives?.startDate ?? null,
      end_date: this.dateRangeForDirectives?.endDate ?? null,
    };
    this.documentService
      .getAttachments(params)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe((response: any[]) => {
        this.attachments = response;
        this.loadingData = false;
        this.attachments = this.attachments.filter(
          (x) => x.owner_firm_id === this.firmId
        );
      });
  }

  onDateChange(event) {
    if (event && event.startDate && event.endDate) {
      this.dateRangeForDirectives = {
        startDate: event.startDate,
        endDate: event.endDate,
        range: event.range,
      };
      this.getAllDocs();
    }
  }

  onClearDateFilter() {
    setTimeout(() => {
      this.dateRangeForDirectives = null;
      this.getAllDocs();
    });
  }

  removeAttachment(attachment: { assigned: boolean }) {
    attachment.assigned = false;
    this.attachedAssignments = this.attachments.filter((x) => x.assigned);
  }

  assignAttachment(attachment: { assigned: boolean }) {
    attachment.assigned = true;
    this.attachedAssignments = this.attachments.filter((x) => x.assigned);
  }

  submit(modalCallback) {
    this.loading = true;
    if (this.success) {
      // questionnaire page
      this.success(this.attachedAssignments);
      this.loading = false;
      modalCallback();
    } else {
      // entity documents page
      this.loading = false;
      this.onSuccess.emit(this.attachedAssignments.map((x) => x.id));
    }
  }
}
