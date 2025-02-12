import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { IRatingSchemeService } from './rating-schemes.type';

@Injectable({
  providedIn: 'root',
})
export class RatingSchemesService {
  constructor(
    private readonly http: HttpClient,
    private readonly toaster: ToastrService
  ) {}

  private localRatingScoreAnalysis = new Map();
  getRatingScoreAnalysis(id, params, success) {
    this.http
      .post(`rating_schemes/${id}/rating_scores_analysis`, params)
      .subscribe((response: IRatingSchemeService[]) => {
        this.localRatingScoreAnalysis.set(id, response);
        success(response);
      });
  }
}
