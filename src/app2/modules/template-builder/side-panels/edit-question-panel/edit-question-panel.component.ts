import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngxs/store';
import { QuestionType } from 'src/app2/apis/template/types/question.type';
import { SidePanelService } from 'src/app2/services/side-panel.service';
import { UpdateActivePanelId } from '../../store/template-builder.action';

@Component({
  selector: 'edit-question-panel',
  templateUrl: './edit-question-panel.component.html',
  styleUrls: ['./edit-question-panel.component.css'],
})
export class EditQuestionModalComponent implements OnInit {
  @Input() question: QuestionType & { isSelected: false } & any;

  constructor(private panel: SidePanelService, private store: Store) {}

  ngOnInit(): void {}

  handleOnCancelClick() {
    this.updateActiveSection();
  }
  handleOnCancel(isTouched) {
    this.updateActiveSection();
  }
  handleOnSave() {
    this.updateActiveSection();
  }

  updateActiveSection() {
    this.panel.close();
    this.store.dispatch(new UpdateActivePanelId(''));
  }
}
