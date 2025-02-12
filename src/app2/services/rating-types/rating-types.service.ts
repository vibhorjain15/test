import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { IRatingtypes } from './rating-types.type';

@Injectable({
  providedIn: 'root',
})
export class RatingTypesService {
  allRatingTypes: IRatingtypes[];

  constructor(
    private readonly http: HttpClient,
    private readonly toaster: ToastrService
  ) {
    this.allRatingTypes = [];
  }

  getAllRatingType(success, failure) {
    this.http.get('rating_types').subscribe(
      (response: IRatingtypes[]) => {
        this.allRatingTypes = response;
        success(this.allRatingTypes);
      },
      () => {
        failure();
      }
    );
  }
}
