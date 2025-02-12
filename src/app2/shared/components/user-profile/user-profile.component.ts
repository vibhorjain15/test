import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { GetCurrentUser } from 'src/app2/store/user/user.action';
import { UserState } from 'src/app2/store/user/user.state';
import { Select, Store } from '@ngxs/store';
import { catchError, takeUntil, tap } from 'rxjs/operators';
import { Subject, of } from 'rxjs';
import { FileHandlerService } from 'src/app2/services/file-handler.service';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css'],
})
export class UserProfileComponent implements OnInit, OnDestroy {
  @Input() avatarImgClass? = '';
  @Input() avatarClass? = '';
  @Input() avatarIconSize? = '';
  @Input() avatarIconClass? = '';
  @Input() inputUser? = '';
  @Input() user?;
  current_user;
  @Select(UserState.getCurrentUserData) user$;
  @ViewChild('fileInput') fileInput: ElementRef;
  private ngUnsubscribe = new Subject<void>();
  file: File;
  sizeLimit: number;
  accept: string='.jpg,.png,.jpeg';
  constructor(private readonly store: Store,private readonly fileHandler: FileHandlerService,private readonly http: HttpClient,private readonly toaster: ToastrService) {}
  ngOnInit(): void {
    this.user$
      .pipe(
        takeUntil(this.ngUnsubscribe),
        tap((userData) => {
          if (!userData) {
            this.store.dispatch(new GetCurrentUser());
          }
        })
      )
      .subscribe((user) => {
        if (user) {
          this.current_user = user;
          if (!this.user) this.user = this.inputUser || this.current_user;
        }
      });
    this.sizeLimit = this.fileHandler.getMaxFileSize();
  }
  selectFile(): void {
    this.fileInput.nativeElement.click();
  }
  handleFileInput(files: FileList,fileInput) {
    this.file = files.item(0);
    if(!this.validateFile(this.file)){
      this.uploadAvatar();
    }else{
      this.toaster.error('', this.validateFile(this.file));
    }
    fileInput.value = null;
  }
  validateFile(file) {
    let fileSize = this.getFileSize(file);
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
  getFileSize(file: any): Promise<number> {
    return file.size;
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
  uploadAvatar() {
    if (this.file) {
      let payload = new FormData();
      payload.append('file', this.file);
      this.http
        .post('users/avatar', payload, {
          reportProgress: true,
          observe: 'events',
        })
        .subscribe((response: any) => {
          if (response.type === HttpEventType.Response) {
            const url = response.body[0].blobUrl;
            const user_model = JSON.parse(JSON.stringify(this.user));
            user_model.picture_url = url;
            this.saveUserProfile(user_model);
          }
        });
    }
  }

  removeAvatar() {
    const user_model = JSON.parse(JSON.stringify(this.user));
    user_model.picture_url = null;
    this.saveUserProfile(user_model);
  }

  saveUserProfile(user_model: any) {
    this.http
      .put('users/' + this.current_user.id, user_model)
      .pipe(
        catchError(() => {
          this.toaster.error(
            '',
            'Something went wrong with the file upload, please write to support',
            { timeOut: 5000 }
          );
          return of([]);
        })
      )
      .subscribe((response: any) => {
        this.toaster.clear();
        this.user = { ...this.user, ...response };
        this.toaster.success('', 'Avatar updated successfully');
      });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe?.next();
    this.ngUnsubscribe?.complete();
  }
}
