import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

import { IBannerDetail } from 'src/app2/shared/models/banners.model';

@Injectable({
  providedIn: 'root',
})
export class BannersService {
  banners: Array<IBannerDetail> = [];

  constructor(private readonly http: HttpClient) {}

  getBanners(): Observable<Array<IBannerDetail>> {
    return this.http
      .get<Array<IBannerDetail>>('banner_configuration')
      .pipe(tap((response) => (this.banners = response)));
  }

  add(banner: IBannerDetail): Observable<IBannerDetail> {
    return this.http.post<IBannerDetail>(`banner_configuration`, banner);
  }

  update(id: number, banner: IBannerDetail): Observable<IBannerDetail> {
    return this.http.put<IBannerDetail>(`banner_configuration/${id}`, banner);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`banner_configuration/${id}`);
  }
}
