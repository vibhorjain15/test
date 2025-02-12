import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Subject } from 'rxjs';
import { UtilsService } from './utils.service';

@Injectable({
  providedIn: 'root',
})
export class ManageTaskService {
  constructor(
    private readonly http: HttpClient,
    private readonly Utils: UtilsService,
    private toaster: ToastrService
  ) {}

  private tasksList: Array<any> = new Array<any>();
  get tasks() {
    return this.tasksList;
  }

  private tasksChanges = new Subject<any>();
  tasksChanged$ = this.tasksChanges.asObservable();

  getAllTasks(params, success, pageUrl?) {
    let headers = new HttpHeaders();
    if (pageUrl) {
      headers.set('page-url', pageUrl);
    }
    this.http
      .get('todos', { params: params, headers: headers })
      .subscribe((response: any) => {
        this.tasksList = response;
        success();
      });
  }

  addTask(payload, pageUrl, successCallback, errorCallback) {
    const headers = new HttpHeaders();
    if (pageUrl) {
      headers.set('page-url', pageUrl);
    }
    this.http.post(`todos`, payload, { headers: headers }).subscribe(
      (response) => {
        this.tasksList.push(response);
        this.tasksChanges.next();
        this.toaster.success('Task successfully added');
        successCallback();
      },
      (error) => {
        errorCallback(error);
      }
    );
  }

  updateTask(payload, pageUrl, successCallback, errorCallback) {
    const headers = new HttpHeaders();
    if (pageUrl) {
      headers.set('page-url', pageUrl);
    }
    this.http.put(`todos/${payload.id}`, payload).subscribe(
      (response: any) => {
        const index = this.tasksList.findIndex((x) => x.id === response.id);
        this.tasksList[index] = response;
        this.tasksChanges.next();
        this.toaster.success('Task successfully updated');
        successCallback();
      },
      (error) => {
        errorCallback(error);
      }
    );
  }
}
