import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ManageAumService {
  constructor(
    private readonly http: HttpClient,
    private toaster: ToastrService
  ) {}

  private tableList: Array<any> = new Array<any>();
  get tables() {
    return this.tableList;
  }

  private tableChanges = new Subject<any>();
  tableChanged$ = this.tableChanges.asObservable();

  setInitialTables(tables: Array<any>) {
    this.tableList = tables;
  }

  createTable(payload, callback) {
    this.http.post(`AumTrackRecordDefinitions`, payload).subscribe(
      (response) => {
        this.toaster.success('Data table added successfully');
        this.tableList.push(response);
        this.tableChanges.next();
        callback();
      },
      (e) => {
        callback(true);
      }
    );
  }

  updateTable(payload, callback) {
    this.http.put(`AumTrackRecordDefinitions/${payload.id}`, payload).subscribe(
      (response: any) => {
        this.toaster.success('Data table updated successfully');
        const index = this.tableList.findIndex((x) => x.id === response.id);
        this.tableList[index] = response;
        this.tableChanges.next();
        callback();
      },
      (e) => {
        callback(true);
      }
    );
  }
}
