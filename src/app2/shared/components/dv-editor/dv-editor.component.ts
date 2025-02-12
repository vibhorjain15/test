import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { Select } from '@ngxs/store';
import { Link, List, Mention } from 'ckeditor5';
import { TinymceEditorComponent } from '../tinymce-editor/tinymce-editor.component';
import { EditorComponent } from '../editor/editor.component';
import { take } from 'rxjs/operators';
import { UserState } from 'src/app2/store/user/user.state';
import { AddCommentData } from '../../models/ckeditor.model';

@Component({
  selector: 'dv-editor',
  templateUrl: './dv-editor.component.html',
  styleUrls: ['./dv-editor.component.css'],
})
export class DvEditorComponent implements OnInit, AfterViewInit {
  @Input() isTinyMceEditor: boolean; // can be true based on BE check
  @Input() configObj: any; // A common config file will be passed to every instance
  @Input() isLite = false;
  @Input() wordLimit: number = null;
  @Input() focusOnInit: boolean = false;
  @Input() enableAI: boolean = false;
  @Input() id: number = null; // Need to provide different ids if there are multiple instances of editor that needs to be shown in a page
  @Input() uniqueQuestionId: string; // Used to manage editor instance for questionnaire only
  @Input() freeUser: boolean;
  @Input() isComments: boolean = false;
  @Input() isTrackChange: boolean = false;
  @Input() value: string;
  @Input() imageSelector: boolean = true;
  @Input() isMentions: boolean = false;
  @Input() mentionsList: Array<any> = [];
  @Input() literVersion: boolean = false;
  @Input() disabled: boolean = false;
  @Input() isDoubleToolbar: boolean = false; // for tracking tinymce double toolbar
  @Input() isReadonly: boolean = false;
  @Input() isTrackChangeEnabled: boolean = false; // Deals with default behavior of track change button on editor init
  @Output() onChange: EventEmitter<any> = new EventEmitter();
  @Output() onAiButtonClick: EventEmitter<any> = new EventEmitter();
  @Output() onTrackChange: EventEmitter<any> = new EventEmitter();
  @Output() onReviewCommentFocused: EventEmitter<any> = new EventEmitter();
  @Output() onAddReviewComment: EventEmitter<AddCommentData> =
    new EventEmitter<AddCommentData>();
  @ViewChild('tinymce') tinymceInstance: TinymceEditorComponent;
  @ViewChild('ckeditor') ckeditorInstance: EditorComponent;
  activeEditorInstance: TinymceEditorComponent | EditorComponent | any;
  tinymceToCkmapperToolbar = {
    bullist: 'bulletedList',
    numlist: 'numberedList',
    bold: 'bold',
    italic: 'italic',
    dv_img_selector: 'dvUploadImage',
    underline: 'underline',
    '|': '|',
  };
  @Select(UserState.getFirmPreferenceData) firmPref;

  tinymceToCkmapperPlugin = {
    link: () => Link,
    lists: () => List,
    mentions: () => Mention,
  };

  ngOnInit(): void {
    this.mapTinyMceObjectToCkeditor();
    this.firmPref.pipe(take(1)).subscribe((response) => {
      if (this.isTinyMceEditor === undefined) {
        this.isTinyMceEditor = response.editor_version === 1;
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.isTinyMceEditor) this.activeEditorInstance = this.tinymceInstance;
    else {
      this.activeEditorInstance = this.ckeditorInstance;
    }
  }

  handleChange(value) {
    this.onChange.emit(value);
  }

  handleTrackChange(value) {
    this.onTrackChange.emit(value);
  }

  handleAiButton(value) {
    this.onAiButtonClick.emit(value);
  }

  handleAddReviewComment(value: AddCommentData): void {
    this.onAddReviewComment.emit(value);
  }

  mapTinyMceObjectToCkeditor() {
    if (this.isTinyMceEditor) return;
    if (this.configObj?.toolbar && typeof this.configObj?.toolbar == 'string') {
      this.configObj.CkToolbar = this.configObj.toolbar
        .split(' ')
        .filter((x) => x);
      this.configObj.CkToolbar = this.configObj?.CkToolbar.map((tool) => {
        return this.tinymceToCkmapperToolbar[tool]
          ? this.tinymceToCkmapperToolbar[tool]
          : tool;
      }).filter((x) => x);
    }
  }

  insertContent(data) {
    if (this.isTinyMceEditor)
      this.activeEditorInstance.editor.insertContent(data);
    else this.activeEditorInstance.insertContentAtSelection(data);
  }

  setContent(data) {
    if (this.isTinyMceEditor) {
      this.activeEditorInstance.editor.undoManager.add();
      this.activeEditorInstance.editor.setContent(data);
      this.activeEditorInstance.editor.undoManager.add();
    } else
      this.activeEditorInstance.editor.data.set(data, {
        batchType: { isUndoable: true },
      });
  }

  getResponseWithoutCommentsTag() {
    return this.activeEditorInstance.editor.getData({
      ignoreResolvedComments: true,
    });
  }

  handleReviewCommentFocused(): void {
    this.onReviewCommentFocused.emit();
  }
}
