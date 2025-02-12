import { Routes } from '@angular/router';
import { ReleaseNotesComponent } from './release-notes/release-notes.component';

export const RELEASES_ROUTES: Routes = [
  {
    path: 'notes',
    component: ReleaseNotesComponent,
  },
];
