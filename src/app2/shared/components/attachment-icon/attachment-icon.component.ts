import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-attachment-icon',
  templateUrl: './attachment-icon.component.html',
  styleUrls: ['./attachment-icon.component.css'],
})
export class AttachmentIconComponent implements OnInit {
  @Input() filename;
  @Input() size;
  icon_name = '';

  constructor() {}

  ngOnInit(): void {
    if (this.filename) {
      const splits = this.filename.split('.');
      const file_extension = splits[splits.length - 1];
      const icon_map = {
        doc: 'file-doc',
        rtf: 'file-doc',
        docx: 'file-docx',
        csv: 'file-excel',
        xls: 'file-excel',
        xlsm: 'file-excel',
        xlsx: 'file-excel',
        pdf: 'file-pdf-o',
        png: 'picture',
        jpg: 'picture',
        jpeg: 'picture',
        gif: 'picture',
        mp4: 'movie',
        mov: 'movie',
        avi: 'movie',
        ppt: 'powerpoint',
        pptx: 'powerpoint',
        pptm: 'powerpoint',
        pps: 'powerpoint',
        ppsx: 'powerpoint',
        vsd: 'visio',
        vsdx: 'visio',
        txt: 'file',
        log: 'file',
        sql: 'file',
        htm: 'file',
        msg: 'mail',
        eml: 'mail',
      };
      this.icon_name = icon_map[file_extension.toLowerCase()];
    }
    if (!this.icon_name) {
      this.icon_name = 'document-question';
    }
  }
}
