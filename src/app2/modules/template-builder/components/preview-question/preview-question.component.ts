import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { placeholder, responseType } from '../../constants/responseType.constant';
@Component({
  selector: 'preview-question',
  templateUrl: './preview-question.component.html',
  styleUrls: ['./preview-question.component.css'],
})
export class PreviewQuestionComponent implements OnInit {
  @Input() questions = [];
  @Input() editable: boolean = true;
  @Input() parentQuestionType = '';
  @Output() onDelete = new EventEmitter();
  @Output() onEdit = new EventEmitter();
  placeholder = placeholder;
  responseType = responseType;
  type;

  columns = [];
  rows = [];

  ngOnChanges(changes: SimpleChanges): void {
    this.questions.forEach((question) => {
      // showing only tail and head of rows and column if row or column is greater the 100
      // if rows and columns are 1000 then we are showing first 20 and last 20 
      // row 19 , row 20 . , . , .  row 999 , row 1000
      if (question.type === 'BooleanPlus') {
        question.radioValue = 'Yes';
      } else if (question.type === 'NoPlus') {
        question.radioValue = 'No';
      } else if (question.type === 'Grid') {
        if (question.previewOptions.rows.length >= 100) {
          this.rows = question.previewOptions.rows.slice(0, 20);
          this.rows.push({ text: '...' });
          this.rows.push({ text: '...' });
          this.rows.push({ text: '...' });
          this.rows = this.rows.concat(question.previewOptions.rows.slice(-20));
        } else {
          this.rows = question.previewOptions.rows;
        }
        if (question.previewOptions.columns.length >= 100) {
          this.columns = question.previewOptions.columns.slice(0, 20);
          this.columns.push({ text: '...' });
          this.columns.push({ text: '...' });
          this.columns.push({ text: '...' });
          this.columns = this.columns.concat(
            question.previewOptions.columns.slice(-20)
          );
        } else {
          this.columns = question.previewOptions.columns;
        }
      }
    });
  }

  ngOnInit(): void {}

  handleEditClick(index) {
    this.onEdit.emit(index);
  }
  handleDeleteClick(index) {
    this.onDelete.emit(index);
  }

  trackBy(index, _) {
    return index;
  }
}
