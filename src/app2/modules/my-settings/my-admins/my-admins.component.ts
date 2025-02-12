import { Component, OnInit } from '@angular/core';
import { MyAdminsGridService } from './my-admins-grid.service';
import { Select, Store } from '@ngxs/store';
import { UserState } from 'src/app2/store/user/user.state';
import { SetDefaultColumnDef } from 'src/app2/store/grid/grid.action';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-my-admins',
  templateUrl: './my-admins.component.html',
  styleUrls: ['./my-admins.component.css'],
})
export class MyAdminsComponent implements OnInit {
  loading;
  current_user;
  myAdminsData;
  columnDefs;
  @Select(UserState.getCurrentUserData) user$;
  gridName = 'my-admins';

  constructor(
    private readonly myAdminsGridService: MyAdminsGridService,
    private readonly store: Store
  ) {}

  ngOnInit(): void {
    this.user$
      .pipe(
        take(1),
      )
      .subscribe((user) => {
        if (user) {
          this.current_user = JSON.parse(JSON.stringify(user));
        }
      });
    const defaultColumnDef =
      this.myAdminsGridService.getMyPermissionGridColDef();
    this.store.dispatch(
      new SetDefaultColumnDef({ [this.gridName]: defaultColumnDef })
    );
    this.getMyAdmins();
  }

  goBack() {
    window.history.back();
  }

  getMyAdmins() {
    this.loading = true;
    this.myAdminsData = null;
    this.myAdminsGridService
      .getMyPermissionGridRowData()
      .subscribe((response) => {
        this.myAdminsData = response;
        this.loading = false;
      });
  }

  gotoRolesMap() {
    window.open('/#/app/settings/access-level-map');
  }
}

