import { Routes } from '@angular/router';
import { DashboardViewComponent } from './pages/dashboard-container/dashboard-container.component';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    component: DashboardViewComponent,
  },
];
