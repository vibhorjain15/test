import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-view-unmarked-items',
  template: `<app-modal
      [title]="'Unmarked Items'"
      [initialTemplate]="templateRef"
    >
    </app-modal>
    <ng-template #templateRef>
      <table class="table table-striped table-condensed">
        <thead>
          <tr>
            <th width="75%">Text</th>
            <th width="15%">Sheet Name</th>
            <th width="10%">Cell Index</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let entry of items">
            <td width="75%" class="break-spaces">{{ entry.text }}</td>
            <td width="15%" class="break-spaces">{{ entry.sheet_name }}</td>
            <td width="10%" class="break-spaces">{{ entry.cell_index }}</td>
          </tr>
        </tbody>
      </table>
    </ng-template> `,
})
export class ViewUnmarkedItemsComponent {
  @Input() Items: Array<any> = [];
}
