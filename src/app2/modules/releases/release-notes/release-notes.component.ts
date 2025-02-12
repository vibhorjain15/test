import {
  Component,
  ElementRef,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';

import { ToastrService } from 'ngx-toastr';

import { RouterService } from 'src/app2/services/router.service';
import { ReleasesService } from 'src/app2/services/releases/releases.service';
import {
  IReleaseDetail,
  ReleaseDetail,
} from 'src/app2/shared/models/releases.model';
import { ToggleWritetoUs } from 'src/app2/store/user/user.action';
import { Store } from '@ngxs/store';

@Component({
  selector: 'app-release-notes',
  templateUrl: './release-notes.component.html',
  styleUrls: ['./release-notes.component.css'],
  host: {
    '(window:scroll)': 'onScroll()',
  },
})
export class ReleaseNotesComponent implements OnInit {
  @ViewChild('navbar', { static: true }) navbar: ElementRef<HTMLElement>;
  @ViewChild('releaseNoteContainer', { static: true })
  releaseNoteContainer: ElementRef<HTMLElement>;
  showFeedback = false;
  releases: Array<ReleaseDetail> = [];
  renderedReleases: Array<ReleaseDetail> = [];
  releasePerPage: number = 5;
  canLoadMore: boolean = false;
  id?: number;
  isInitialLoad: boolean = true;

  constructor(
    private readonly routerService: RouterService,
    private readonly toastrService: ToastrService,
    private readonly releasesService: ReleasesService,
    private readonly store: Store,
    @Inject(DOCUMENT) private readonly document: Document
  ) {}

  ngOnInit(): void {
    this.onScroll();
    this.id = parseInt(this.routerService.getState().params['#']);
    this.releasesService
      .getReleases()
      .subscribe({
        next: (releases: Array<IReleaseDetail>) => {
          this.releases = releases.map<ReleaseDetail>(
            (release: IReleaseDetail) => new ReleaseDetail(release)
          );
          this.fetchNextSetOfReleases();
          this.isInitialLoad = false;
        },
        error: (error: any) => this.toastrService.error('An error occurred'),
      })
      .add(() => this.openReleaseNote());
  }

  fetchNextSetOfReleases(): void {
    if (this.releases.length !== this.renderedReleases.length) {
      const startIndex: number = this.renderedReleases.length;
      const endIndex: number = startIndex + this.releasePerPage;
      const newReleasesToShow = this.releases.slice(startIndex, endIndex);
      this.renderedReleases.push(...newReleasesToShow);

      if (this.id && this.isInitialLoad) {
        if (
          !newReleasesToShow.some(
            (release) => release.id && release.id === this.id
          )
        ) {
          this.fetchNextSetOfReleases();
        }
      }
    }

    this.canLoadMore = this.releases.length !== this.renderedReleases.length;
  }

  openReleaseNote(): void {
    if (this.id) {
      setTimeout(() => {
        const releaseNote =
          this.releaseNoteContainer.nativeElement.querySelector<HTMLElement>(
            `#${CSS.escape(this.id.toString())}`
          );
        window.scrollTo({
          top: releaseNote.offsetTop,
          behavior: 'smooth',
        });
      });
    }
  }

  toggleFeedbackPanel(): void {
    this.store.dispatch(new ToggleWritetoUs());
  }

  navigate(location: string): void {
    window.open(`/#/app/home`, '_blank'); 
    this.document.body.style.paddingTop = '0px'
  }

  onScroll(): void {
    const pageYOffset = window.scrollY;
    this.navbar.nativeElement.classList.toggle(
      'releases-navbar-small',
      pageYOffset > 0
    );

    if (pageYOffset) {
      this.document.body.style.paddingTop = `${this.navbar.nativeElement.offsetHeight}px`;
    } else {
      this.document.body.style.paddingTop = `80px`;
    }
  }
}
