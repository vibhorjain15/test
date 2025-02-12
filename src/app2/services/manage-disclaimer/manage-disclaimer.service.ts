import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Subject } from 'rxjs';
import {
  DisclaimerRequestType,
  IDisclaimerObject,
} from './manage-disclaimer.types';

@Injectable({
  providedIn: 'root',
})
export class ManageDisclaimerService {
  constructor(
    private readonly http: HttpClient,
    private readonly toaster: ToastrService
  ) {}

  allDisclaimer: IDisclaimerObject[] = [];

  allDisclaimerSub: Subject<string> = new Subject<string>();

  createDisclaimer(params: DisclaimerRequestType, success, failure) {
    this.http.post(`disclaimers`, params).subscribe(
      (response: IDisclaimerObject) => {
        this.allDisclaimer.push(response);
        this.allDisclaimerSub.next('');
        this.toaster.success('Disclaimer successfully added');
        success();
      },
      (error) => {
        this.toaster.error('Disclaimer didnot get updated ' + error.message);
        failure();
      }
    );
  }

  updatedDisclaimer(params: IDisclaimerObject, success, failure) {
    this.http.put(`disclaimers/${params.id}`, params).subscribe(
      (response: IDisclaimerObject) => {
        this.allDisclaimer.filter((val) => {
          if (val.id === response.id) {
            val.name = response.name;
            val.text = response.text;
          }
        });
        this.allDisclaimerSub.next('');
        this.toaster.success('Disclaimer successfully updated ');
        success();
      },
      (error) => {
        this.toaster.error('Disclaimer didnot get updated ' + error.message);
        failure();
      }
    );
  }

  deleteDisclaimer(id: number, success, failure) {
    this.http.delete(`disclaimers/${id}`).subscribe(
      () => {
        this.toaster.success('', 'Disclaimer deleted successfully');
        success();
      },
      () => {
        failure();
      }
    );
  }
}
