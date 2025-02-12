import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { BaseDataService } from 'src/app2/services/base-data.service';
import { DocumentDataService } from 'src/app2/services/document-data.service';
import { ToastrService } from 'ngx-toastr';
import { forkJoin } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Select } from '@ngxs/store';
import { UserState } from 'src/app2/store/user/user.state';
import { finalize, take } from 'rxjs/operators';
import { DvSelectComponent } from '../../components';
import { TruncatePipe } from '../../pipes/trucate.pipe';
@Component({
  selector: 'app-share-document',
  templateUrl: './share-document.component.html',
  styleUrls: ['./share-document.component.css'],
})
export class ShareDocumentModal implements OnInit {
  @ViewChild('firms') firmsDropdown: DvSelectComponent;
  @Input() document: any;
  @Input() entityType: string;
  @Input() entityId: number;
  @Input() success: any;
  loading: boolean;
  isManager: boolean;
  selectedFirms: any[] = [];
  shareBasis: string;
  selectedEntities: any[] = [];
  selectedStatuses: any[] = [];
  statuses: any;
  allFirmsList: any;
  loadingFirms = true;
  selectedFirm: any = null;
  title = 'Share this Document';
  @Select(UserState.getCurrentUserData) user;
  firmsLoading = false;
  statusesLoading = false;

  constructor(
    private readonly BaseDataService: BaseDataService,
    private readonly toaster: ToastrService,
    private readonly DocumentDataService: DocumentDataService,
    private readonly http: HttpClient,
    private readonly truncate: TruncatePipe
  ) {}

  ngOnInit(): void {
    this.title = `Share ${
      this.document?.name
        ? '"' + this.truncate.transform(this.document.name) + '"'
        : 'this Document'
    }`;
    this.shareBasis = 'status';
    this.user.pipe(take(1)).subscribe((data) => {
      if (data) {
        this.isManager = data.isManager;
      }
    });
    this.statusesLoading = true;
    this.BaseDataService.getStatuses()
      .pipe(finalize(() => (this.statusesLoading = false)))
      .subscribe((statuses: any) => {
        this.statuses = statuses;
      });
    this.getAllFirms();
  }

  getAllFirms() {
    let payload: any = {
      include_contacts: false,
      include_custom_fields: false,
      include_dates: false,
      filters: {},
      is_active: true,
    };
    this.firmsLoading = true;
    this.http
      .post(`service/dvapi_service/firm_search`, payload)
      .pipe(finalize(() => (this.firmsLoading = false)))
      .subscribe(
        (response: any) => {
          this.allFirmsList = response.data;
          this.loadingFirms = false;
        },
        () => {
          this.loadingFirms = false;
        }
      );
  }

  addEntity() {
    if (
      this.selectedFirms.findIndex((x) => x.id === this.selectedFirm.id) === -1
    ) {
      this.selectedFirms.push(this.selectedFirm);
    } else {
      this.toaster.warning("You can't add same firm twice.");
    }
  }

  clearSelection() {
    this.selectedFirms = [];
    this.firmsDropdown.value = null;
  }

  removeFirm(idx: number) {
    this.selectedFirms.splice(idx, 1);
  }

  setActiveView(view: string) {
    this.shareBasis = view;
    this.selectedStatuses = [];
  }

  submit(modalCallback) {
    if (!(this.selectedStatuses.length || this.selectedFirms.length)) {
      return;
    }
    this.loading = true;
    if (this.shareBasis === 'status') {
      const observables = [];

      this.selectedStatuses.forEach((statusId: any) => {
        observables.push(
          this.DocumentDataService.getFirmRelationships(statusId)
        );
      });

      forkJoin(observables)
        .pipe(finalize(() => (this.loading = false)))
        .subscribe((responses: any[]) => {
          responses.forEach((response: any[]) => {
            this.selectedEntities.push(
              ...response.map((firm) => firm.entity_id)
            );
          });
          this.shareDocument(modalCallback);
        });
    } else {
      this.selectedEntities = this.selectedFirms.map((firm) => firm.id);
      this.shareDocument(modalCallback);
    }
  }

  shareDocument(modalCallback) {
    this.DocumentDataService.postAttachmentAssignment(
      this.document.attachment_id,
      this.entityType,
      this.entityId,
      this.selectedEntities
    )
      .pipe(finalize(() => (this.loading = false)))
      .subscribe((response: any) => {
        this.toaster.success('Document successfully shared');
        modalCallback();
        if (this.success) {
          this.success(response);
        }
      });
  }

  handleSelectChange($event) {
    this.selectedFirm = $event;
    this.addEntity();
  }
}
