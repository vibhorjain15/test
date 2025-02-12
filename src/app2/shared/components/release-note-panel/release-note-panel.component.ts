import { Component, EventEmitter, OnInit, Output } from '@angular/core';

import { ToastrService } from 'ngx-toastr';

import { ReleasesService } from 'src/app2/services/releases/releases.service';
import { ModuleColor } from '../../constants/constant';
import { IReleaseDetail } from '../../models/releases.model';

@Component({
  selector: 'app-release-note-panel',
  templateUrl: './release-note-panel.component.html',
  styleUrls: ['./release-note-panel.component.css'],
})
export class ReleaseNotePanelComponent implements OnInit {
  releases: Array<IReleaseDetail>;
  ModuleColor = ModuleColor;
  allReleaseViewed = true;
  @Output() close = new EventEmitter();
  @Output() unseen = new EventEmitter();

  constructor(
    private readonly toastrService: ToastrService,
    private readonly releasesService: ReleasesService
  ) {}

  ngOnInit(): void {
    this.releasesService.getReleases().subscribe({
      next: (releaseNotes: Array<IReleaseDetail>) => {
        this.releases = this.removeContentStyling(releaseNotes.splice(0, 5));
      },
      error: (error: any) => this.toastrService.error('An error occurred.'),
    });
  }

  removeContentStyling(releases: Array<IReleaseDetail>): Array<IReleaseDetail> {
    const div = document.createElement('div');
    releases.forEach((release: IReleaseDetail) => {
      div.innerHTML = release.description;
      release.description = div.textContent;
      if (!release.read) this.allReleaseViewed = false;
    });
    this.unseen.emit(this.allReleaseViewed);
    return releases;
  }

  openReleaseNote(release: IReleaseDetail): void {
    this.releasesService.postViews(release.id).subscribe((response) => {
      release.read = true;

      this.allReleaseViewed = true;
      this.releases.forEach((release) => {
        if (!release.read) this.allReleaseViewed = false;
      });
      this.unseen.emit(this.allReleaseViewed);
    });

    // window.open(`/#/app/releases/notes?id=${release.id}`, '_blank'); // when we open modal
    window.open(`/#/app/releases/notes#${release.id}`, '_blank'); // scroll to the specific release
  }

  closeEvent() {
    this.close.emit();
  }

  // Make an API call to mark everything read
  handleViewAll() {
    this.releasesService.postViews(-1).subscribe(() => {
      this.releases.forEach((release) => {
        release.read = true;
      });
      this.allReleaseViewed = true;
      this.unseen.emit(this.allReleaseViewed);
    });
  }
}
