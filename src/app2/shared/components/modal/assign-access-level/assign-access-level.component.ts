import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { sortByFirstNames } from '../../dv-selector-list/dv-selector.util';
import { ToastrService } from 'ngx-toastr';
import { AccessLevelDataService } from 'src/app2/services/access-level.service';
import { Store } from '@ngxs/store';
@Component({
  selector: 'assign-access-level',
  templateUrl: './assign-access-level.component.html',
  styleUrls: ['./assign-access-level.component.css'],
})
export class AssignAccessLevelModal implements OnInit {
  @Input() role: any;
  @Input() gridData: any;
  @Input() onAccessLevelAssigned;
  @ViewChild('assignAccessLevelForm') assignAccessLevelForm: NgForm;
  assigningAccessLevel; //loader
  team_members: any = [];
  teamSelectorDisplayParams: { id: string; name: string }; //used in app-dv-selector-list
  selectedUser: any = [];
  firmId: any;
  accessLevelName: any; // role_name
  fitlerByRoleList: any = [];
  team_members_copy: any = [];
  assignedUsers: any;
  currentUser: any;
  searchText: any;
  selectedRoleForFilter: any;
  reloading: boolean = false;
  constructor(
    private readonly store: Store,
    private readonly toastr: ToastrService,
    private readonly accessLevelDataService: AccessLevelDataService
  ) {}

  ngOnInit() {
    this.currentUser = this.store.selectSnapshot(
      (state) => state.user.currentUser
    );
    this.firmId = this.currentUser.firmInfo.id;
    this.accessLevelName = this.role.alias;
    this.teamSelectorDisplayParams = {
      id: 'id',
      name: 'fullName',
    };
    this.updateEmployeesList();
    this.updateRoleListForFilter();
  }

  updateEmployeesList() {
    this.reloading = true;
    //get employees list calling getemployeesListAPI()
    this.accessLevelDataService.getEmployeesAPI(this.firmId).subscribe(
      (response: any) => {
        this.reloading = false;
        this.team_members = response;
        this.team_members = this.team_members.sort(sortByFirstNames);
        this.assignedUsers = this.team_members.filter((member: any) => {
          return member.firmwide_role == this.role.id;
        });
        this.team_members = this.team_members.filter((member: any) => {
          return (
            member.id != this.currentUser.id &&
            member.firmwide_role != this.role.id
          );
        });
        this.team_members_copy = [...this.team_members];
      },
      (err: any) => {}
    );
  }
  updateRoleListForFilter() {
    this.fitlerByRoleList = this.gridData.filter(
      (role) => this.role.id != role.id
    );
  }
  handleOnChangeEntity(selectedUser) {
    // user selection handler
    this.selectedUser = selectedUser;
  }
  applyFilter() {
    this.reloading = true;
    this.team_members = this.team_members_copy;
    if (this.selectedRoleForFilter) {
      if (this.selectedRoleForFilter && this.selectedRoleForFilter.id) {
        this.team_members = this.team_members.filter((member: any) => {
          return (
            member.id != this.currentUser.id &&
            member.firmwide_role != this.role.id &&
            member.firmwide_role == this.selectedRoleForFilter.id
          );
        });
      }
    }
    if (this.searchText) {
      this.team_members = this.team_members.filter((member: any) => {
        return (
          member.id != this.currentUser.id &&
          member.firmwide_role != this.role.id &&
          member.fullName.toLowerCase().includes(this.searchText.toLowerCase())
        );
      });
    }
    this.reloading = false;
  }
  onSelectFilterByRole(selectedRoleForFilter) {
    this.selectedRoleForFilter = selectedRoleForFilter;
    this.applyFilter();
  }
  onSearchChange(searchText) {
    this.searchText = searchText;
    this.applyFilter();
  }
  assignAccessLevel(closeModal) {
    // assigning role to user calling assignAccessLevelsAPI()
    let user_ids = [];
    this.selectedUser.forEach((user) => {
      user_ids.push(user.id);
    });
    let payload = {
      user_ids: user_ids,
      role_id: this.role.id,
    };

    this.assigningAccessLevel = true;
    this.accessLevelDataService.assignAccessLevelsAPI(payload).subscribe(
      (res: any) => {
        this.onAccessLevelAssigned(this.selectedUser);
        this.toastr.success('Successfully assigned access level');
        this.assigningAccessLevel = false;
        closeModal();
      },
      (err: any) => {
        this.toastr.error('Something wrong with the assigning API');
        this.assigningAccessLevel = false;
        closeModal();
      }
    );
  }

  handleCancelClick(closeModal) {
    //close modal callback()
    closeModal();
  }
}
