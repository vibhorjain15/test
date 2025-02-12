import { Component } from '@angular/core';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-form-adv-brochure-url',
  templateUrl: './form-adv-brochure-url.component.html',
})
export class FormAdvBrochureUrlComponent {
  params: any;

  constructor() {}

  agInit(params: ICellRendererParams): void {
    this.params = params;
  }
}
