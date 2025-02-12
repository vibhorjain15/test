import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { DownloadStatus } from '../shared/constants/constant';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  downloadStatus = DownloadStatus;
  constructor(private readonly http: HttpClient) {}
  getCurrentUser() {
    return this.http.get('account');
  }

  getCurrentUserProfile() {
    return this.http.get('users/my-profile');
  }

  getUserDownloads(params) {
    return this.http
      .get(`service/dvapi_service/task_file_list`, {
        params: params,
      })
      .pipe(
        map((download: any) =>
          download.map((resource) => {
            let filename;
            if (resource.status == this.downloadStatus.success) {
              filename = resource.file_data?.reduce(
                (previousValue, currentValue, idx) => {
                  return idx == 0
                    ? currentValue.file_name
                    : previousValue + ', ' + currentValue.file_name;
                },
                ''
              );
            } else if (resource.status == this.downloadStatus.started) {
              filename = '(processing download)';
            } else {
              filename = '(download failed)';
            }
            return {
              file_data: resource.file_data,
              filename: filename,
              expiry_date: resource.expiry_date,
              downloaded_on: resource.downloaded_at
                ? resource.downloaded_at
                : null,
              task_id: resource.task_id,
              status: resource.status,
              requested_on: resource.insert_time_stamp,
              task_name: resource.task_name,
              expired: resource.expired,
              is_downloadable: resource.is_downloadable,
            };
          })
        )
      );
  }

  skipTour() {
    return this.http.put('users/skip_tour', { skip_tour: true });
  }
}
