import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { ReleaseNotesComponent } from './release-notes/release-notes.component';
import { SharedModule } from 'src/app2/shared/shared.module';
import { RELEASES_ROUTES } from './releases.routes';

@NgModule({
  declarations: [ReleaseNotesComponent],
  imports: [CommonModule, SharedModule, RouterModule.forChild(RELEASES_ROUTES)],
})
export class ReleasesModule {}
