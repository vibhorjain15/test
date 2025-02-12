import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'qa-preview',
  templateUrl: './qa-preview.component.html',
  styleUrls: ['./qa-preview.component.css'],
})
export class QaPreviewComponent implements OnInit {
  @Input() heading: string = '';
  @Input() headingIcon?: any;
  @Input() content: {
    text: string;
    meta: string;
    icons: { name: string }[];
    metaData: {
      approvedBy: string;
      approvedAt: Date;
      createdBy: string;
      createdAt: Date;
      iconColor: string;
      addedByMetaData: string;
    };
  }[] = [];
  @Input() iconColor: 'primary' | 'default' | 'green' | 'red' = 'green';
  @Input() metaClass: Array<string> = ['meta-info'];
  @Input() isContentIconEnabled: boolean = true;

  @Output() onIconClick = new EventEmitter();
  @Output() onHeadingIconClick = new EventEmitter();
  constructor() {}

  ngOnInit(): void {}

  handleIconClick(icon, contentItem) {
    this.onIconClick.emit({ icon, contentItem });
  }

  handleHeadingIconClick(icon) {
    this.onHeadingIconClick.emit({ icon });
  }
}
