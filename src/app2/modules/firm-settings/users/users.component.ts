import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { RouterService } from 'src/app2/services/router.service';
import { FirmSettingsService } from '../firm-settings.service';
import { USER_ROLES } from 'src/app2/shared/constants/constant';
import { Select } from '@ngxs/store';
import { UserState } from 'src/app2/store/user/user.state';
import { InviteUserService } from 'src/app2/services/inviteuser.service';
import { finalize, take } from 'rxjs/operators';
import swal from 'sweetalert2/dist/sweetalert2.js';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { GetCurrentUser } from 'src/app2/store/user/user.action';
import { PanelControl } from 'src/app2/shared/components/dv-panel-heading/dv-panel-heading.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css'],
})
export class UsersComponent implements OnInit, OnDestroy {
  loading;
  search_string = '';
  selectedFilter = 'Active';
  userFilter: any = {};
  team_members = [];
  roles;
  current_user;
  is_admin;
  currentFirmId: any;
  refreshUsers: boolean;
  copyOfUsers: any = [];
  access_types: any = [];
  firm_profile: any;
  firmId;
  @Select(UserState.getCurrentUserData) user;
  panelHeadingControls: PanelControl[] = [];
  stateParams: any;
  constructor(
    private readonly http: HttpClient,
    private readonly toaster: ToastrService,
    private readonly SweetAlert: SweetAlertService,
    private readonly ModalFactory: CustomModalService,
    private readonly routerService: RouterService,
    private readonly firmSettingsService: FirmSettingsService,
    private readonly inviteUserService: InviteUserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.user.pipe(take(1)).subscribe((user) => {
      if (user) {
        this.current_user = user;
        this.is_admin = user.isAdmin;
        this.initApis();
        this.setPanelHeadingControls();
      }
    });
  }

  setPanelHeadingControls() {
    this.panelHeadingControls = [
      {
        text: 'New User',
        handleClick: this.openNewUserDialog.bind(this),
        tooltip: 'Add New User',
        leftIcon: 'plus',
      },
    ];
  }

  initApis() {
    this.currentFirmId = this.current_user.firmInfo.id;
    this.refreshUsers = false;
    this.userFilter = {
      All: 'All',
      Inactive: 'Deleted',
      Invited: 'Invited',
      Locked: 'Locked',
      Pending: 'PendingApproval',
      Active: 'Active',
    };
    this.stateParams = this.routerService.getState().params;
    if (this.stateParams['#']) {
      this.selectedFilter = this.stateParams['#'];
    } else {
      this.selectedFilter = this.inviteUserService.getSelectedTab();
    }
    this.firmSettingsService
      .getFirmProfile(this.currentFirmId)
      .subscribe((firm_profile) => (this.firm_profile = firm_profile));
    this.fetchEmployees();
  }

  getAdminCount() {
    if (this.copyOfUsers?.length) {
      return this.copyOfUsers.filter(
        (user) =>
          user.status === this.userFilter.Active &&
          (user.firmwide_role_name.toLowerCase() === USER_ROLES.ADMIN ||
            user.firmwide_role_name.toLowerCase() === USER_ROLES.SECURITYADMIN)
      ).length;
    }
    return 0;
  }

  fetchEmployees() {
    this.loading = true;
    if (this.is_admin) {
      forkJoin([
        this.http.get(`firms/${this.currentFirmId}/users`, {
          params: { include_deleted: 'true' },
        }),
        this.http.get(`firms/${this.currentFirmId}/roles`, {
          params: { include_admins: true },
        }),
      ]).subscribe((responses) => {
        this.copyOfUsers = responses[0];
        this.roles = responses[1];
        this.copyOfUsers.forEach((member) => {
          member.alias = this.getRoleAlias(member);
          member.style = this.getRandomColor(member);
          // user functions
          member.functions.forEach((memberFunction) => {
            const newStrArr = memberFunction.function_name.split('/');
            const firstWord = newStrArr[0].trim();
            let secondWord = null;
            if (newStrArr[1]) {
              secondWord = newStrArr[1].trim();
            }
            memberFunction.tag2 = secondWord
              ? `${firstWord[0]}` + `${secondWord[0]}`
              : firstWord[0];
          });
          if (member.id === this.inviteUserService.getNewUser()?.id) {
            member.is_new = true;
          }
        });
        this.loading = false;
        this.toggleFilter(this.selectedFilter);
        this.scrollToNewAdded();
      });
    }
  }

