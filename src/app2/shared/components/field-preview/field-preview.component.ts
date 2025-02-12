import {
  Component,
  Input,
  OnInit,
  Output,
  EventEmitter,
  DoCheck,
} from '@angular/core';
import { placeholder, typeMapper } from './field-preview.constant';
import { fieldPreviewtype } from './field-preview.type';

@Component({
  selector: 'field-preview-new',
  templateUrl: './field-preview.component.html',
})
export class FieldPreviewComponent implements OnInit, DoCheck {
  @Input() question: fieldPreviewtype;
  @Input() editable: boolean;
  @Output() onChange: EventEmitter<any> = new EventEmitter();
  @Input() type;
  @Input() subType;
  placeholder = placeholder;

  constructor() {}

  ngOnInit(): void {}

  ngDoCheck() {
    this.type = typeMapper[this.question.responseType];
  }
}
