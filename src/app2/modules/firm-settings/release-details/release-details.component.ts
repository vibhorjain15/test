import {
  Component,
  ElementRef,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';

import { ToastrService } from 'ngx-toastr';

import { RouterService } from 'src/app2/services/router.service';
import { IReleaseDetail } from 'src/app2/shared/models/releases.model';
import { errorMessageMap } from 'src/app2/shared/constants/constant';
import { InterpolatePipe } from 'src/app2/shared/pipes/interpolate.pipe';
import { ReleasesService } from 'src/app2/services/releases/releases.service';
import {
  noHtmlValidator,
  noWhitespaceValidator,
} from 'src/app2/shared/validators/no-white-space.validator';

@Component({
  selector: 'app-release-details',
  templateUrl: './release-details.component.html',
  styleUrls: ['./release-details.component.css'],
})
export class ReleaseDetailsComponent implements OnInit {
  readonly urlRegExp: RegExp =
    /^(http[s]?:\/\/)?([\w\-\.]+)\.([a-z\.]{2,6})([\S]+)$/;
  releaseNoteForm: FormGroup;
  saving: boolean = false;
  activeReleaseNote: IReleaseDetail;
  tinyMceInit: any;
  today = new Date();
  @ViewChildren('imageInputField') imageInputFields: QueryList<ElementRef>;
  userTypes: Array<{ id: string; name: string }> = [
    { id: 'investor', name: 'Investor' },
    { id: 'manager', name: 'Manager' },
    { id: 'both', name: 'Both' },
  ];
  categories: any[] = [
    { name: 'Project', id: 'project' },
    { name: 'Template', id: 'template' },
    { name: 'Document', id: 'document' },
    { name: 'Q/A center', id: 'qna' },
    { name: 'Excel', id: 'excel' },
    { name: 'Dashboard', id: 'dashboard' },
    { name: 'Firm', id: 'firm' },
    { name: 'Product', id: 'product' },
    { name: 'Vehicle', id: 'vehicle' },
    { name: 'Strategy', id: 'strategy' },
    { name: 'Contact', id: 'contact' },
    { name: 'AUM & TR', id: 'aum-tr' },
    { name: 'Analyze', id: 'analyze' },
    { name: 'Data Hub', id: 'data-hub' },
    { name: 'Reports', id: 'report' },
    { name: 'Partnerships', id: 'partnership' },
  ];

  constructor(
    private readonly routerService: RouterService,
    private readonly toastrService: ToastrService,
    private readonly interpolatePipe: InterpolatePipe,
    private readonly releasesService: ReleasesService
  ) {
    this.tinyMceInit = {
      placeholder: 'Few lines about the release',
    };
  }

  get imagesFormArray(): FormArray {
    return this.releaseNoteForm.get('image_urls') as FormArray;
  }

  ngOnInit(): void {
    this.categories.sort((a, b) => a.name.localeCompare(b.name));
    const state = this.routerService.getState();
    const releaseNoteId = +state.params?.releaseId;
    if (releaseNoteId) {
      this.activeReleaseNote = this.releasesService.releases.find(
        (release) => release.id === releaseNoteId
      );
      if (!this.activeReleaseNote) {
        this.routerService.navigate('app.firm.settings.releases.add');
      }
    }

    this.initializeForm();
  }

  getErrorMessage(controlName: string, fieldName: string): string {
    const control = this.releaseNoteForm.get(controlName);
    const hasError =
      control && control?.touched && control?.invalid && control?.errors;
    if (hasError && (control.errors.required || control.errors.whitespace)) {
      return this.interpolatePipe.transform(
        errorMessageMap?.required,
        fieldName
      );
    }

    if (hasError && (control.errors.required || control.errors.containsHtml)) {
      return this.interpolatePipe.transform(
        errorMessageMap?.containsHtml,
        fieldName
      );
    }

    if (hasError && control.errors.pattern) {
      return this.interpolatePipe.transform(errorMessageMap?.url, fieldName);
    }

    return '';
  }

  getImageControlErrorMessage(index: number): string {
    const control = this.imagesFormArray.at(index);
    const hasError =
      control && control?.touched && control?.invalid && control?.errors;
    if (hasError && control.errors.required) {
      return this.interpolatePipe.transform(
        errorMessageMap?.required,
        'Image URL'
      );
    }

    if (hasError && control.errors.pattern) {
      return this.interpolatePipe.transform(
        errorMessageMap?.url,
        'Invalid Image URL pattern'
      );
    }

    return '';
  }

  handleReleaseDateChange(date: Date): void {
    this.releaseNoteForm.patchValue({
      release_date: date,
    });
  }

  handleDescriptionChange(content: any): void {
    this.releaseNoteForm.patchValue({
      description: content,
    });
    this.releaseNoteForm.get('description').markAsTouched({ onlySelf: true });
  }

  cancel(): void {
    this.routerService.navigate('app.firm.settings.releases.list');
  }

  save(): void {
    if (this.releaseNoteForm.invalid) {
      return;
    }

    this.saving = true;
    const releaseNoteDetails = this.filterImages(this.releaseNoteForm.value);
    releaseNoteDetails.user_type =
      releaseNoteDetails.user_type === 'both'
        ? undefined
        : releaseNoteDetails.user_type;
    const operationType = releaseNoteDetails?.id ? 'updated' : 'added';
    const serviceMethod = releaseNoteDetails?.id
      ? this.releasesService.update(
          this.activeReleaseNote.id,
          releaseNoteDetails
        )
      : this.releasesService.add(releaseNoteDetails);
    serviceMethod
      .subscribe((response: IReleaseDetail) => {
        this.toastrService.success(`Release note ${operationType}.`);
        this.cancel(); // navigate back to release note list.
      })
      .add(() => (this.saving = false));
  }

  addNewImage(imageLink?: string, autofocus: boolean = true): void {
    const length = this.imagesFormArray.controls.length;
    this.imagesFormArray.push(
      new FormControl(imageLink, [Validators.pattern(this.urlRegExp)])
    );
    if (autofocus) {
      setTimeout(() => {
        this.imageInputFields?.toArray()[length].nativeElement.focus();
      }, 100); // wait for control to render in the UI
    }
  }

  removeImage(index: number): void {
    this.imagesFormArray.removeAt(index);
  }

  private initializeForm(): void {
    const release_date = this.activeReleaseNote?.release_date;
    this.releaseNoteForm = new FormGroup({
      id: new FormControl(this.activeReleaseNote?.id),
      release_date: new FormControl(
        release_date ? new Date(release_date) : this.today,
        [Validators.required]
      ),
      title: new FormControl(this.activeReleaseNote?.title ?? '', [
        Validators.required,
        noWhitespaceValidator,
        noHtmlValidator,
      ]),
      description: new FormControl(this.activeReleaseNote?.description ?? '', [
        Validators.required,
      ]),
      image_urls: new FormArray([]),
      faq_url: new FormControl(this.activeReleaseNote?.faq_url ?? '', [
        Validators.pattern(this.urlRegExp),
      ]),
      video_url: new FormControl(this.activeReleaseNote?.video_url ?? '', [
        noHtmlValidator,
      ]),
      storylane_url: new FormControl(
        this.activeReleaseNote?.storylane_url ?? '',
        [Validators.pattern(this.urlRegExp)]
      ),
      is_draft: new FormControl(this.activeReleaseNote?.is_draft ?? true),
      user_type: new FormControl(this.activeReleaseNote?.user_type ?? 'both'),
      category: new FormControl(this.activeReleaseNote?.category ?? '', [
        Validators.required,
      ]),
    });

    if (this.activeReleaseNote && this.activeReleaseNote?.image_urls.length) {
      this.activeReleaseNote?.image_urls.forEach((image) => {
        this.addNewImage(image, false);
      });
    } else {
      this.addNewImage(null, false);
    }
  }

  private filterImages(releaseNoteDetails: IReleaseDetail): IReleaseDetail {
    releaseNoteDetails.image_urls = releaseNoteDetails.image_urls.filter(
      (url: string) => url !== undefined && url !== null && url.trim() !== ''
    );

    return releaseNoteDetails;
  }
}
