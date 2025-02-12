import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Regex } from '../../constants/constant';

@Component({
  selector: 'dv-bulk-list-builder-new',
  templateUrl: './dv-bulk-list-builder.component.html',
})
export class DvBulkListBuilderNewComponent implements OnInit {
  @Input() idKey: string;
  @Input() textKey: string;
  @Input() currentLength: number;
  @Input() type: string;
  @Input() valueRequired: boolean;
  @Input() ngData: any;
  @Input() mainId: string | number;
  @Input() placeHolderText: string;
  @Output() isListItemsValid = new EventEmitter<boolean>(); // emit whether bulk options are valid or not
  localString: string;
  startIndex;
  mainValueList = [];
  listNames = [];
  Regex = Regex;
  ngOnInit() {
    this.startIndex = this.currentLength + 1;
  }

  handleOnChange(event) {
    const localList = event.target.value
      .trim()
      .replace(/\r\n/g, '\n')
      .split('\n');
    this.ngData?.splice(0, this.ngData.length);
    localList.map((val, index) => {
      let localObject = {};
      if (val != '' && index + 1 > localList.length) {
        localObject = {
          [this.textKey]: val,
          type: 'text',
          type_options: { type: 'text' },
          [this.idKey]: 0,
          is_active: true,
        };
        // checking input contains html
        const hasHTML = this.Regex.containsHtmlTags.test(val);
        this.isListItemsValid.emit(!hasHTML);
        this.ngData?.push(localObject);
      } else if (val != '') {
        let localString = '';
        if (val.includes(this.type)) {
          localString = val.substring(val.indexOf(':') + 1).trim();
        } else {
          localString = val.trim();
        }
        // checking input contains html
        const hasHTML = this.Regex.containsHtmlTags.test(localString);
        this.isListItemsValid.emit(!hasHTML);
        if (localString) {
          localObject = {
            [this.textKey]: localString,
            type: 'text',
            type_options: { type: 'text' },
            [this.idKey]: 0,
            is_active: true,
          };
        }
        this.ngData?.push(localObject);
      }
    });
  }
}
