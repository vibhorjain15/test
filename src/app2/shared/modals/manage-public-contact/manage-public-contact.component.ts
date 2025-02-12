import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { Select } from '@ngxs/store';
import { ToastrService } from 'ngx-toastr';
import { forkJoin } from 'rxjs';
import { finalize, take } from 'rxjs/operators';
import { UserState } from 'src/app2/store/user/user.state';
import { USER_ROLES } from '../../constants/constant';

@Component({
  selector: 'app-manage-public-contact',
  templateUrl: './manage-public-contact.component.html',
  styleUrls: ['./manage-public-contact.component.css'],
})
export class ManagePublicContactComponent implements OnInit {
  @Input() contact: any;
  @Input() existing_contacts: any;
  @Input() entity_details: any;
  @Input() entity_type: any;
  @Input() source: any;
  @Input() success: Function;

  params: any = {};
  idsOfExistingMembers = [];
  edit_mode: boolean;
  departments: any;
  is_primary: boolean;
  membersObject: any = {};
  teamSelectorDisplayParams: { id: string; name: string };
  current_user: any;
  Utils: any;
  hasFirmWideRole: any;
  currentFirmId: any;
  copy_of_team_members: any = [];
  loading_data = true;
  USER_ROLES = USER_ROLES;
  saving: boolean;
  team_members: any = [];
  departmentsControl = new FormControl(null, Validators.required);
  @Select(UserState.getCurrentUserData) user$;
  constructor(
    private httpClient: HttpClient,
    private toaster: ToastrService,
  ) {}

  ngOnInit(): void {
    this.user$
      .pipe(
        take(1),
      )
      .subscribe((user) => {
        if (user) {
          this.current_user = user;
          this.hasFirmWideRole = user.hasFirmWideRole;
          this.initialize();
        }
      });
  }

  initialize() {
    // initialize empty params
    this.idsOfExistingMembers = [];
    this.edit_mode = this.contact ? true : false;
    this.departments = [];
    if (this.existing_contacts) {
      this.idsOfExistingMembers = this.existing_contacts.map((x) => x.id);
    }

    this.is_primary = false;
    this.membersObject = {
      memberNames: [],
    };
    this.teamSelectorDisplayParams = {
      id: 'id',
      name: 'fullName',
    };
    this.params.departments = [];

    this.currentFirmId = this.current_user.firmInfo.id;

    const promises = [];
    promises.push(this.getTeamMembers());
    promises.push(this.getDepartments());
    forkJoin(promises)
      .pipe(finalize(() => (this.loading_data = false)))
      .subscribe(([teamMembers, departments]) => {
        this.team_members = (teamMembers as []).filter(
          (user: any) =>
            user.firmwide_role_name.toLowerCase() !==
            this.USER_ROLES.SECURITYADMIN
        );
        this.copy_of_team_members = JSON.parse(
          JSON.stringify(this.team_members)
        );
        if (this.idsOfExistingMembers.length) {
          this.team_members = this.copy_of_team_members.filter(
            (member: any) => this.idsOfExistingMembers.indexOf(member.id) === -1
          );
        }
        if (this.contact) {
          if (this.contact.is_primary) {
            this.is_primary = true;
          }
          if (this.contact?.internal_tags) {
            for (const department of departments as Array<any>) {
              if (this.contact?.internal_tags?.indexOf(department.text) > -1) {
                this.params.departments.push(department.id);
              }
            }
            this.departmentsControl?.setValue(this.params.departments);
          }
        }
        this.departments = departments;
      });
  }

  getDepartments() {
    return this.httpClient.get('internalContactTypes');
  }

  getTeamMembers() {
    return this.httpClient.get(`firms/${this.currentFirmId}/users`);
  }

  save(dvModalCloseCallback: Function) {
    if(!this.departmentsControl?.valid){
      this.departmentsControl.markAllAsTouched();
      return
    }
    if (!this.membersObject.memberNames.length && !this.edit_mode)
      return this.toaster.error('Please select users');

    this.saving = true;
    const params: any = {
      entity_ids: [this.entity_details.id],
      entity_type: this.entity_type,
      user_ids: this.membersObject.memberNames.map((x) => x['id']),
      is_primary: this.is_primary,
      internal_tags: [],
    };
    this.params.departments.forEach((departmentId) => {
      const department = this.departments.find(
        (x) => x.id === departmentId
      ).text;
      params.internal_tags.push(department);
    });
    if (this.edit_mode) {
      delete params.user_ids;
      params.user_id = this.contact.id;
      delete params.entity_ids;
      params.entity_id = this.entity_details.id;
      this.httpClient
        .put('entityUserAssignments', params)
        .pipe(finalize(() => (this.saving = false)))
        .subscribe((response: any) => {
          this.success();
          dvModalCloseCallback();
        });
    } else {
      this.httpClient
        .post('entityUserAssignments/bulk_assignment', params)
        .pipe(finalize(() => (this.saving = false)))
        .subscribe((response: any) => {
          this.saving = false;
          this.success();
          dvModalCloseCallback();
        });
    }
  }

  handleEntitySelectionChange(memberNames: any) {
    this.membersObject.memberNames = memberNames;
  }

  handleOnDepartmentChange(dvSelectValue: any[]) {
    this.params.departments = dvSelectValue;
  }
}
