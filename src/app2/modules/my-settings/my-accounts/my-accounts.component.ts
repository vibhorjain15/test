import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import swal from 'sweetalert2/dist/sweetalert2.js';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { AuthService } from 'src/app2/services/auth.service';
import {
  getCellClassRules,
  MyAccountsGridService,
} from './my-accounts-grid.service';
import {
  defaultColumn,
  grid_widths_map,
} from 'src/app2/shared/constants/constant';
import { Select, Store } from '@ngxs/store';
import { UserState } from 'src/app2/store/user/user.state';
import { finalize, take } from 'rxjs/operators';
import { SetDefaultColumnDef } from 'src/app2/store/grid/grid.action';
import { UserService } from 'src/app2/services/user.service';
import { ResetStoreService } from 'src/app2/services/reset-store.service';
import { UtilsService } from 'src/app2/services/utils.service';
import {
  GetAiPromptFlag,
  GetCurrentUser,
  GetSubscriptionLimit,
  UpdateCurrentUser,
} from 'src/app2/store/user/user.action';
import { MenubarService } from 'src/app2/services/menubar.service';

@Component({
  selector: 'app-my-accounts',
  templateUrl: './my-accounts.component.html',
  styleUrls: ['./my-accounts.component.css'],
})
export class MyAccountsComponent implements OnInit, OnDestroy {
  loading;
  current_user;
  firmSwitching;
  selectedFirm;
  myAccountsData;
  currentFirmId: any;
  user: any;
  allUsers: any[];
  columnDefs;
  @Select(UserState.getCurrentUserData) user$;
  gridName = 'my-accounts';
  userSub;

  constructor(
    private readonly SweetAlert: SweetAlertService,
    private readonly http: HttpClient,
    private readonly toaster: ToastrService,
    private readonly AuthService: AuthService,
    private readonly myAccountsGridService: MyAccountsGridService,
    private readonly store: Store,
    private readonly UserService: UserService,
    private readonly ResetStoreService: ResetStoreService,
    private readonly Utils: UtilsService,
    private readonly menu: MenubarService
  ) {}

  ngOnDestroy() {
    this.userSub.unsubscribe();
  }
  ngOnInit(): void {
    this.userSub = this.user$.pipe(take(1)).subscribe((user) => {
      if (user) {
        this.current_user = JSON.parse(JSON.stringify(user));
        this.currentFirmId = this.current_user.firmInfo.id;
        this.getMyAccountsData();
      }
    });
    let defaultColumnDef = this.myAccountsGridService.getMyAccountsGridColDef();
    defaultColumnDef = [
      {
        ...defaultColumn,
        sortable: false,
        colId: 'action',
        headerName: 'Action',
        field: 'action',
        cellRenderer: 'myAccountsActionsCellRenderer',
        minWidth: grid_widths_map.sm_column_xm,
        cellRendererParams: {
          clickedCheckSamlConnection: (field) => {
            this.checkSamlConnection(field.data.account);
          },
          clickedActivateFirmAccess: (field) => {
            this.activateFirmAccess(field.data.account);
          },
          clickedRequestApproval: (field) => {
            this.requestApproval(field.data.account);
          },
        },
        headerClass: 'my-permission-cursor-pointer',
        resizable: false,
        suppressHeaderMenuButton: true,
        suppressAutoSize: true,
        cellClassRules: getCellClassRules,
      },
      ...defaultColumnDef,
    ];
    this.store.dispatch(
      new SetDefaultColumnDef({ [this.gridName]: defaultColumnDef })
    );
    this.selectedFirm = {};
    this.user = { grant_type: 'password' };
    this.allUsers = [];
    this.firmSwitching = false;
  }

  goBack() {
    window.history.back();
  }

  getMyAccountsData() {
    this.loading = true;
    this.myAccountsGridService
      .getMyAccountsGridRowData(this.current_user.id)
      .subscribe((response) => {
        this.myAccountsData = response.map((data) => ({
          ...data,
          current_user: this.current_user,
        }));
        this.loading = false;
      });
  }

