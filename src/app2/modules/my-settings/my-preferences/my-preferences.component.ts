import { ToastrService } from 'ngx-toastr';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { take, tap } from 'rxjs/operators';
import * as angular from 'angular';
import { UserState } from 'src/app2/store/user/user.state';
import { Select, Store } from '@ngxs/store';
import { GetCurrentUser } from 'src/app2/store/user/user.action';

enum DashType {
  DEFAULT = 'default',
  MY_WORK = 'my_work',
}
@Component({
  selector: 'my-preferences',
  templateUrl: './my-preferences.component.html',
  styleUrls: ['./my-preferences.component.css'],
})
export class MyPreferencesComponent implements OnInit {
  @Select(UserState.getCurrentUserData) user$;
  current_dash;
  DashType = DashType;
  notification_settings;
  constructor(
    private readonly store: Store,
    private readonly http: HttpClient,
    private readonly toastr: ToastrService
  ) {}
  ngOnInit(): void {
    this.user$
      .pipe(
        take(2),
        tap((userData) => {
          if (!userData) {
            this.store.dispatch(new GetCurrentUser());
          }
        })
      )
      .subscribe((user) => {
        if (user) {
          this.http.get(`user_notification_settings`).subscribe((response) => {
            this.notification_settings = response;
            this.current_dash = this.notification_settings.home_page;
          });
        }
      });
  }

  updateDashPref(type) {
    this.notification_settings.home_page = type;
    this.http
      .put(`user_notification_settings`, this.notification_settings)
      .subscribe(() => {
        this.toastr.success('Your Preference have been updated!');
      });
  }
}
