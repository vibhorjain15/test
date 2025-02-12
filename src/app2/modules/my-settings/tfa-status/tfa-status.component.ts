import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import { finalize, take } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { RouterService } from 'src/app2/services/router.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { UserState } from 'src/app2/store/user/user.state';
import { Select, Store } from '@ngxs/store';
import { UpdateCurrentUser } from 'src/app2/store/user/user.action';

@Component({
  selector: 'app-tfa-status',
  templateUrl: './tfa-status.component.html',
  styleUrls: ['./tfa-status.component.css'],
})
export class TfaStatusComponent implements OnInit {
  currentUser;
  @Select(UserState.getCurrentUserData) user$;

  constructor(
    private readonly routerService: RouterService,
    private readonly sweetAlertService: SweetAlertService,
    private readonly http: HttpClient,
    private readonly toastr: ToastrService,
    private readonly store: Store
  ) {}

  ngOnInit(): void {
    this.user$
      .pipe(
        take(1),
      )
      .subscribe((user) => {
        if (user) {
          this.currentUser = JSON.parse(JSON.stringify(user));
        }
      });
  }

  disable2FA() {
    this.sweetAlertService.confirm({
      title: 'Are you sure you want to disable two factor authentication ?',
      confirmButtonText: 'Yes',
      focusCancel: true,
      showLoaderOnConfirm: true,
      preConfirm: () => {
        this.http
          .post(`two_factor_authentication/disable`, {})
          .pipe(
            finalize(() => {
              Swal.close();
            })
          )
          .subscribe(() => {
            this.toastr.success(
              'Two factor authentication is successfully disabled'
            );
            this.currentUser.twoFactorEnabled = false;
            this.store.dispatch(new UpdateCurrentUser(this.currentUser));
          });
      },
    });
  }

  navigateToIntro(): void {
    this.routerService.navigate(
      'app.settings.security.two_factor_authentication.intro'
    );
  }
}

