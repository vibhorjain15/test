import { Component, OnInit } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { take, tap } from 'rxjs/operators';
import { GetCurrentUser } from 'src/app2/store/user/user.action';
import { UserState } from 'src/app2/store/user/user.state';
@Component({
  selector: 'app-dashboard-view',
  templateUrl: './dashboard-container.component.html'
})
export class DashboardViewComponent implements OnInit {
  @Select(UserState.getCurrentUserData) user;
  is_investor: any;
  constructor(private readonly store: Store) {}
  ngOnInit() {
    this.user
    .pipe(
      take(2),
      tap((userData) => {
        if (!userData) {
          this.store.dispatch(new GetCurrentUser());
        }
      })
    )
    .subscribe((data) => {
      if (data) {
        this.is_investor = data.isInvestor;
      }
    });
  }
}
