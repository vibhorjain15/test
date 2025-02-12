import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app2/shared/shared.module';
import { DiligenceNewddqComponent } from './new-ddq/new-ddq.component';
import { DiligenceInviteInvestor } from './investor/investor.component';
import { GridLabelCellComponent } from './investor/component/gridLabelcell/gridLabelcell.component';
import { PendingDraftRequestsComponent } from './investor/component/pending-draft-requests/pending-draft-requests.component';
import { GridStatusCellComponent } from './investor/component/gridStatusCell/gridStatusCell.component';
import { EntityNameLinkCellRendererComponent } from './investor/component/entity-name-link/entity-name-link.component';
import { FilteredEntityQestionnaireSelectorComponent } from './investor/component/filtered-entity-questionnaire-selector/filtered-entity-questionnaire-selector.component';
import { FormsModule } from '@angular/forms';
import { NewQaLibraryComponent } from './new-ddq/new-qa-library/new-qa-library.component';
@NgModule({
  declarations: [
    DiligenceNewddqComponent,
    DiligenceInviteInvestor,
    GridLabelCellComponent,
    PendingDraftRequestsComponent,
    GridStatusCellComponent,
    EntityNameLinkCellRendererComponent,
    PendingDraftRequestsComponent,
    GridStatusCellComponent,
    EntityNameLinkCellRendererComponent,
    FilteredEntityQestionnaireSelectorComponent,
    NewQaLibraryComponent,
  ],
  imports: [CommonModule, SharedModule, FormsModule],
})
export class InviteModule {}
