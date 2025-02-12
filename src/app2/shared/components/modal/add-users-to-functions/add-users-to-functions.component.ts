import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { BaseDataService } from 'src/app2/services/base-data.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { FunctionType } from './add-user-to-function.type';

@Component({
  selector: 'add-users-to-functions',
  templateUrl: './add-users-to-functions.component.html',
  styleUrls: ['./add-user-to-functions.component.css'],
})
export class AddUsersToFuntionsComponent implements OnInit {
  disabled: boolean = false;
  @Input() functionsList: FunctionType[] = [];
  @Input() existingFunctions: any[] = [];
  @Input() OnSuccess;
  current_user: any;
  currentFirmId: number;
  loading_data: boolean;
  teamsForm: FormGroup;
  dropdown_teams: any[];
  fnForm;
  firstButtonLabel;
  title;

  existingStrategies;
  loading;
  ownerList;
  is_investor;
  edit_mode;
  functions;
  team_members;
  showDel;
  constructor(
    private readonly Utils: UtilsService,
    private readonly http: HttpClient,
    private readonly BaseDataService: BaseDataService
  ) {}

  ngOnInit(): void {
    this.loading_data = true;
    this.existingStrategies = [];
    this.is_investor = this.Utils.isInvestor();
    this.current_user = this.Utils.getCurrentUser();
    this.currentFirmId = this.current_user.firmInfo.id;
    this.ownerList = [];
    this.edit_mode = false;
    this.createForm();
    this.fnForm = this.teamsForm.get('fnForm') as FormArray;
    if (this.functionsList) {
      this.edit_mode = true;
    } else {
      this.addNewControl();
    }
    this.fetchEmployees();
    this.getFunctions();
    this.getButtonText();
    this.getModalTitle();
  }

  createForm() {
    this.teamsForm = new FormGroup({
      fnForm: new FormArray([]),
    });
  }

  addNewControl() {
    this.fnForm.push(
      new FormGroup({
        role: new FormControl(null, [Validators.required]),
        teamMembers: new FormControl(null, [Validators.required]),
      })
    );
  }

  addNewControlEvent() {
    this.showDel = true;
    this.addNewControl();
  }

  removeControl(index) {
    this.fnForm.removeAt(index);
    this.updateDropdownTeams();
    if (this.fnForm.controls.length === 1) {
      this.showDel = false;
    }
  }

  updateDropdownTeams() {
    let alreadySelected = this.fnForm.value.map((x) => x.teamMembers);
    alreadySelected = this.Utils.flattenArray(alreadySelected);
    this.dropdown_teams = [...this.team_members];
    if (alreadySelected?.length) {
      this.dropdown_teams.filter((x) => {
        if (alreadySelected.includes(x.id)) {
          x.disabled = true;
        } else {
          x.disabled = false;
        }
      });
    }
  }

  triggerValidations(index) {
    (this.fnForm.controls[index] as FormGroup)
      .get('role')
      .setValidators(Validators.required);
    (this.fnForm.controls[index] as FormGroup)
      .get('role')
      ?.updateValueAndValidity();
    (this.fnForm.controls[index] as FormGroup)
      .get('teamMembers')
      .setValidators(Validators.required);
    (this.fnForm.controls[index] as FormGroup)
      .get('teamMembers')
      ?.updateValueAndValidity();
    this.updateDropdownTeams();
  }

  getFunctions() {
    return this.BaseDataService.getFunctions().subscribe((response: any) => {
      response = response.filter(
        (val) =>
          val.function_name !== 'Primary Owner' ||
          val.function_name !== 'Secondary Owner'
      );

      this.functions = response;
      if (this.existingFunctions && this.existingFunctions.length) {
        this.functions = this.functions.filter(
          (fn: any) => this.existingFunctions.indexOf(fn.function_id) === -1
        );
      }
      this.loading_data = false;
    });
  }

  fetchEmployees() {
    this.BaseDataService.getTeamMembers().subscribe((response: any) => {
      this.team_members = response.map((teamMember) => {
        teamMember.fullname = [teamMember.firstName, teamMember.lastName].join(
          ' '
        );
        return teamMember;
      });

      if (this.functionsList) {
        this.ownerList = [];
        this.functionsList.map((entry) => {
          this.fnForm.push(
            new FormGroup({
              role: new FormControl({
                value: entry.function_id,
                disabled: true,
              }),
              teamMembers: new FormControl(
                entry.user_assigments.map((val) => val.user_id)
              ),
            })
          );
        });
      }
      this.updateDropdownTeams();
      this.loading_data = false;
    });
  }

  getButtonText() {
    this.firstButtonLabel = 'Add User Role(s)';
    if (this.edit_mode) {
      if (this.functionsList.length === 1) {
        this.firstButtonLabel = 'Update User Role';
      } else {
        this.firstButtonLabel = 'Update User Roles';
      }
    }
  }

  getModalTitle() {
    this.title = 'Manage User Role(s)';
    if (this.edit_mode) {
      if (this.functionsList.length === 1) {
        this.title = 'Manage User Role';
      } else {
        this.title = 'Manage User Roles';
      }
    }
  }

  save(cb) {
    this.fnForm.markAllAsTouched();
    if (this.teamsForm.valid) {
      this.loading = true;
      const params = [];
      this.fnForm.controls.map((entry) => {
        const innerObj: any = {};
        innerObj.user_ids = entry.controls.teamMembers.value;
        innerObj.function_id = entry.controls.role.value;
        params.push(innerObj);
      });
      return this.http.put('functions', params).subscribe(
        (response: any) => {
          this.loading = false;
          this.OnSuccess();
          cb();
        },
        (error: any) => {
          this.loading = false;
        }
      );
    }
  }
}
