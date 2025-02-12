import { Routes } from '@angular/router';
import { ProjectsLayoutComponent } from './projects-layout/projects-layout.component';
import { appRoutesNames } from 'src/app2/app.routes.name';

export const PROJECTS_GRID_ROUTES: Routes = [
  {
    path: appRoutesNames.ACTIVITY_INPROGRESS,
    component: ProjectsLayoutComponent,
  },
];
