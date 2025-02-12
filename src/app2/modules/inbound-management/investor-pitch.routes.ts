import { Routes } from '@angular/router';
import { InvestorPitchComponent } from './investor-pitch/investor-pitch.component';
import { ReviewRequestComponent } from './review-request/review-request.component';

export const INVESTOR_PITCH_ROUTES: Routes = [
  {
    path: 'investor_pitch',
    component: InvestorPitchComponent,
  },
  {
    path: 'review_request',
    component: ReviewRequestComponent,
  },
];
