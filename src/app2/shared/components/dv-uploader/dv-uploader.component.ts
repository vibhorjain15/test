import {
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { FileHandlerService } from 'src/app2/services/file-handler.service';

@Component({
  selector: 'dv-uploader',
  templateUrl: './dv-uploader.component.html',
  styleUrls: ['./dv-uploader.component.css'],
})
export class DvUploaderComponent {
  @Input() dragLabel = 'Drag & Drop your bulk upload Excel here';
  @Input() buttonLabel = 'Select File';
  @Input() isMultiple = true;
  @Input() showUploadedFiles = true;
  @Input() accept: string;
  @Input() disabled: boolean;
  @Input() sizeLimit = 50; // MB;
  @Input() maxFiles: number = 50; // if not provided then will initialize to 50
  @Input() directory = false;
  @Output() onFileUpload = new EventEmitter();
  @Input() loader: boolean = false;
  @Input() truncateNameCharTo = 30;
  @Input() loaderText = '';
  files: any = [];
  constructor(
    private readonly fileHandler: FileHandlerService,
    private readonly toastr: ToastrService
  ) {}

  async dropped(droppedFiles: any[]) {
    let files = [];
    droppedFiles = droppedFiles.filter((x) => x.relativePath);
    if (!droppedFiles.length) return;
    if (!this.isMultiple && droppedFiles?.length >= 1) {
      droppedFiles = [droppedFiles[0]];
    } else if (
      this.isMultiple &&
      this.maxFiles &&
      droppedFiles.length > this.maxFiles
    ) {
      this.toastr.error(`Only ${this.maxFiles} files can be uploaded at once`);
      return;
    }

    let errorMessage = ``;
    for (let index = 0; index < droppedFiles.length; index++) {
      errorMessage = await this.validateFile(droppedFiles[index].fileEntry);
      if (errorMessage.length) {
        droppedFiles.splice(index, 1);
        this.toastr.error(errorMessage);
        break;
      }
    }
    if (errorMessage) {
      return;
    }

    droppedFiles.map((val) => {
      var relativePath = val.relativePath;
      val.fileEntry.file((file) => {
        // in case of drag and drop, the file.webkitRelativePath has empty string, but relativePath is available.
        file.relativePath = file.webkitRelativePath || relativePath;
        files.push(file);
        /* in the "click to browse" scenario, ctx-file-drop.js creates a "fake" FileEntry object
        where the file() method simply calls a callback. So it fires immediately.
        Whereas, in the drag/drop case, a regular FileEntry object is created.
        The file() method, there, does NOT fire immediately so emit outside the map won't work as it emits empty array.
        so the below code will make sure that emit takes place only after all the files have been processed
        */
        if (files.length === droppedFiles.length) {
          if (this.directory) {
            this.files.push(
              ...files.filter(
                (file) =>
                  !this.files.some(
                    (item) => item.relativePath == file.relativePath
                  )
              )
            );
          } else {
            this.files = files;
          }
          this.onFileUpload.emit(files);
        }
      });
    });
  }

  /**
   * Checks file size and name and check for valid name
   * @param file File blob
   * @returns error message if file name or size is invalid
   */
  async validateFile(file: FileSystemFileEntry) {
    // waiting for the file size from FileSystemFileEntry callback
    let fileSize = await this.getFileSize(file);
    let errorMessage = ``;
    const fileName: string = file.name || '';
    const fileNameParts = fileName?.split('.') || '';
    const uploadedMBSize = this.kbToMB(this.bytesToKB(fileSize));

    if (uploadedMBSize === 0 || !uploadedMBSize) {
      errorMessage = `File(s) with no content cannot be uploaded`;
      return errorMessage;
    }

    if (uploadedMBSize > this.sizeLimit) {
      errorMessage = `Only ${this.sizeLimit}MB can be uploaded at once`;
    } else if (
      !this.checkExtension(`${fileNameParts[fileNameParts.length - 1]}`) ||
      !fileName.includes('.')
    ) {
      const validExtensions = this.setValidExtensions();
      errorMessage = `Only ${validExtensions} files are allowed`;
    } else if (!this.fileHandler.META_CHARACTER_REGEX.test(file.name)) {
      errorMessage = `File name(s) can\'t have special characters`;
    } else if (!this.fileHandler.FIRST_CHARACTER_REGEX.test(file?.name)) {
      errorMessage = `File name(s) can\'t start with space or special characters (= + - @)`;
    } else if (file?.name?.length > this.fileHandler.MAX_FILENAME_CHARACTERS) {
      errorMessage = `Maximum file name(s) limit reached`;
    }

    return errorMessage;
  }

  /**
   * Get file size from the file drop event file
   * @param file file
   * @returns promise file size
   */
  getFileSize(file: any): Promise<number> {
    return new Promise((resolve) => {
      file.file((file: File) => {
        const fileSize = file.size;
        resolve(fileSize);
      });
    });
  }

  setValidExtensions() {
    const extensions =
      this.accept && this.accept !== '*'
        ? this.accept.split(',').map((x: string) => ` ${x} `)
        : this.fileHandler
            .getFileTypes()
            .map((ext) => `  ${ext}  `)
            .toString();
    return extensions;
  }

  bytesToKB(bytes) {
    const kb = bytes / 1024;
    return kb;
  }

  kbToMB(kb) {
    const mb = kb / 1024;
    return mb;
  }

  checkExtension(ext: string) {
    const validExtensions: string[] =
      this.accept !== '*' && this.accept
        ? this.accept.split(`,`)
        : this.fileHandler.getFileTypes();
    return validExtensions.includes(`.${ext.toLowerCase()}`);
  }
}
