import { Routes } from '@angular/router';
import { ResourcesComponent } from './resources/resources.component';
import { ManageThresholdsComponent } from './manage-thresholds/manage-thresholds.component';
import { AdvSearchComponent } from './adv-search/adv-search.component';

export const DATAHUB_ROUTES: Routes = [
  {
    path: '',
    component: ResourcesComponent,
  }
];
