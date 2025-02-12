import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IRatingtypes } from '../rating-types/rating-types.type';

@Injectable({
  providedIn: 'root',
})
export class RatingScalesService {
  constructor(
    private readonly http: HttpClient,
  ) {}

  private ratingScaleDefinition = new Map();

  getRatingScaleDefinition(rating: IRatingtypes, success) {
    this.http
      .get(
        'v2/rating_scales/' +
          rating.rating_scale_id +
          '/versions/' +
          rating.rating_scale_version +
          '/rating_scale_definitions'
      )
      .subscribe(
        (response) => {
          this.ratingScaleDefinition.set(rating.rating_scale_id, response);
          success(response);
        },
        () => {}
      );
  }

  getRatingScaleDefinitionsByRatingScheme(rating_scheme_id: number) {
    return this.http.get('v2/rating_scale_definitions', {
      params: { rating_scheme_id },
    });
  }
}
