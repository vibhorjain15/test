import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

type QuestionMapperType = {
  id: string | number;
  label: string;
  list: Array<{
    id: string | number;
    text: string;
  }>;
  isOpen: boolean;
};
@Component({
  selector: 'question-mapping-accordion',
  templateUrl: './question-mapping-accordion.component.html',
  styleUrls: ['./question-mapping-accordion.component.css'],
})
export class QuestionMappingAccordionComponent implements OnInit {
  @Input() questionMapperList: QuestionMapperType[] = [];
  @Output() onMappingDelete = new EventEmitter();
  @Output() onQuestionDelete = new EventEmitter();

  constructor() {}

  ngOnInit(): void {}

  handleMappingDelete(event, mappingData) {
    event.stopPropagation();
    this.onMappingDelete.emit(mappingData);
  }

  handleQuestionDelete(mappingData, questionData) {
    this.onQuestionDelete.emit({ mappingData, questionData });
  }
  
  isOpenChange(event, action) {
    action.isOpen = event;
  }
}
