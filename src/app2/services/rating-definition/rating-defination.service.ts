import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Subject } from 'rxjs';
import {
  IManageRiskRatingsRequest,
  IRatingScales,
  IRatingTypes,
  RatingScaleDefinitions,
} from './rating-definition.types';

@Injectable({
  providedIn: 'root',
})
export class RatingService {
  ratingScales: IRatingScales[] = [];
  private allRatingtypes: IRatingTypes[] = [];

  ratingSub: Subject<{ rating: IRatingTypes[]; edit: boolean }>;
  ratingSchemeSub: Subject<{
    category: IManageRiskRatingsRequest;
    isSubCategory: boolean;
    isRatings: boolean;
  }>;
  ratingScaleSub: Subject<{
    allScales: IRatingScales[];
    currentScale: IRatingScales;
  }>;
  manageRatingScaleSub;
  constructor(
    private readonly http: HttpClient,
    private readonly toaster: ToastrService
  ) {
    this.ratingSub = new Subject<{ rating: IRatingTypes[]; edit: boolean }>();
    this.ratingSchemeSub = new Subject();
    this.ratingScaleSub = new Subject();
    this.manageRatingScaleSub = new Subject();
  }

  getAllRatingScales(
    success: (rate: IRatingScales[]) => void,
    failure?: () => void
  ) {
    if (this.ratingScales.length > 0) {
      success(this.ratingScales);
      return;
    }
    this.http.get('v2/rating_scales').subscribe(
      (response: IRatingScales[]) => {
        this.ratingScales = response;
        success(this.ratingScales);
      },
      (error) => {
        failure();
      }
    );
  }

  getRatingScaleDefinitions(id: number, version, success, failure) {
    this.http
      .get(
        `v2/rating_scales/${id}/versions/${version}/rating_scale_definitions`
      )
      .subscribe(
        (response: RatingScaleDefinitions[]) => {
          success(response);
        },
        (error) => {
          failure();
        }
      );
  }

  updateRatingScaleDefinitions(id, version, params, success, failure) {
    this.http
      .put(
        `v2/rating_scales/${id}/versions/${version}/rating_scale_definitions`,
        params
      )
      .subscribe(
        (response: any) => {
          this.toaster.success('Rating Scales have been saved!');
          success();
          this.manageRatingScaleSub.next(id);
        },
        (error) => {
          failure();
        }
      );
  }

  updateDuplicateScaleDefinitions(catId, scaleId, params, success, failure) {
    this.http
      .post(
        `rating_scheme_definitions/${catId}/rating_scales/${scaleId}/duplicate_scale`,
        params
      )
      .subscribe(
        (response: any) => {
          this.toaster.success('Rating Scales have been saved!');
          success();
          this.manageRatingScaleSub.next(response[0].rating_scale_id);
        },
        (error) => {
          failure();
        }
      );
  }

  createRatingScale(params, success, failure) {
    this.http.post(`v2/rating_scales`, params).subscribe(
      (response: any) => {
        this.ratingScales.push(response);
        this.ratingScaleSub.next({
          allScales: this.ratingScales,
          currentScale: response,
        });
        success();
        this.toaster.success('Your rating scale has been added successfully');
      },
      (error: any) => {
        failure();
      }
    );
  }

  updateRatingScale(params: IRatingScales, success, failure) {
    this.http.put(`v2/rating_scales/${params.id}`, params).subscribe(
      (response: any) => {
        this.ratingScales.forEach((val) => {
          if (val.id === response.id) {
            val.name = response.name;
            val.allow_decimal_score_bands = response.allow_decimal_score_bands;
          }
        });
        this.ratingScaleSub.next({
          allScales: this.ratingScales,
          currentScale: response,
        });
        success();
        this.toaster.success('Your rating type has been updated successfully');
      },
      (error: any) => {
        failure();
      }
    );
  }

  deleteRatingScale(scale: IRatingScales, success, failure) {
    this.http.delete(`v2/rating_scales/${scale.id}`).subscribe(
      (response: any) => {
        this.ratingScales.splice(
          this.ratingScales.findIndex((val) => val.id === scale.id),
          1
        );
        success(this.ratingScales);
        this.toaster.success('Your rating scale has been deleted successfully');
      },
      (error: any) => {
        failure();
      }
    );
  }

  createRatingtype(params, success, failure) {
    this.http.post('rating_types', params).subscribe(
      (response: IRatingTypes) => {
        this.allRatingtypes.push(response);
        this.ratingSub.next({ rating: this.allRatingtypes, edit: false });
        success();
        this.toaster.success('Your rating type has been added successfully');
      },
      (error) => {
        failure();
      }
    );
  }

  updateRatingtype(params: IRatingTypes, success, failure) {
    this.http.put(`rating_types/${params.id}`, params).subscribe(
      (response: IRatingTypes) => {
        this.allRatingtypes.forEach((val) => {
          if (val.id === response.id) val.name = response.name;
        });

        this.ratingSub.next({ rating: this.allRatingtypes, edit: true });
        success();
        this.toaster.success('Your rating type has been updated successfully');
      },
      (error) => {
        failure();
      }
    );
  }

  deleteRatingtype(obj: IRatingTypes, success, failure) {
    this.http.delete(`rating_types/${obj.id}`).subscribe(
      (response: IRatingTypes) => {
        const index = this.allRatingtypes.indexOf(obj);
        this.allRatingtypes.splice(index, 1);
        this.ratingSub.next({ rating: this.allRatingtypes, edit: false });
        success();
        this.toaster.success('Your rating type has been deleted successfully');
      },
      (error) => {
        failure();
      }
    );
  }

  getAllRatingType(success, failure) {
    this.http.get('rating_types').subscribe(
      (response: any) => {
        this.allRatingtypes = response;
        success(this.allRatingtypes);
      },
      () => {
        failure();
      }
    );
  }

  getRatingSubTypes(ratingTypeID, rating_scheme_version, success, failure) {
    this.http
      .get('rating_subtypes', {
        params: { ratingTypeID, rating_scheme_version },
      })
      .subscribe(
        (response: any) => {
          success(response);
        },
        () => {
          failure();
        }
      );
  }

  updateRatingScheme(id, version, params, success, failure) {
    this.http
      .post(`rating_schems/${id}/versions/${version}/categories`, params)
      .subscribe(
        (response: IManageRiskRatingsRequest) => {
          const categoryEmit: {
            category: IManageRiskRatingsRequest;
            isSubCategory: boolean;
            isRatings: boolean;
          } = {
            category: response,
            isSubCategory: params[0].category_level === 2 ? true : false,
            isRatings: params[0].category_level === 3 ? true : false,
          };
          this.ratingSchemeSub.next(categoryEmit);
          success();
        },
        () => {
          failure();
        }
      );
  }

  saveRatingCalculationTypeAndScale(payload) {
    return this.http.put('ratingCalculationTypes', payload);
  }

  resetRatingScalesData() {
    this.ratingScales = [];
    this.allRatingtypes = [];
  }
}
