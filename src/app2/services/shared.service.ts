import { Injectable } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SharedService {
  columnDefs = new BehaviorSubject<ColDef[]>([]);
  currentColumnDefs = this.columnDefs.asObservable();
  constructor() {}
  changeColumnDefs(newColumnDefs: ColDef[]): void {
    this.columnDefs.next(newColumnDefs);
  }
}
