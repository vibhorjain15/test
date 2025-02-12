import { HttpEventType } from '@angular/common/http';
import { Component, Input, NgZone } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { ClassicEditor } from 'ckeditor5';
import { FileHandlerService } from 'src/app2/services/file-handler.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { BaseDataService } from 'src/app2/services/base-data.service';
import { ImageDataService } from 'src/app2/services/ImageData/ImageDataService.service';
import { ToastrService } from 'ngx-toastr';
import { DatePipe } from '@angular/common';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';

@Component({
  selector: 'app-questionnaire-upload-image',
  templateUrl: './questionnaire-upload-image.component.html',
  styleUrls: ['./questionnaire-upload-image.component.css'],
})
export class QuestionnaireUploadImageComponent {
  @Input() editor: any;
  @Input() isCKEditor: boolean = false; // default to tinymce
  @Input() insertImageIntoCKEditor: (
    editor: ClassicEditor,
    imageUrl: string
  ) => void;

  maxFileSize: any;
  activeSort = '';
  allowed_file_extensions_str: any;
  images = [];
  reverseValueForSortByAlphabet: boolean;
  reverseValueForSortByDate: boolean;
  loading_images: boolean;
  loading = false;
  searchControl = '';
  imagesCopy = [];
  fileProgress: number;
  constructor(
    private readonly Utils: UtilsService,
    private readonly BaseDataService: BaseDataService,
    private readonly toaster: ToastrService,
    private readonly ImageDataService: ImageDataService,
    private readonly FileHandlerFactory: FileHandlerService,
    private readonly SweetAlert: SweetAlertService,
    private readonly datePipe: DatePipe,
    private readonly customModalService: CustomModalService,
    private readonly ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.initialize();
  }

  initialize() {
    this.loadImages();
    const allowed_file_extensions = ['gif', 'jpg', 'png', 'jpeg'];
    this.maxFileSize = this.FileHandlerFactory.getMaxFileSize();

    this.allowed_file_extensions_str = allowed_file_extensions
      .map((ext: string) => '.' + ext)
      .join(',');

    this.reverseValueForSortByAlphabet = false;
    this.reverseValueForSortByDate = false;
  }

  sort_by_key(field: string, reverse: any, primer: any) {
    const key: any = primer
      ? (x: { [x: string]: any }) => primer(x[field])
      : (x: { [x: string]: any }) => x[field];
    reverse = !reverse ? 1 : -1;
    return function (a: any, b: any) {
      a = key(a);
      b = key(b);
      return reverse * +(a > b) - +(b > a);
    };
  }

  sortBy(type: string) {
    this.activeSort = type;
    if (type === 'alphabetical') {
      this.reverseValueForSortByAlphabet = !this.reverseValueForSortByAlphabet;
      this.images.sort(
        this.sort_by_key(
          'fileName',
          this.reverseValueForSortByAlphabet,
          (a: { toUpperCase: () => any }) => a.toUpperCase()
        )
      );
    }
    if (type === 'mostRecent') {
      this.reverseValueForSortByDate = !this.reverseValueForSortByDate;
      this.images.sort(
        this.sort_by_key(
          'insertTimeStamp',
          this.reverseValueForSortByDate,
          (a: any) => this.datePipe.transform(a, 'YYYYMMDD')
        )
      );
    }
  }

  resetFilter() {
    this.searchControl = '';
  }

  loadImages(params?) {
    this.loading_images = true;
    this.ImageDataService.getImages()
      .pipe(finalize(() => (this.loading_images = false)))
      .subscribe((images: Array<any>) => {
        this.images = this.Utils.sortByDate(images, 'insertTimeStamp');
        this.imagesCopy = JSON.parse(JSON.stringify(images));
      });
  }

  uploadAttachment(files: Array<any>) {
    if (!files.length) return;
    const payload = new FormData();
    files.forEach((file, index) => {
      payload.append(`file[${index}]`, file);
    });
    this.ImageDataService.uploadImage(payload)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(
        (response: any) => {
          if (response.type === HttpEventType.Response) {
            this.images.splice(0, 0, response.body[0]);
            this.imagesCopy = JSON.parse(JSON.stringify(this.images));
            this.fileProgress = null;
          }

          if (response.type === HttpEventType.UploadProgress) {
            this.fileProgress = Math.round(
              (100 * response.loaded) / response.total
            );
          }
        },
        () => {
          this.toaster.error(
            'Something went wrong with the file upload, please write to support'
          );
        }
      );
  }

  insert(image: { blobUrl: any }) {
    const tpl = "<img src='%s' alt='image'/>";
    this.ngZone.run(() => {
      if (this.isCKEditor && this.insertImageIntoCKEditor) {
        this.insertImageIntoCKEditor(this.editor, image.blobUrl);
      } else {
        this.editor.insertContent(tpl.replace('%s', image.blobUrl));
        this.editor.focus();
      }
    });
    this.close();
  }

  close() {
    this.customModalService.close();
  }

  confirmImageDelete(image: any) {
    return this.SweetAlert.confirm({
      title: 'Are you sure you want to remove this image?',
      confirmButtonText: 'Yes',
      cancelButtonText: 'Cancel',
      showLoaderOnConfirm: true,
      focusCancel: true,
      preConfirm: () => {
        this.deleteImage(image);
      },
    });
  }

  deleteImage(image: any) {
    this.ImageDataService.deleteImage(image.id).subscribe(
      (_: any) => {
        this.toaster.success('Image deleted successfully.');
        let imageIndex = -1;
        this.images.findIndex((imageElement, index) => {
          if (image.id === imageElement.id) {
            imageIndex = index;
          }
        });
        if (imageIndex > -1) {
          this.images.splice(imageIndex, 1);
        }
      },
      (error: { status: any }) => {
        const ignoredErrorStatuses =
          this.BaseDataService.getAvoidErrorLoggingStatusList();
        if (!Array.from(ignoredErrorStatuses).includes(error.status)) {
          this.Utils.logError('Image Delete Error', error);
          this.toaster.error('Unable to delete this image.');
        }
      }
    );
  }
}
