import { Component, Input, OnInit } from '@angular/core';
import { UtilsService } from 'src/app2/services/utils.service';
import { BaseDataService } from 'src/app2/services/base-data.service';
import { forkJoin } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-dv-owners',
  templateUrl: './dv-owners.component.html',
})
export class DvOwnersComponent implements OnInit {
  due_date: Date;
  current_user: any;
  currentFirmId: number;
  team_members: any[];
  loading_data: boolean;
  @Input() entity: any;
  @Input() entityType: string;
  active_functions: any[];
  primaryOwnersObj: any;
  secondaryOwnersObj: any;
  functions: any[];
  assignedFunctions: any;
  ownerForm: FormGroup;
  dropdown_functions: any[];

  get formFunctions(): FormArray {
    return this.ownerForm.get('functions') as FormArray;
  }

  constructor(
    private readonly Utils: UtilsService,
    private readonly BaseDataService: BaseDataService,
    private readonly http: HttpClient
  ) {}

  ngOnInit(): void {
    this.due_date = new Date();
    this.current_user = this.Utils.getCurrentUser();
    this.currentFirmId = this.current_user.firmInfo.id;
    this.createForm();
    this.getData();
  }

  createForm() {
    this.ownerForm = new FormGroup({
      primary: new FormControl([]),
      secondary: new FormControl([]),
      functions: new FormArray([]),
    });
  }

  getData() {
    this.BaseDataService.getTeamMembers().subscribe((response: Array<any>) => {
      this.team_members = response;
      this.team_members.map(
        (x) => (x.fullname = x.firstName + ' ' + x.lastName)
      );
    });

    this.loading_data = true;
    const observables = [];
    observables.push(this.BaseDataService.getFunctions());
    observables.push(this.getCurrentFirmFunctions());
    if (this.entity && this.entity.id) {
      observables.push(this.getEntityFunctions(this.entity.id));
    }

    forkJoin(observables)
      .pipe(
        finalize(() => {
          this.loading_data = false;
        })
      )
      .subscribe((responses: Array<any>) => {
        this.setFunctionData(responses[0]);
        this.active_functions = responses[1];
        this.dropdown_functions = [...this.active_functions];
        if (responses[2]) {
          this.assignedFunctions = responses[2];
          this.populateExistingData();
        }
        this.active_functions = this.active_functions.filter(
          (x) =>
            x.function_id !== this.primaryOwnersObj.function_id &&
            x.function_id !== this.secondaryOwnersObj.function_id
        );
        this.updateDropdownFunctions();
        if (!this.entity || !this.entity.id) {
          this.addFunctionControl();
        }
        this.loading_data = false;
      });
  }

  addFunctionControl() {
    this.formFunctions.push(
      new FormGroup({
        function_id: new FormControl(''),
        user_id: new FormControl([]),
        auto_assign: new FormControl(false),
        selectedFunction: new FormControl(null),
      })
    );
  }

  removeFunctionControl(index: number) {
    this.formFunctions.removeAt(index);
    this.updateDropdownFunctions();
  }

  updateDropdownFunctions() {
    const alreadySelected = this.formFunctions.value.map((x) => x.function_id);
    if (alreadySelected.length == 0 && this.entity) {
      this.addFunctionControl();
    }
    this.dropdown_functions = [...this.active_functions];
    this.dropdown_functions.forEach((x) => {
      if (alreadySelected.includes(x.function_id)) {
        x.disabled = true;
      } else {
        x.disabled = false;
      }
    });
  }

  onAutoAssignChange(index, event) {
    this.formFunctions.controls[index].get('auto_assign').patchValue(event);
    // this.formFunctions.controls[index].get('selectedFunction').patchValue('');
    const selectedassignId = this.formFunctions.controls[index]
      .get('selectedFunction')
      .value.user_assigments.map((t) => t.user_id);
    this.formFunctions.controls[index]
      .get('user_id')
      .setValue(selectedassignId);
  }

  onFunctionChange(index, value) {
    this.formFunctions.controls[index].get('function_id').patchValue(value);
    const selectedFunction = this.dropdown_functions.find(
      (x) => x.function_id === value
    );
    this.formFunctions.controls[index]
      .get('selectedFunction')
      .patchValue(selectedFunction);
    if (this.formFunctions.controls[index].get('auto_assign').value) {
      const selectedassignId = this.formFunctions.controls[index]
        .get('selectedFunction')
        .value.user_assigments.map((t) => t.user_id);
      this.formFunctions.controls[index]
        .get('user_id')
        .setValue(selectedassignId);
    } else {
      this.formFunctions.controls[index].get('user_id').setValue([]);
    }
    this.updateDropdownFunctions();
  }

