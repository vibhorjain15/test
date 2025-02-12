import { HttpClient } from '@angular/common/http';

import { Component, NgZone, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { BaseDataService } from 'src/app2/services/base-data.service';
import { DocumentDataService } from 'src/app2/services/document-data.service';
import { DocumentsFactoryService } from 'src/app2/services/documents-factory.service';
import { MentionsFactoryService } from 'src/app2/services/mentions-factory.service';
import { ModalService } from 'src/app2/services/modal.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { RouterService } from 'src/app2/services/router.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { UtilsService } from 'src/app2/services/utils.service';
import swal from 'sweetalert2/dist/sweetalert2.js';
import { Select, Store } from '@ngxs/store';
import { UserState } from 'src/app2/store/user/user.state';
import { finalize, take, tap } from 'rxjs/operators';
import { GetTeamMembers } from 'src/app2/store/user/user.action';
import * as $ from 'jquery';
import { DocumentEventTypes } from '../../constants/constant';
@Component({
  selector: 'app-document-detail',
  templateUrl: './document-detail.component.html',
  styleUrls: ['./document-detail.component.css'],
})
export class DocumentDetailComponent implements OnInit {
  document;
  canUserModify;
  documentNotes;
  documentNotesCopy;
  counterparty;
  document_assignments: any;
  documentReviews;
  document_versions;
  stateParams: any;
  documentId: any;
  current_user: any;
  pageUrl: any;
  filteredTeamMembers: any;
  loadingNotes: boolean;
  add_notes_form: any;
  saving_notes: boolean;
  tinymceOptions = {
    placeholder:
      'Start typing to leave a note. To mention and notify a team member, type @',
    plugins: 'advcode link lists mentions',
    toolbar:
      'bold italic underline | \
      link bullist numlist |  code',
    toolbar_location: 'top',
  };
  tinymceEditor: any;
  tinymceStatusbar = '';
  originalNoteText = '';
  updating_note = false;
  @Select(UserState.getCurrentUserData) user;
  @Select(UserState.getTeamMembersData) teamMembers$;
  isVisitLogged: boolean = false;
  // documentDataServiceFactory; // RouterBUG
  isExpired: boolean;

  constructor(
    private readonly routerService: RouterService,
    private readonly Utils: UtilsService,
    private readonly BaseDataService: BaseDataService,
    private readonly DocumentDataservice: DocumentDataService,
    private readonly documentDataServiceFactory: DocumentsFactoryService,
    private readonly MentionsFactory: MentionsFactoryService,
    private readonly toaster: ToastrService,
    private readonly SweetAlert: SweetAlertService,
    private readonly http: HttpClient,
    private readonly DocumentsService: DocumentsFactoryService,
    private readonly customModalFactory: CustomModalService,
    private readonly store: Store,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.stateParams = this.routerService.getState().params;
    this.documentId = this.stateParams.documentId;
    this.pageUrl = this.DocumentsService.getDocumentPageUrl();
    this.DocumentDataservice.setDocumentPageUrl(this.pageUrl);
    this.user.pipe(take(1)).subscribe((data) => {
      if (data) {
        this.current_user = data;
        this.BaseDataService.getTeamMembers().subscribe((response: any) => {
          this.getDocument(this.documentId, response);
        });
      }
    });
    this.teamMembers$
      .pipe(
        take(2),
        tap((userData) => {
          if (!userData) {
            this.store.dispatch(new GetTeamMembers());
          }
        })
      )
      .subscribe((teamMembers) => {
        if (teamMembers) {
          this.getDocument(this.documentId, teamMembers);
        }
      });
  }

  openQuestionnaireUploadModal(editor) {
    this.ngZone.run(() => {
      this.customModalFactory.invoke('questionnaire-upload-image', {
        initialState: {
          editor: editor,
        },
        class: 'modal-xl',
      });
    });
  }

  getDocument(id, team_members) {
    this.DocumentDataservice.getDocument(id).subscribe((response: any) => {
      this.document = response;
      this.canUserModify = this.Utils.isDocumentUploadByCurrentFirm(
        this.current_user,
        this.document.owner_firm_id
      );
      this.sortTags();
      this.getNotes(this.documentId);
      this.getDocumentReviews(this.documentId);
      if (this.canUserModify) {
        this.getDocumentVersions(this.stateParams.documentId);
        this.getDocumentAssignments(this.stateParams.documentId);
      }
      const { reviews } = response;
      let reviewed_by_me = false;
      if (reviews) {
        reviewed_by_me = reviews.some(
          (review) => review.userID === this.current_user.id
        );
        this.document.reviewer_names = reviews.map((review) => {
          const user = team_members.find(
            (member) => member.id === review.userID
          );
          return `${user.firstName} ${user.lastName}`;
        });
      } else {
        this.document.reviewer_names = [];
      }
      this.document.is_image = this.isImage(response);
      this.document.reviewed_by_me = reviewed_by_me;
      if (!this.isVisitLogged) {
        this.DocumentDataservice.postDocumentStatisticsEvent({
          attachment_id: this.document.id,
          attachment_version: this.document.version,
          event_type: DocumentEventTypes.document_detail_view,
        }).subscribe(() => {
          this.isVisitLogged = true;
        });
      }
    });
  }

  sortTags() {
    this.document.tag_names.sort((a, b) => {
      const nameA = a.toLowerCase();
      const nameB = b.toLowerCase();
      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      return 0;
    });
  }

  isImage(attachment) {
    const { file_name } = attachment;
    const image_file_extensions = ['png', 'jpg', 'jpeg', 'gif'];
    const file_extension = file_name.split('.').at(-1);
    return image_file_extensions.includes(file_extension.toLowerCase());
  }

  getDocumentVersions(id) {
    this.DocumentDataservice.getDocumentVersions(id).subscribe(
      (response: any) => {
        this.document_versions = response;
      },
      (error: any) => {
        this.document_versions = [];
      }
    );
  }

  getDocumentAssignments(id) {
    this.DocumentDataservice.getDocumentAssignments(id).subscribe(
      (response: any) => {
        this.document_assignments = response;
      },
      (error: any) => {
        this.document_assignments = [];
      }
    );
  }

  getDocumentReviews(id) {
    this.DocumentDataservice.getAttachmentReviews(id).subscribe(
      (response: any) => {
        this.documentReviews = response;
      }
    );
  }

  formatDocumentGroupTooltip(groupList) {
    return groupList.join(', ');
  }

  viewDocument(entity) {
    this.DocumentsService.getSignedURL(entity);
  }

  filterTeamMembers(term) {
    this.filteredTeamMembers = this.MentionsFactory.getFilteredMembers(term);
  }

  getNotes(id) {
    this.loadingNotes = true;
    this.DocumentDataservice.getNotes('Attachment', id)
      .pipe(finalize(() => (this.loadingNotes = false)))
      .subscribe((response: any) => {
        this.documentNotes = response.map((note) => ({
          ...note,
          editing: false,
        }));
        this.documentNotesCopy = JSON.parse(JSON.stringify(this.documentNotes));
      });
  }

  openAddNodeModal() {
    this.customModalFactory.invoke('add-notes', {
      initialState: {
        entityId: this.documentId,
        entityType: 'Attachment',
        title: `Add Notes under ${this.document.name}`,
        showInstructions: false,
        emptyStateMessage: `There are no notes for this document`,
        notesPassed: true,
        notes: this.documentNotes,
        saveButtonText: `Add Note`,
      },
      class: 'modal-lg',
    });
  }

  addTask() {
    this.customModalFactory.invoke('manage-task', {
      initialState: {
        task: {
          entity_type: 'Attachment',
          entity_id: this.documentId,
          pageUrl: this.pageUrl,
        },
      },
    });
  }

  triggerWorkflow() {
    this.customModalFactory.invoke('trigger-workflow', {
      initialState: {
        entity_type: 'Document',
        entity_id: this.documentId,
        name: this.document.name,
        pageUrl: this.pageUrl,
      },
    });
  }

  canEditNote(note) {
    return note.created_by === this.current_user.id;
  }

  removeNote(deletedNote) {
    const noteIndex = this.documentNotes.findIndex(
      (note) => note.id === deletedNote.id
    );
    this.documentNotes.splice(noteIndex, 1);
    this.documentNotesCopy.splice(noteIndex, 1);
  }

  displayAttachmentReviewConfirmation() {
    this.SweetAlert.confirm({
      title: 'Are you sure you want to mark this attachment as reviewed?',
      confirmButtonText: 'Yes',
      showLoaderOnConfirm: true,
      preConfirm: () => {
        this.markAsReviewed(this.document);
      },
    });
  }

  markAsReviewed(attachment) {
    this.DocumentDataservice.reviewAttachment(attachment.id).subscribe(
      (response: any) => {
        this.documentReviews.push(response);
        this.toaster.success('Attachment marked as reviewed successfully');
        swal.close();
      },
      (error: any) => {
        swal.close();
        const avoid_error_logging_statuses =
          this.BaseDataService.getAvoidErrorLoggingStatusList();
        if (!avoid_error_logging_statuses.includes(error.status)) {
          this.Utils.logError('Marking document as reviewed failed', error);
        }
      }
    );
  }

  revokeAccess(id) {
    this.DocumentDataservice.revokeAttachmentAccess(id).subscribe(
      (response: any) => {
        this.toaster.success('Document access has been revoked successfully');
        this.document_assignments.forEach((document, idx) => {
          if (document.id === id) {
            this.document_assignments.splice(idx, 1);
          }
        });
        swal.close();
      },
      (error) => swal.close()
    );
  }

  confirmAccessRevoke(document_accessor) {
    this.SweetAlert.confirm({
      title: `Are you sure you want to revoke access from ${document_accessor.name}?`,
      showLoaderOnConfirm: true,
      focusCancel: true,
      preConfirm: () => {
        this.revokeAccess(document_accessor.id);
      },
    });
  }

  openDocumentUpdateDialog(document, editMode = true) {
    this.customModalFactory.invoke('manage-document', {
      initialState: {
        documentOptions: {
          editAccessGranted: this.canUserModify,
          mode: 'update',
          source: 'documentsEditClick',
          document,
        },
        showSelectionPath: false,
        isEntityIdRequired: false,
        success: (response) => {
          if (this.canUserModify) {
            this.getDocumentVersions(this.stateParams.documentId);
          }
          if (response && response?.length > 0 && response[0]?.length > 0) {
            this.document = response[0][0]; //response is returned from a forkjoin. the first response item is an array where first item is the updated document
          }
          this.sortTags();
        },
      },
    });
  }

  openDocumentShareDialog(attachment) {
    attachment.attachment_id = attachment.id;
    const entityId = this.current_user.firmInfo.id;
    this.customModalFactory.invoke('share-document', {
      initialState: {
        document: attachment,
        entityType: 'Firm',
        entityId: entityId,
        success: () => {
          if (this.canUserModify) {
            this.getDocumentAssignments(this.stateParams.documentId);
          }
        },
      },
    });
  }

  confirmDocumentDeletion(attachment) {
    this.SweetAlert.confirm({
      title: 'Are you sure you want to remove this attachment?',
      focusCancel: true,
      showLoaderOnConfirm: true,
      preConfirm: () => {
        this.removeAttachment(attachment);
      },
    });
  }

  removeAttachment(attachment) {
    this.http.delete('attachments/' + attachment.id).subscribe(
      () => {
        swal.close();
        this.toaster.success('Attachment successfully unassigned');
        this.routerService.navigate('app.home');
      },
      (error) => {
        swal.close();
      }
    );
  }

  goToPreviousPage() {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.routerService.navigate('app.content.documents');
    }
  }

  getVersionedDocument(attachment) {
    this.toaster.info(
      'Requested document is being processed, please wait...',
      '',
      { timeOut: 10000 }
    );
    this.http
      .get(`attachments/${attachment.attachment_id}/signed_url`, {
        params: { version: attachment.version },
      })
      .subscribe(
        (response: any) => {
          this.openNewTab(response);
          this.toaster.clear();
        },
        (error) => this.toaster.clear()
      );
  }

  openNewTab(url) {
    const $link = $(`<a href=\"${url}\" target='_blank' class='hidden'></a>`);
    $('body').append($link);
    $link[0].click();
    return $link.remove();
  }

  editNote(note) {
    note.editing = true;
    this.originalNoteText = note.text;
  }

  updateNote(note) {
    if (note.text) {
      this.updating_note = true;
      if (note.text.length > 0) {
        const mentioned_members_ids = this.MentionsFactory.getMentionedIds(
          note.text,
          true
        );
        if (mentioned_members_ids.length > 0) {
          note.mentions = mentioned_members_ids;
        }
      }
      note.parentResource = null;
      this.http
        .put(`notes/${note.id}`, note)
        .pipe(finalize(() => (this.updating_note = false)))
        .subscribe((response: any) => {
          const noteIndex = this.documentNotes.findIndex(
            (note) => note.id === note.id
          );
          this.documentNotes[noteIndex].text = response.text;
          if (this.documentNotesCopy?.length) {
            this.documentNotesCopy[noteIndex].text = response.text;
          } else {
            this.documentNotesCopy = [...this.documentNotes];
          }
          note.editing = false;
          this.toaster.success('Your notes are updated!');
        });
    }
  }

  cancel(note) {
    note.text = this.originalNoteText;
    note.editing = false;
  }

  deleteNote(note) {
    this.SweetAlert.confirm({
      title: 'Are you sure you want to delete this note ?',
      confirmButtonText: 'Yes, delete it!',
      focusCancel: true,
    }).then((isConfirm) => {
      if (isConfirm.value && isConfirm.value === true) {
        this.http.delete(`notes/${note.id}`).subscribe(() => {
          this.removeNote(note);
          this.toaster.success('Note deleted successfully!');
        });
      }
    });
  }
}
