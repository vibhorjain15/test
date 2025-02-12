import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { fileIcon } from 'src/app2/shared/constants/constant';
import { UpdateAttachmentMap } from '../../../store/questionnaire.action';
import { QuestionAttributeType } from '../../../types/questions.type';
import { UserState } from 'src/app2/store/user/user.state';
import { take, tap } from 'rxjs/operators';
import { GetCurrentUser } from 'src/app2/store/user/user.action';

@Component({
  selector: 'attachment-response',
  templateUrl: './attachment-response.component.html',
  styleUrls: ['./attachment-response.component.css'],
})
export class AttachmentResponseComponent implements OnInit {
  @Input() question: QuestionAttributeType;
  @Input() isReadOnly: boolean = false;
  @Output() onAttachmentChange = new EventEmitter();
  @Input() isPreview: boolean = false;
  attachments = [];
  attachmentMap = {};
  @Select(UserState.getCurrentUserData) user;
  currentUser;
  constructor(
    private readonly newModal: CustomModalService,
    private store: Store
  ) {}
  ngOnInit(): void {
    this.user.pipe(take(1))
      .subscribe((data) => {
        if (data) {
          this.currentUser = data;
        }
      });
    this.attachmentMap = JSON.parse(
      JSON.stringify(
        this.store.selectSnapshot((state) => state.questionnaire.attachmentMap)
      )
    );
    if (!this.attachmentMap) this.attachmentMap = {};
    this.attachments = [];
    this.question.answer.attributes.localAttachmentIds?.map((id) => {
      this.attachmentMap[id]['fileIcon'] =
        fileIcon[this.attachmentMap[id].file_name.split('.').reverse()[0]];
      this.attachments.push(this.attachmentMap[id]);
    });
  }

  handleUseExistingClick() {
    this.newModal.invoke('use-existing-document', {
      initialState: {
        questionnaire: true,
        success: (attachedAssignments) => {
          this.updateAttachments(attachedAssignments);
        },
      },
    });
  }

  updateAttachments(data) {
    data.map((val) => {
      this.attachmentMap[val.id] = val;
      this.attachmentMap[val.id]['fileIcon'] =
        fileIcon[this.attachmentMap[val.id].file_name.split('.').reverse()[0]];
      const index = this.attachments.findIndex((value) => value.id == val.id);
      if (index === -1) {
        this.attachments.push(this.attachmentMap[val.id]);
      } else {
        this.attachments[index] = this.attachmentMap[val.id];
      }
    });
    this.store.dispatch(new UpdateAttachmentMap(this.attachmentMap));
    this.onAttachmentChange.emit(this.attachments);
  }

  handleAddDocument() {
    this.newModal.invoke('upload-document-folder', {
      initialState: {
        uploadType: 'file',
        flow: 'add',
        canSave: this.question.icons.leftIcons?.key,
        isQuestionnaireUpload: true,
        existingAttachments: [...this.attachments],
        showUploadTypeToggler: !this.currentUser?.isFreeSubscription,
        success: (documents) => {
          this.updateAttachments(documents);
        },
      },
      class: 'modal-lg',
    });
  }

  handleRemoveAttachment(attachment) {
    this.attachments = this.attachments.filter(
      (val) => val.id !== attachment.id
    );
    this.onAttachmentChange.emit(this.attachments);
  }

  editAttachmentInfo(attachment) {
    // Template preview we are not passing leftIcons
    if (!this.question.icons.leftIcons?.key) return;

    const attachments = new Array<any>();
    attachments.push(attachment);
    this.newModal.invoke('new-documents', {
      initialState: {
        existingAttachments: attachments,
        editMode: true,
        success: (attachments) => {
          this.updateAttachments(attachments);
        },
      },
    });
  }
}
