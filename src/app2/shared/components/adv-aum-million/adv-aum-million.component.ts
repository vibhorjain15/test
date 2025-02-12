import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import {
  IAfterGuiAttachedParams,
  ICellRendererParams,
} from 'ag-grid-community';
import { toMillionPipe } from '../../pipes/to-million.pipe';
@Component({
  selector: 'app-adv-aum-million',
  templateUrl: './adv-aum-million.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvAumMillionComponent implements ICellRendererAngularComp {
  params: any;
  label: any;

  constructor(private toMillionPipe: toMillionPipe) {}

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.label = params.value
      ? this.toMillionPipe.convertToMillion(this.params.value, 0)
      : 0;
  }
  afterGuiAttached?(params?: IAfterGuiAttachedParams): void {}
}
