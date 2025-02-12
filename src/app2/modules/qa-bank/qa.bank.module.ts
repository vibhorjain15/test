import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app2/shared/shared.module';
import { EditorModule, TINYMCE_SCRIPT_SRC } from '@tinymce/tinymce-angular';
import { ManageBulkTagsComponent } from './component/manage-bulk-tags/manage-bulk-tags.component';
import { AssignSmeBulkComponent } from './modal/assign-sme-bulk/assign-sme-bulk.component';
import { QABulkService } from './service/qa-bulk.service';
import { AssignNewTagsBulkComponent } from './modal/assign-new-tag-bulk/assign-new-tag-bulk.component';
import { AssignExpiryDateBulkComponent } from './modal/assign-expiry-date-bulk/assign-expiry-date-bulk.component';
import { QuestionContainerComponent } from './component/question-container/question-container.component';
import { QaBankDuplicateComponent } from './pages/qa-bank-duplicate/qa-bank-duplicate.component';
import { QaBankDuplicateSecondaryComponent } from './component/qa-bank-duplicate-secondary/qa-bank-duplicate-secondary.component';
import { QaLibraryComponent } from './component/qa-library/qa-library.component';
import { QaHistoryComponent } from './component/qa-history/qa-history.component';
import { QaArchiveComponent } from './component/qa-archive/qa-archive.component';
import { QaBankTabsComponent } from './pages/qa-bank-tab/qa-bank-tabs.component';
import { QaFiltersComponent } from './component/qa-filters/qa-filters.component';
import { ManageQuestionCustomSearchComponent } from './modal/manage-question-custom-search/manage-question-custom-search.component';
import { QaBankCenterComponent } from './qa-bank/qa-bank.component';
import { RouterModule } from '@angular/router';
import { QA__BANK_ROUTES } from './qa-bank.routes';
@NgModule({
  declarations: [
    QaBankCenterComponent,
    ManageBulkTagsComponent,
    AssignSmeBulkComponent,
    AssignNewTagsBulkComponent,
    AssignExpiryDateBulkComponent,
    QuestionContainerComponent,
    QaBankDuplicateComponent,
    QaBankDuplicateSecondaryComponent,
    QaLibraryComponent,
    QaHistoryComponent,
    QaArchiveComponent,
    QaBankTabsComponent,
    QaFiltersComponent,
    ManageQuestionCustomSearchComponent,
  ],
  providers: [QABulkService],
  imports: [CommonModule, SharedModule, EditorModule, RouterModule.forChild(QA__BANK_ROUTES)],
})
export class QaBankModule {}
