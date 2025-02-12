import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app2/shared/shared.module';
import { DocumentsGridComponent } from './documents-grid/documents-grid.component';
import { DOCUMENT_ROUTES } from './documents.route';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [DocumentsGridComponent],
  imports: [CommonModule, SharedModule, RouterModule.forChild(DOCUMENT_ROUTES)],
  exports: [DocumentsGridComponent, RouterModule],
  providers: [],
})
export class DocumentsModule {}
