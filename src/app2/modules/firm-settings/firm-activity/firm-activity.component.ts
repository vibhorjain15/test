import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { UserState } from 'src/app2/store/user/user.state';
import { Select, Store } from '@ngxs/store';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-firm-activity',
  templateUrl: './firm-activity.component.html',
  styleUrls: ['./firm-activity.component.css'],
})
export class FirmActivityComponent implements OnInit {
  @Select(UserState.getCurrentUserData) user;
  @Select(UserState.getLanguageCodeData) languageCode;
  activity;
  upgradeNeeded;
  is_manager;
  is_freeSubscripton;
  FTupgradeNeeded;
  entity_count;
  LTupgradeNeeded;
  is_freeSubscription: boolean;

  constructor(
    private readonly http: HttpClient,
    public translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.user.pipe(take(1))
      .subscribe((data) => {
        if (data) {
          this.is_manager = data.isManager;
        }
      });

    this.upgradeNeeded = 0;
    this.entity_count = 0;
    this.FTupgradeNeeded = 0;
    this.LTupgradeNeeded = 0;
    this.http.get('platform_activity').subscribe((response: any) => {
      this.activity = response;
      this.entity_count =
        this.activity.fulltouch_count + this.activity.lighttouch_count;
      if (
        this.activity.ft_limit &&
        (this.entity_count * 100) / this.activity.ft_limit > 80
      ) {
        this.FTupgradeNeeded = 1;
      }
      if (
        this.activity.ft_limit &&
        (this.activity.fulltouch_count * 100) / this.activity.ft_limit > 80
      ) {
        this.FTupgradeNeeded = 1;
      }
      if (
        this.activity.lt_limit &&
        (this.activity.lighttouch_count * 100) / this.activity.lt_limit > 80
      ) {
        this.LTupgradeNeeded = 1;
      }
      if (
        this.activity.request_limit &&
        (this.activity.projects_count * 100) / this.activity.request_limit > 80
      ) {
        this.upgradeNeeded = 1;
      }
    });
  }
}

