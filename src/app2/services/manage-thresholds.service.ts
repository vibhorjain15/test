import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ManageThresholdsService {
  constructor(
    private readonly http: HttpClient,
    private readonly toaster: ToastrService,
  ) { }

  private thresholdsList: Array<any> = new Array<any>();
  get thresholds() {
    return this.thresholdsList;
  }

  private thresholdsChanges = new Subject<any>();
  thresholdsChanged$ = this.thresholdsChanges.asObservable();

  getAllThresholds(success) {
    this.http.get('formadv_thresholds').subscribe((response: any) => {
      this.thresholdsList = response;
      success();
    });
  }

  addThreshold(threshold, successCallback, failureCallback) {
    this.http.post(`formadv_thresholds`, threshold).subscribe((response: any) => {
      this.thresholdsList.push(response);
      this.thresholdsChanges.next();
      this.toaster.success('Threshold Added Successfully');
      successCallback();
    },
      (error: any) => {
        this.toaster.error('Something went wrong. Please try again.');
        failureCallback(error);
      });
  }

  updateThreshold(threshold, successCallback, failureCallback) {
    this.http.put(`formadv_thresholds/${threshold.id}`, threshold).subscribe((response: any) => {
      const index = this.thresholdsList.findIndex(x => x.id === threshold.id);
      this.thresholdsList[index] = response;
      this.thresholdsChanges.next();
      this.toaster.success('Threshold Updated Successfully');
      successCallback();
    },
      (error: any) => {
        this.toaster.error('Something went wrong. Please try again.');
        failureCallback(error);
      });
  }

  deleteThreshold(threshold: any, callback) {
    const thresholdIndex = (this.thresholdsList).findIndex(x => x.id === threshold.id);
    this.http.delete(`formadv_thresholds/${threshold.id}`).subscribe(() => {
      this.thresholdsList.splice(thresholdIndex, 1);
      this.thresholdsChanges.next();
      this.toaster.success('Threshold Deleted Successfully')
      callback();
    });
  }
}
