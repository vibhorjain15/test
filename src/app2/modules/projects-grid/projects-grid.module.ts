import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProjectsLayoutComponent } from './projects-layout/projects-layout.component';
import { ProjectsGridComponent } from './projects-layout/projects-grid/projects-grid.component';
import { SharedModule } from 'src/app2/shared/shared.module';
import { StatusLegendComponent } from './projects-layout/status-legend/status-legend.component';
import { PROJECTS_GRID_ROUTES } from './projects-grid.routes';
import { ProjectSearchComponent } from './projects-layout/modal/project-search/project-search.component';

@NgModule({
  declarations: [
    ProjectsLayoutComponent,
    ProjectsGridComponent,
    StatusLegendComponent,
    ProjectSearchComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    RouterModule.forChild(PROJECTS_GRID_ROUTES),
  ],
  providers: [DatePipe],
})
export class ProjectsGridModule {}
