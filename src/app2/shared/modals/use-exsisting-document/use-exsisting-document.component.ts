import { Component, Input, OnInit } from '@angular/core';
import { ColorTheme } from '../../themes/color.themes';
import { DocumentsService } from 'src/app2/services/documents.service';
import { GridFolderManagementService } from 'src/app2/services/grid-folder-management.service';
import { forkJoin } from 'rxjs';
import { DocumentDataService } from 'src/app2/services/document-data.service';
import { finalize, take } from 'rxjs/operators';
import { UtilsService } from 'src/app2/services/utils.service';
import { BaseDataService } from 'src/app2/services/base-data.service';
import { Select } from '@ngxs/store';
import { UserState } from 'src/app2/store/user/user.state';

@Component({
  selector: 'use-exsisting-document',
  templateUrl: './use-exsisting-document.component.html',
  styleUrls: ['./use-exsisting-document.component.css'],
})
export class UseExsistingDocumentComponent implements OnInit {
  @Input() entityId;
  @Input() entityType;
  @Input() success;
  @Input() questionnaire: boolean;
  @Select(UserState.getFirmPreferenceData) firmPref;
  firmPrefData;
  documents;
  apiLoader: boolean = false;
  colorTheme = ColorTheme;
  savingDocument;
  selectedFiles = [];
  selectedDocumentsIds = [];
  dates = {
    startDate: null,
    endDate: null,
    range: null,
  };
  maxAsOfDate = new Date();
  constructor(
    private readonly documentService: DocumentsService,
    private readonly documentDataService: DocumentDataService,
    private readonly folderManagementService: GridFolderManagementService,
    private readonly Utils: UtilsService,
    private readonly baseDataService: BaseDataService
  ) {}
  ngOnInit(): void {
    this.firmPrefData = this.firmPref.pipe(take(2)).subscribe((pref) => {
      if (pref.default_daterange_months) {
        this.dates = this.Utils.getPredefinedDateRanges(
          pref.default_daterange_months
        );
        this.dates.range = pref.default_daterange_months;
      }
    });
    this.fetchFileAndFolders();
  }

  fetchFileAndFolders() {
    this.apiLoader = true;
    let queryParams = {
      type: 1,
      sort_by: 'as_of_date',
      sort_direction: 'Ascending',
      start_date: this.dates.startDate,
      end_date: this.dates.endDate,
    };
    let requests = [];
    requests.push(this.documentService.getAllAttachments(queryParams));
    requests.push(
      this.folderManagementService.getAttachmentHierarchy(
        0,
        1,
        null,
        null,
        this.dates.startDate,
        this.dates.endDate
      )
    );

    forkJoin(requests).subscribe((result: any) => {
      let attachments,
        attachmentHierarchy = [];
      [attachments, attachmentHierarchy] = result;
      let baseAttachmentHierarchyId;
      [attachments, baseAttachmentHierarchyId] =
        this.folderManagementService.prepareAttachmentHierarchyV2(
          attachmentHierarchy,
          attachments,
          'content'
        );
      attachments = attachments.map((doc) => ({
        ...doc,
        document: doc,
        updated_at_datetime: doc.updated_at
          ? new Date(doc.updated_at)
          : new Date(doc.created_at),
      }));
      attachments.sort((doc1, doc2) =>
        doc1.updated_at_datetime >= doc2.updated_at_datetime ? -1 : 1
      );
      this.apiLoader = false;
      this.documents = attachments;
    });
  }

  onDateRangeRatingSchemeChange(date) {
    this.dates.startDate = this.Utils.formatDatetime(date?.startDate);
    this.dates.endDate = this.Utils.formatDatetime(date?.endDate);

    this.fetchFileAndFolders();
  }

  submit(close) {
    this.documentUploadCompleteBulk(close);
  }

  selectedDocument(data) {
    this.selectedFiles =
      data
        ?.map((document) => {
          if (document.data.document.type) return document.data.document;
          else null;
        })
        ?.filter((doc) => doc) ?? [];
    this.selectedDocumentsIds =
      data
        ?.map((document) => {
          if (document.data.document.type) return document.data.id;
          else null;
        })
        ?.filter((doc) => doc) ?? [];
  }

  documentUploadCompleteBulk(close) {
    if (this.questionnaire) {
      this.success(this.selectedFiles);
      close();
      return;
    }

    const params = {
      unassigned: Object.keys({}),
      newassigned: this.selectedDocumentsIds,
      entity_type: this.entityType,
      Entity_ids: [this.entityId],
    };
    this.savingDocument = true;
    this.documentDataService
      .assignBulkDocuments(params)
      .pipe(
        finalize(() => {
          this.savingDocument = false;
        })
      )
      .subscribe(
        () => {
          this.savingDocument = false;
          this.success(this.selectedFiles);
          close();
        },
        (error: { status: any }) => {
          const avoid_error_logging_statuses =
            this.baseDataService.getAvoidErrorLoggingStatusList();
          this.savingDocument = false;
          if (
            !Array.from(avoid_error_logging_statuses).includes(error.status)
          ) {
            this.Utils.logError('Documents bulk assignment failed', error);
          }
        }
      );
  }
}
