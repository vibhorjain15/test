import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class NotificationDataService {
  constructor(private readonly http: HttpClient) {}

  getNotifications(params) {
    return this.http.get('notifications', { params }).pipe(
      tap((response: any) => {
        response.results.forEach(
          (notification) => (notification.unread = !notification.viewTimeStamp)
        );
        return response;
      })
    );
  }

  getUnreadNotificationCount() {
    return this.http.get('notifications/unread_count');
  }

  markAsRead(id: any) {
    return this.http.put(`notifications/${id}`, {});
  }

  markAllAsRead() {
    return this.http.post('notifications/read_all', {});
  }
}
