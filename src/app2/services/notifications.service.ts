import { Injectable } from '@angular/core';
import { NotificationDataService } from './notification-data.service';

@Injectable({
  providedIn: 'root',
})
export class NotificationsService {
  callbacks;
  interval_id: NodeJS.Timeout;
  constructor(
    private readonly NotificationDataService: NotificationDataService
  ) {
    this.callbacks = [];
  }

  onload(callback) {
    this.callbacks.push(callback);
  }

  startPolling() {
    this.stopPolling();
    this.getUnreadNotificationCount();
    this.interval_id = setTimeout(() => {
      this.getUnreadNotificationCount();
    }, 1200 * 1000); //1200 seconds / 2 mins
  }

  getUnreadNotificationCount() {
    this.NotificationDataService.getUnreadNotificationCount().subscribe(
      (response: any) => {
        this.invokeCallbacks(response);
        return response;
      }
    );
  }

  invokeCallbacks(response) {
    this.callbacks.forEach((callback) => callback(response));
  }

  stopPolling() {
    if (this.interval_id) {
      clearInterval(this.interval_id);
    }
  }
}
