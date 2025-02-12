import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, shareReplay, tap } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { of } from 'rxjs';
import { Definition } from 'src/app2/shared/models/review-definitions.model';
import { SweetAlertService } from '../sweet-alert.service';
import { UtilsService } from '../utils.service';

@Injectable({
  providedIn: 'root',
})
export class ReviewDefinitionsService {
  definitions: Definition[];
  activeId: number;
  cachedReviewFilters: any;
  constructor(
    private readonly http: HttpClient,
    private readonly toaster: ToastrService,
    private readonly SweetAlert: SweetAlertService,
    private readonly utils: UtilsService
  ) {}

  getDefinitions() {
    return this.http.get(`review_definitions`);
  }

  updateDefinitions(definitions) {
    this.definitions = definitions;
  }

  fetchDefinitionById(id) {
    return this.http.get(`review_definitions/${id}`);
  }

  getReviewFilters() {
    if (this.cachedReviewFilters) {
      return of(this.cachedReviewFilters);
    } else {
      return this.http.get('review_filters').pipe(
        map((filter: any) => {
          filter = filter.filter((x) => {
            if (this.utils.isManager()) return x.id !== 3;
            else return true;
          });
          return filter;
        }),
        tap((filter: any) => {
          this.cachedReviewFilters = filter;
        }),
        shareReplay(1)
      );
    }
  }
  /*
   * Function to delete definitions
   * It accepts whole definition object as parameter
   */
  deleteReviewDefinition(definition) {
    return this.http.delete(`review_definitions/${definition.id}`).pipe(
      tap((res) => {
        this.toaster.success('Deleted successfully');
        if (this.definitions)
          this.definitions = this.definitions.filter(
            (def) => def.id !== definition.id
          );
      })
    );
  }

  updateDefinition(definition) {
    return this.http.put(`review_definitions/${definition.id}`, definition);
  }

  addDefinition(definition) {
    return this.http.post('review_definitions', definition).pipe(
      tap((res: Definition) => {
        this.definitions.push(res);
      })
    );
  }

  confirmReviewDefinitionDeletion(definition: any, callback) {
    const title = `Are you sure you want to delete ${definition.name} definition?`;
    const text =
      'This will not affect any in-progress reviews with the definition';
    this.SweetAlert.confirm({
      title,
      text,
      confirmButtonText: 'Yes, Delete',
      focusCancel: true,
      showLoaderOnConfirm: true,
      preConfirm: () => {
        this.deleteReviewDefinition(definition).subscribe((res) => {
          this.SweetAlert.close();
          callback();
        });
      },
    });
  }
}