  toggleFilter(filter_type) {
    this.loading = true;
    this.selectedFilter = filter_type;
    this.routerService.navigateWithParams('app.firm.settings.employees', {
      '#': this.selectedFilter,
    });
    if (filter_type === this.userFilter.Inactive) {
      this.team_members = this.copyOfUsers.filter(
        (member) => member.status === this.userFilter.Inactive
      );
      this.loading = false;
    } else if (filter_type === this.userFilter.Locked) {
      this.team_members = this.copyOfUsers.filter((member) => member.isLocked);
      this.loading = false;
    } else if (filter_type === this.userFilter.Pending) {
      this.team_members = this.copyOfUsers.filter(
        (member) => member.status === this.userFilter.Pending
      );
      this.loading = false;
    } else if (filter_type === this.userFilter.Invited) {
      this.team_members = this.copyOfUsers.filter(
        (member) => member.status === this.userFilter.Invited
      );
      this.loading = false;
    } else if (filter_type === this.userFilter.Active) {
      this.team_members = this.copyOfUsers.filter(
        (member) => member.status === this.userFilter.Active
      );
      this.loading = false;
    } else if (filter_type === this.userFilter.All) {
      this.team_members = JSON.parse(JSON.stringify(this.copyOfUsers));
      this.loading = false;
    }
  }

  changeAccessLevel(user, role, resolve) {
    const params = { ...user };
    params.firmwide_role = role.id;
    this.http
      .put(`user_accesslevels`, params)
      .pipe(finalize(() => resolve()))
      .subscribe((response: any) => {
        this.copyOfUsers = this.copyOfUsers.map((member) => {
          if (member.id === response.id) {
            member.firmwide_role_name = response.firmwide_role_name;
            member.alias = this.getRoleAlias(response);
          }
          return member;
        });
        this.toggleFilter(this.selectedFilter);
        this.toaster.success('Role changed successfully', '', {
          timeOut: 3000,
        });
      });
  }

  goToSelectedEntity(member) {
    if (member.status !== this.userFilter.Inactive) {
      this.routerService.navigateWithParams(
        'app.firm.settings.permission.detail',
        {
          entity_id: member.id,
          entity_type: 'User',
          entity_name: member.fullName,
        }
      );
    }
  }

  displayChangeUserAccessConfirmation(user, role) {
    if (user.id === this.current_user.id) {
      this.toaster.error('Users cannot change role themselves', '', {
        timeOut: 3000,
      });
      return;
    }
    const adminsCount = this.getAdminCount();
    if (
      (user.firmwide_role_name.toLowerCase() === USER_ROLES.ADMIN ||
        user.firmwide_role_name.toLowerCase() === USER_ROLES.SECURITYADMIN) &&
      (adminsCount <= 1 || this.team_members.length === 1)
    ) {
      this.toaster.error(
        'Firm should have at least one admin or security admin',
        '',
        {
          timeOut: 3000,
        }
      );
      return;
    }
    const title = `Are you sure you want to change ${user.fullName}'s role to ${role.alias}?`;
    const text =
      user.status !== this.userFilter.Invited
        ? 'Please request user to logout and login again.'
        : '';
    this.SweetAlert.confirm({
      title,
      text,
      confirmButtonText: 'Confirm',
      focusCancel: false,
      preConfirm: () => {
        return new Promise<void>((resolve) => {
          this.changeAccessLevel(user, role, resolve);
        });
      },
    }).then(() => {
      swal.close();
    });
  }

  displayUserRemovalConfirmation(user) {
    let title: string;
    if (user.id === this.current_user.id) {
      return;
    }
    const adminsCount = this.getAdminCount();
    if (
      (user.firmwide_role_name.toLowerCase() === USER_ROLES.ADMIN ||
        user.firmwide_role_name.toLowerCase() === USER_ROLES.SECURITYADMIN) &&
      adminsCount <= 1
    ) {
      this.toaster.error(
        'Firm should have at least one admin or security admin',
        '',
        { timeOut: 3000 }
      );
      return;
    }
    const is_contact_person =
      user.id ===
      (this.firm_profile.contactPerson != null
        ? this.firm_profile.contactPerson.id
        : undefined);
    if (is_contact_person) {
      title = `${user.fullName} is set as contact person for this firm. Do you still want to remove?`;
    } else {
      title = `Are you sure you want to remove ${user.fullName}?`;
    }
    this.SweetAlert.confirm({
      title,
      text: `This will permanently delete this user's association to all entities, projects, teams and permissions. This cannot be undone.`,
      confirmButtonText: 'Confirm',
      focusCancel: false,
      preConfirm: () => {
        return new Promise<void>((resolve) => {
          this.removeUser(user, is_contact_person, resolve);
        });
      },
    }).then(() => {
      swal.close();
    });
  }