  removeFirmAccess(entity) {
    this.SweetAlert.confirm({
      title: 'Are you sure you want to delete this firm?',
      confirmButtonText: 'Yes Please',
      showLoaderOnConfirm: true,
      preConfirm: () => {
        return new Promise<void>((resolve) => {
          this.removeFirmAccessOnConfirm(entity, resolve);
        });
      },
    }).then(() => {
      swal.close();
    });
  }

  removeFirmAccessOnConfirm(entity, resolve) {
    this.http
      .delete(`users/${entity.id}/associated_firms/${entity.firm_id}`)
      .pipe(finalize(() => resolve()))
      .subscribe((response: any) => {
        this.toaster.success('Firm Association Removed');
        this.getMyAccountsData();
      });
  }

  switchToFirmAccount(entity) {
    this.current_user = this.Utils.getCurrentUser();
    this.currentFirmId = this.current_user.firmInfo.id;
    if (entity.status === 'Active' && this.currentFirmId !== entity.firm_id) {
      this.firmSwitching = true;
      this.UserService.getCurrentUserProfile().subscribe(() => {
        // calling API as to avoid sending the expired JWT token as API call will update the token in LocalStorage if expired.
        this.selectedFirm = entity;
        this.user.userName = entity.userName;
        const params = { ...this.user };
        params.username = params.userName;
        params.jwt = window.localStorage.getItem('jwt');
        params.firm_id = entity.firm_id;
        params.client_id = 'DvApp';
        delete params.userName;
        delete params.password;
        this.AuthService.loginNew(params)
          .then((response) => {
            if (localStorage) {
              localStorage.setItem('dv_refresh_token', response.refresh_token);
              localStorage.setItem('jwt', response.jwt);
              this.handleFirmLoginSuccess();
            }
          })
          .catch((error) => {
            this.handleFirmSwitchFailure();
          });
      });
    }
  }

  handleFirmSwitchFailure() {
    this.toaster.error('Something went wrong, Please try again!');
    this.firmSwitching = false;
  }

  checkSamlConnection(entity) {
    this.http
      .get('saml/login', {
        params: { email: entity.userName, firm_id: entity.firm_id },
      })
      .subscribe(
        (response: any) => {
          if (response.saml_enabled === false) {
            this.switchToFirmAccount(entity);
          } else {
            this.toaster.info('Please wait..');
            const { url } = response;
            if (url) {
              Promise.resolve().then(() => {
                localStorage.removeItem('dv_access_token');
                localStorage != null
                  ? localStorage.removeItem('dv_refresh_token')
                  : undefined;
              });
              open(url, '_self');
            }
          }
        },
        (error: any) => {
          this.loading = false;
        }
      );
  }

  handleFirmLoginSuccess() {
    this.ResetStoreService.ResetStoreData();
    this.switchFirm();
  }

  switchFirm() {
    this.store
      .dispatch([new GetCurrentUser(), new GetSubscriptionLimit()])
      .subscribe((userData) => {
        let { currentUser } = userData[0].user;
        let { subscriptionLimits } = userData[1].user;
        this.current_user = currentUser;
        if (subscriptionLimits?.length) {
          let entity_type = this.Utils.getEntityType(subscriptionLimits[0]);
          this.Utils.currentUser = currentUser;
          this.menu.updateGrandMap(this.Utils.getGrantMap(currentUser));
          this.menu.updateAllMenuItem(entity_type);
        }
        this.myAccountsData = null;
        this.store.dispatch(new GetAiPromptFlag());
        // Dummy call
        this.store.dispatch(new UpdateCurrentUser(this.current_user));
        this.getMyAccountsData();
        this.firmSwitching = false;
        this.ngOnInit();
      });
  }

  requestApproval(entity) {
    const params = { id: entity.id };
    this.http.put('users/approve', params).subscribe((response: any) => {
      this.toaster.success('User successfully approved!');
      this.getMyAccountsData();
    });
  }

  activateFirmAccess(entity) {
    const user_clone = { ...entity };
    this.http
      .put('users/resend_activation', user_clone)
      .subscribe((response: any) => {
        this.toaster.success('Activation link resent');
        this.getMyAccountsData();
      });
  }
}
