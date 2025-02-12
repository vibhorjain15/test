import { Component } from '@angular/core';

import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-release-notes-description-template',
  templateUrl: './release-notes-description-template.component.html',
  styleUrls: ['./release-notes-description-template.component.css']
})
export class ReleaseNotesDescriptionTemplateComponent implements ICellRendererAngularComp {
  params: ICellRendererParams;

  agInit(params: ICellRendererParams): void {
    this.params = params;
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }

}