  removeUser(user, is_contact_person: boolean, resolve) {
    const promises = [];
    if (user.accessLevel === 'Invited') {
      promises.push(user.remove());
    } else {
      promises.push(this.http.delete(`users/${user.id}`));
    }
    if (is_contact_person) {
      promises.push(this.clearContactPerson());
    }
    forkJoin(promises)
      .pipe(finalize(() => resolve()))
      .subscribe(() => {
        const msg = `${user.fullName} deleted successfully!`;
        this.toaster.success(msg, '', { timeOut: 5000 });
        this.fetchEmployees();
      });
  }

  clearContactPerson() {
    this.firm_profile.contactPerson = null;
    this.firmSettingsService
      .saveFirmProfile(this.currentFirmId, this.firm_profile)
      .subscribe();
  }

  openNewUserDialog() {
    this.ModalFactory.invoke('new-user', {
      initialState: {
        existing_user: false,
        newUser: (new_user) => {
          new_user.alias = this.getRoleAlias(new_user);
          new_user.is_new = true;
          this.copyOfUsers.push(new_user);
          this.toggleFilter(this.selectedFilter);
          this.scrollToNewAdded();
        },
      },
    });
  }

  updateUserCopy(user) {
    const userIndex = this.copyOfUsers.findIndex(
      (userCopy) => userCopy.id === user.id
    );
    if (userIndex > -1) {
      this.copyOfUsers[userIndex] = user;
    }
  }

  unlockUser(user) {
    this.firmSettingsService.unlockUser(user.userName).subscribe((response) => {
      if (!!response) {
        user.lockoutEndDateUtc = null;
        user.isLocked = false;
        user.status = this.userFilter.Active;
        this.toaster.success('User successfully unlocked!', '', {
          timeOut: 5000,
        });
        this.updateUserCopy(user);
        this.toggleFilter(this.selectedFilter);
      }
    });
  }

  approveUser(user) {
    user.loading = true;
    const params = { id: user.id };
    this.http.put(`users/approve`, params).subscribe((response: any) => {
      this.toaster.success('User successfully approved!', '', {
        timeOut: 5000,
      });
      user.status = this.userFilter.Active;
      user.approved_by = response.approved_by;
      user.approved_at = response.approved_at;
      user.loading = false;
      this.updateUserCopy(user);
      this.toggleFilter(this.selectedFilter);
    });
  }

  getRandomColor(member) {
    const lum = -0.25;
    let hex = String(
      '#' + Math.random().toString(16).slice(2, 8).toUpperCase()
    ).replace(/[^0-9a-f]/gi, '');
    if (hex.length < 6) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    let rgb = '#';
    let c = undefined;
    let i = undefined;
    i = 0;
    while (i < 3) {
      c = parseInt(hex.substr(i * 2, 2), 16);
      c = Math.round(Math.min(Math.max(0, c + c * lum), 255)).toString(16);
      rgb += ('00' + c).substr(c.length);
      i++;
    }
    return { 'background-color': rgb };
  }

  resendActivation(user) {
    const user_clone = { ...user };
    user.loading = true;
    this.http
      .put(`users/resend_activation`, user_clone)
      .subscribe((response: any) => {
        this.toaster.success(`Activation link resent to ${user.fullName}`, '', {
          timeOut: 5000,
        });
        user.loading = false;
      });
  }

  getRoleAlias(role) {
    return (
      this.roles.find(
        (roleItem) =>
          roleItem.name.toLowerCase() === role.firmwide_role_name.toLowerCase()
      )?.alias ?? 'Deleted Role'
    );
  }

  navigateToUserRolesMap() {
    window.open('/#/app/settings/access-level-map');
  }

  scrollToNewAdded() {
    let userId = null;
    this.team_members.map((val) => {
      if (val.is_new) {
        userId = val.id + val.firm_id;
        val.is_new = false;
      }
    });
    if (userId) {
      setTimeout(() => {
        const findPosition = (obj): any => {
          var currenttop = 0;
          if (obj?.offsetParent) {
            do {
              currenttop += obj.offsetTop;
            } while ((obj = obj?.offsetParent));
            return [currenttop - 200];
          }
        };
        window.scrollTo(0, findPosition(document.getElementById(userId)));
        setTimeout(() => {
          const element = document.getElementById(userId);
          element.style.background = '';
          element.style.transition = 'background 1s linear';
        }, 2000);
        document.getElementById(userId).style.background = '#fffac7';
      }, 2500);
    }
  }

  ngOnDestroy() {
    this.inviteUserService.setSelectedTab('Active');
    this.router.navigate([], {
      queryParamsHandling: 'preserve',
      preserveFragment: false,
    });
  }
}
