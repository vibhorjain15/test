import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WordToTemplateComponent } from './word-to-template/word-to-template.component';
import { ExcelToTemplateComponent } from './excel-to-template/excel-to-template.component';
import { SharedModule } from 'src/app2/shared/shared.module';
import { ManageExcelTemplateComponent } from './modals/manage-excel-template.component';
import { UploadQaFileComponent } from './upload-qa-file/upload-qa-file.component';
import { ViewUnmarkedItemsComponent } from './modals/view-unmarked-items/view-unmarked-items.component';
import { ManageExcelSheetsComponent } from './modals/manage-excel-sheets/manage-excel-sheets.component';
import { ManageExcelFileComponent } from './manage-excel-file/manage-excel-file.component';
import { ManageWordFileComponent } from './modals/manage-word-file/manage-word-file.component';
import { ParserInstructionsComponent } from './parser-instructions/parser-instructions.component';
import { PreviewAccordionComponent } from './preview-accordion/preview-accordion.component';


@NgModule({
  declarations: [
    WordToTemplateComponent,
    ExcelToTemplateComponent,
    ManageExcelTemplateComponent,
    UploadQaFileComponent,
    ViewUnmarkedItemsComponent,
    ManageExcelSheetsComponent,
    ManageExcelFileComponent,
    ManageWordFileComponent,
    ParserInstructionsComponent,
    PreviewAccordionComponent,
  ],
  imports: [CommonModule, SharedModule],
  exports: [UploadQaFileComponent],
})
export class NewParserModule { }