  setFunctionData(response: Array<any>) {
    this.primaryOwnersObj = response.find(
      (x) => x.function_name === 'Primary Owner'
    );
    this.secondaryOwnersObj = response.find(
      (x) => x.function_name === 'Secondary Owner'
    );
    this.functions = response.filter(
      (x) =>
        x.function_id !== this.primaryOwnersObj.function_id &&
        x.function_id !== this.secondaryOwnersObj.function_id
    );
    this.functions = this.Utils.sortByKey(this.functions, 'function_name');
  }

  getCurrentFirmFunctions() {
    const params = { entity_id: this.currentFirmId, entity_type: 'Firm' };
    return this.http.get('function_assignments', { params: params });
  }

  getEntityFunctions(id: any) {
    const params = { entity_id: id, entity_type: this.entityType };
    return this.http.get('function_assignments', { params: params });
  }

  populateExistingData() {
    if (!this.assignedFunctions.length) {
      this.addFunctionControl();
      return;
    }
    const primary = this.assignedFunctions.find(
      (x) => x.function_id == this.primaryOwnersObj.function_id
    );
    if (primary) {
      this.ownerForm
        .get('primary')
        .patchValue(primary.user_assigments.map((x) => x.user_id));
    }
    const secondary = this.assignedFunctions.find(
      (x) => x.function_id == this.secondaryOwnersObj.function_id
    );
    if (secondary) {
      this.ownerForm
        .get('secondary')
        .patchValue(secondary.user_assigments.map((x) => x.user_id));
    }

    const remainingFunctions = this.assignedFunctions.filter(
      (x) =>
        x.function_id !== this.primaryOwnersObj.function_id &&
        x.function_id !== this.secondaryOwnersObj.function_id
    );

    remainingFunctions.forEach((func) => {
      // if (func.assigned_to_function) {
      //   this.formFunctions.push(
      //     new FormGroup({
      //       function_id: new FormControl(func.function_id),
      //       user_id: new FormControl([]),
      //       auto_assign: new FormControl(true),
      //       selectedFunction: new FormControl(
      //         this.dropdown_functions.find(
      //           (x) => x.function_id === func.function_id
      //         )
      //       ),
      //     })
      //   );
      // }
      if (func.user_assigments.length) {
        this.formFunctions.push(
          new FormGroup({
            function_id: new FormControl(func.function_id),
            user_id: new FormControl(
              func.user_assigments.map((x) => x.user_id)
            ),
            auto_assign: new FormControl(
              func.assigned_to_function ? true : false
            ),
            selectedFunction: new FormControl(
              this.dropdown_functions.find(
                (x) => x.function_id === func.function_id
              )
            ),
          })
        );
      }
    });
  }

  // this needs to be called from parent component on Submit button.
  getSelectedFunctions() {
    const finalSelection = [];
    const formValue = this.ownerForm.value;
    if (formValue.primary.length) {
      formValue.primary.forEach((owner) => {
        finalSelection.push({
          function_id: this.primaryOwnersObj.function_id,
          user_id: owner,
        });
      });
    }
    if (formValue.secondary.length) {
      formValue.secondary.forEach((owner) => {
        finalSelection.push({
          function_id: this.secondaryOwnersObj.function_id,
          user_id: owner,
        });
      });
    }
    if (formValue.functions.length) {
      formValue.functions.forEach((func) => {
        if (func.auto_assign) {
          finalSelection.push({
            function_id: func.function_id,
            assigned_to_function_id: func.function_id,
          });
        } else if (func.user_id?.length) {
          func.user_id.forEach((owner) => {
            finalSelection.push({
              function_id: func.function_id,
              user_id: owner,
            });
          });
        }
      });
    }
    return finalSelection;
  }

  // this needs to be called from parent component to reset the form
  resetForm() {
    this.ownerForm.reset();
    this.ownerForm.get('primary').patchValue([]);
    this.ownerForm.get('secondary').patchValue([]);
    this.formFunctions.clear();
    this.addFunctionControl();
  }
}
