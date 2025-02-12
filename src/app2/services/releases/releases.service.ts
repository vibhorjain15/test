import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { IReleaseDetail } from 'src/app2/shared/models/releases.model';

@Injectable({
  providedIn: 'root',
})
export class ReleasesService {
  releases: Array<IReleaseDetail> = [];

  constructor(private readonly http: HttpClient) {}

  getReleases(): Observable<Array<IReleaseDetail>> {
    return this.http
      .get<Array<IReleaseDetail>>('releasenotes')
      .pipe(tap((response) => (this.releases = response)));
  }

  add(releaseNote: IReleaseDetail): Observable<IReleaseDetail> {
    return this.http.post<IReleaseDetail>(`releasenotes`, releaseNote);
  }

  update(id: number, releaseNote: IReleaseDetail): Observable<IReleaseDetail> {
    return this.http.put<IReleaseDetail>(`releasenotes/${id}`, releaseNote);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`releasenotes/${id}`);
  }

  postViews(id: number) {
    return this.http.post(`releasenotes/${id}/views`, {});
  }
}
