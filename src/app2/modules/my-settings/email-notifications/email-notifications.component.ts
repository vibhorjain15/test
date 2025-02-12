import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-email-notifications',
  templateUrl: './email-notifications.component.html',
  styleUrls: ['./email-notifications.component.css'],
})
export class EmailNotificationsComponent implements OnInit {
  notification_settings;
  saving: boolean;
  firstProperty = '';

  constructor(
    private readonly http: HttpClient,
    private readonly toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.http.get(`user_notification_settings`).subscribe((response) => {
      this.notification_settings = response;
      this.firstProperty = Object.keys(
        this.notification_settings.descriptions
      )[0];
    });
  }

  submit() {
    this.saving = true;
    this.http
      .put(`user_notification_settings`, this.notification_settings)
      .pipe(
        finalize(() => {
          this.saving = false;
        })
      )
      .subscribe(() => {
        this.toastr.success('Your settings have been updated!');
      });
  }
}

