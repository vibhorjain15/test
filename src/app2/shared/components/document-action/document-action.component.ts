import { Component, OnDestroy } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { Subscription } from 'rxjs';
import { EntityDocumentsService } from 'src/app2/services/entity-documents.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { diligenceStatusConstant } from '../../constants/constant';

@Component({
  selector: 'app-document-action',
  templateUrl: './document-action.component.html',
  styleUrls: ['./document-action.component.css'],
})
export class DocumentActionComponent
  implements ICellRendererAngularComp, OnDestroy
{
  params: any;
  disableButtons: boolean = false;
  showNotes: boolean = false;
  is_investor: boolean = false;
  subscription: Subscription;
  freeSubscription = false;

  actions = [];

  constructor(
    private readonly Utils: UtilsService,
    private readonly entityDocumentsService: EntityDocumentsService
  ) {}

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.is_investor = this.params.currentUser.isInvestor;
    this.freeSubscription = this.params.currentUser.isFreeSubscription;
    this.subscribeForEntityLoad();
    if (this.params.data && this.params.data.document?.type == 1) {
      this.actions.push({
        label: 'Edit',
        key: 'edit',
        leftIcon: 'pencil',
      });

      if (this.showNotes) {
        this.actions.push({
          label: 'Add/View Notes',
          key: 'notes',
          leftIcon: 'notepad',
        });
      }

      if (
        this.showDocumentAction(this.params.data.document) &&
        !this.freeSubscription
      ) {
        this.actions.push({
          label: 'Share',
          key: 'share',
          leftIcon: 'share',
        });
      }

      if (this.showDocumentAction(this.params.data.document)) {
        this.actions.push({
          label: 'Delete',
          key: 'delete',
          leftIcon: 'trashcan',
        });
      }
    }
  }
  subscribeForEntityLoad() {
    if (this.params.isDocumentsGrid) return;
    if (!this.entityDocumentsService.entityLoaded$) return;
    this.subscription = this.entityDocumentsService.entityLoaded$.subscribe(
      (entity) => {
        if (entity) {
          this.disableButtons = this.disableActionButtons(entity);
          this.actions = this.actions.map((action) => {
            return {
              ...action,
              disabled: this.disableButtons,
            };
          });
          this.showNotes =
            this.is_investor && entity.entity_type === 'DueDiligence';
        }
      }
    );
  }
  showDocumentAction(document) {
    return this.Utils.isDocumentUploadByCurrentFirm(
      this.params.currentUser,
      document.owner_firm_id
    );
  }
  openDocumentUpdateDialog() {
    this.params.openDocumentUpdateDialog(this.params.data.document);
  }
  openDocumentShareDialog() {
    this.params.openDocumentShareDialog(this.params.data.document);
  }
  confirmDocumentDeletion() {
    this.params.confirmDocumentDeletion(this.params.data.document);
  }
  openNotesSidebar() {
    this.params.openNotesSidebar(this.params.data.document);
  }

  disableActionButtons(entityDetails) {
    if (entityDetails.entity_type !== 'DueDiligence') {
      return false;
    }
    if (
      !this.is_investor &&
      [
        diligenceStatusConstant.COMPLETED,
        diligenceStatusConstant.Evaluation,
        diligenceStatusConstant.Approved,
      ].includes(entityDetails.entity.status)
    ) {
      return true;
    }
    return false;
  }

  handleActionClick(action) {
    switch (action.key) {
      case 'edit':
        this.openDocumentUpdateDialog();
        break;
      case 'notes':
        this.openNotesSidebar();
        break;
      case 'share':
        this.openDocumentShareDialog();
        break;
      case 'delete':
        this.confirmDocumentDeletion();
        break;
    }
  }

  ngOnDestroy(): void {
    if (this.subscription) this.subscription.unsubscribe();
  }
}
