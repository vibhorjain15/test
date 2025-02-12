import { Component, OnInit } from '@angular/core';
import { Select } from '@ngxs/store';
import { take } from 'rxjs/operators';
import { UserState } from 'src/app2/store/user/user.state';

@Component({
  selector: 'app-user-roles',
  templateUrl: './user-roles.component.html',
  styleUrls: ['./user-roles.component.css'],
})
export class UserRolesComponent implements OnInit {
  isInvestor;
  is_admin: any;
  current_user: any;
  hasFirmWideRole: any;
  currentFirmId: any;
  @Select(UserState.getCurrentUserData) user$;

  constructor() {}

  ngOnInit() {
    this.user$
      .pipe(
        take(1),
      )
      .subscribe((user) => {
        if (user) {
          this.current_user = JSON.parse(JSON.stringify(user));
          this.currentFirmId = this.current_user.firmInfo.id;
          this.is_admin = this.current_user.isAdmin;
          this.isInvestor = this.current_user.isInvestor;
          this.hasFirmWideRole = this.current_user.hasFirmWideRole;
        }
      });
  }
}

