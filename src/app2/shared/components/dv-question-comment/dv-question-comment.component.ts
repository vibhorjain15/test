import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { QuestionnaireStatusService } from 'src/app2/modules/questionnaire/service/status.service';
import { ColorTheme } from 'src/app2/shared/themes/color.themes';
import { removeAllTrailingBreaksAndSpace } from 'src/app2/utils/tinymce.util';

@Component({
  selector: 'dv-question-comment',
  templateUrl: './dv-question-comment.component.html',
  styleUrls: ['./dv-question-comment.component.css'],
})
export class DvQuestionCommentComponent implements OnInit {
  @Input() name = '';
  @Input() time = '';
  @Input() count = 2;
  @Input() placeholder;
  @Output() onTextChange = new EventEmitter();
  @Output() onIconClick = new EventEmitter();
  @Input() text = '';
  @Input() isReadonly = false;
  @Input() question;
  color = ColorTheme.lightGrayBackground;

  tinyMceInit: any = {
    placeholder:
      'Supplement your response with a comment that is viewable by your investors. i.e. If you mark a question as N/A, you can explain why it is N/A in a comment.',
    menubar: false,
    statusbar: false,
    toolbar: false,
    height: 115,
  };

  constructor(private readonly status: QuestionnaireStatusService) {}
  ngOnInit(): void {
    this.color = ColorTheme.lightGrayBackground;
    this.tinyMceInit.placeholder = this.placeholder;
  }
  handleRevisionClick() {}
  handleIconClick(type: 'close' | 'delete') {
    this.onIconClick.emit(type);
  }

  handleTextChange(text) {
    // if (text) {
    //   // Added to remove trailing space and breaks
    //   text = removeAllTrailingBreaksAndSpace(text);
    // }
    this.onTextChange.emit(text ? text : null);
  }

  updateEditorInstance() {
    this.status.handleUpdateActiveQuestion(this.question);
  }
}
