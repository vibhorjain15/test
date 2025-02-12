import { DatePipe } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { ImageDataService } from 'src/app2/services/ImageData/ImageDataService.service';
import { ModalService } from 'src/app2/services/modal.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { UtilsService } from 'src/app2/services/utils.service';
@Component({
  selector: 'app-dv-meeting-notes',
  templateUrl: './dv-meeting-notes.component.html',
  styleUrls: ['./dv-meeting-notes.component.css'],
})
export class DvMeetingNotesComponent implements OnInit, OnChanges {
  @Input() notesOptions;
  @Input() submitClicked = false;
  @Input() dateFilter;
  @Output() onSelectData = new EventEmitter<any[]>();

  add_new_activity;
  notesToolBar: string[];
  customDateFilter: any;
  tinymceEditor: any;
  tinymceStatusbar = '';
  resultBlob: any;
  tinyMceInit;
  date: Date;
  init: any = {};

  constructor(
    private readonly Utils: UtilsService,
    private readonly ModalFactory: ModalService,
    private datePipe: DatePipe,
    private readonly ImageService: ImageDataService,
    private readonly customModalService: CustomModalService
  ) {}

  ngOnInit() {
    this.initTinyMc();

    this.customDateFilter = this.dateFilter;
    this.initAddActivityForm();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (
      changes?.dateFilter?.currentValue !== changes?.dateFilter?.previousValue
    ) {
      this.customDateFilter = changes?.dateFilter?.currentValue;
    }
  }
  initTinyMc() {
    this.init = {
      placeholder: 'Type your text here',
    };
  }

  initAddActivityForm() {
    this.add_new_activity = {};
    this.date = new Date();
  }

  setDateValue(date) {
    this.date = date;
  }

  uploadImages(blobInfo, success, failure) {
    this.resultBlob = this.b64toBlob(blobInfo.base64());
    this.resultBlob.name = blobInfo.filename();
    const payload = new FormData();
    payload.append(
      'file',
      this.resultBlob,
      blobInfo.filename() + new Date().getTime() + '.png'
    );
    this.ImageService.uploadImageDirect(payload).subscribe(
      (response) => {
        success(response[0].blobUrl);
      },
      (error) => {
        failure(error);
      }
    );
  }

  b64toBlob(b64Data, contentType?, sliceSize?) {
    let blob,
      byteArray,
      byteArrays,
      byteCharacters,
      byteNumbers,
      i,
      offset,
      slice;
    if (!contentType) {
      contentType = '';
    }
    if (!sliceSize) {
      sliceSize = 512;
    }
    byteCharacters = atob(b64Data);
    byteArrays = [];
    offset = 0;
    while (offset < byteCharacters.length) {
      slice = byteCharacters.slice(offset, offset + sliceSize);
      byteNumbers = new Array(slice.length);
      i = 0;
      while (i < slice.length) {
        byteNumbers[i] = slice.charCodeAt(i);
        i++;
      }
      byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
      offset += sliceSize;
    }
    blob = new Blob(byteArrays, {
      type: contentType,
    });
    return blob;
  }

  handleEditChange(data) {
    this.add_new_activity.text = data;
    this.add_new_activity.as_of_date = this.datePipe.transform(
      this.date,
      'd-MMMM-yyyy'
    );
    let apiObj: any = {};
    apiObj = JSON.parse(JSON.stringify(this.add_new_activity));
    apiObj.text = this.add_new_activity.text;
    apiObj.mentions = this.Utils.getMentionsIds(this.add_new_activity.text);
    this.onSelectData.emit(apiObj);
  }
}
