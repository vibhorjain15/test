import { DatePipe } from '@angular/common';
import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  ViewChild,
} from '@angular/core';
import { NgForm } from '@angular/forms';
import * as moment from 'moment';
import { DiligenceType } from 'src/app2/apis/questionnaire/type/diligence.type';
import { UtilsService } from 'src/app2/services/utils.service';
import {
  Assignment,
  Step,
} from 'src/app2/shared/models/review-definitions.model';

/*
* This component holds each step details which is shown as accordion in UI
* It has all the required operation related to each individual step review 
* Inputs : 
            1. Step - Individual step having all the info about assignments and other details \
            2. TeamRole - all the team user and function list
            4. index(number of step) - for reference purposes
*/
@Component({
  selector: 'review-definition-steps',
  templateUrl: './review-definition-steps.component.html',
  styleUrls: ['./review-definition-steps.component.css'],
})
export class ReviewDefinitionStepsComponent implements OnInit {
  @Input() step: Step;
  @Input() teamRoleList;
  @Input() index;
  @Input() type: 'modal' | 'firm' = 'firm';
  @Input() diligence: DiligenceType;
  @Input() disabled: boolean;
  minDate = moment().add(1, 'day').toDate();
  numberOfReviewerRequired: number = 0;
  reviewerList: any[] = [];
  mandatoryReviews;
  timeLine: number = 10;
  isOpen: boolean;
  dueDate: any = moment().add(10, 'days').toDate();
  minReviewerMandatory: number = 1;
  isFree: boolean;
  freeUserLabel;
  @Output() onDeleteStep = new EventEmitter();
  @ViewChild('myForm') myForm: NgForm;
  constructor(
    private utils: UtilsService,
    public datePipe: DatePipe,
  ) {}

  ngOnInit(): void {
    this.teamRoleList = JSON.parse(JSON.stringify(this.teamRoleList));
    let assign = this.step.assignments.filter((x) => x.is_active);
    // Finding already assigned user from the list and adding it into the selectedList
    let first;
    if (assign?.length) {
      first = assign[0]?.duration ?? assign[0]?.due_at;
      assign.forEach((user) => {
        let teamObj = this.teamRoleList.find(
          (x) =>
            x.id == (user.assigned_to_function_id ?? user.assigned_to_user_id)
        );

        if (teamObj) {
          let obj = {
            ...teamObj,
            ...user,
            dueDate: user.due_at
              ? new Date(user.due_at)
              : moment().add(user.duration, 'days').toDate(),

            assign_id: user.id,
          };
          this.reviewerList.push(obj);
        }

        if (!user.is_mandatory || (user.duration ?? user.due_at) !== first)
          this.mandatoryReviews = true;
      });

      if (!this.mandatoryReviews && first) {
        this.timeLine = first;
      }
      this.dueDate = assign[0]?.due_at
        ? new Date(assign[0]?.due_at)
        : moment().add(assign[0]?.duration, 'days').toDate();
    }

    if (!this.numberOfReviewerRequired)
      this.numberOfReviewerRequired = this.step.no_of_approval_required ?? 1;

    this.isFree = this.utils.isFreeSubscription();

    if (this.isFree) this.freeUserLabel = '';
    else this.freeUserLabel = '(s)';
  }

  /*
   * This function checks and validates the reviewer data that a user is submitting
   * if the step is marked in-active(deleted) dont check the validity
   * if the mandatory review is not selected then by default min reviewer should be equal to reviewer length
   * return true if the form is valid and min reviewer required entered is equal to total reviewers
   * If the mandatory review is selected then min reviewer count entered can be more than or equal to mandatory reviewers.
   * Check for total mandatory reviewers and if those are more than entered reviewer count return false
   */
  isValid(submit = true) {
    if (!this.step.is_active || this.disabled) return true;
    if (submit) this.myForm.onSubmit(undefined); // Submits the form and display errors (if any)
    if (!this.mandatoryReviews) {
      this.minReviewerMandatory = this.reviewerList.length;
      return (
        this.myForm.valid &&
        this.numberOfReviewerRequired === this.reviewerList.length &&
        this.reviewerList?.length > 0
      );
    } else {
      let mandatoryReview = 0;
      let valid = true;
      this.reviewerList.forEach((reviewer) => {
        valid =
          valid &&
          ((this.type === 'firm' &&
            reviewer.duration &&
            reviewer.duration % 1 === 0 &&
            reviewer.duration <= 365) ||
            (this.type === 'modal' && reviewer.dueDate));
        if (reviewer.is_mandatory) mandatoryReview++;
      });
      this.minReviewerMandatory = mandatoryReview;
      valid = valid && this.reviewerList.length && this.myForm.valid;

      if (this.numberOfReviewerRequired < mandatoryReview) return false;

      return valid;
    }
  }

  handleMandatoryChange(value) {
    if (value && this.timeLine) {
      this.reviewerList.forEach((reviewer) => {
        reviewer.duration = this.timeLine;
        reviewer.dueDate = this.dueDate;
        reviewer.is_mandatory = true;
      });
    }
  }

  /*
   * This function will give proper formatted value to parent component so that it can be sent to backend easily
   * is_active property is used to delete assignment/steps instead of deleting the whole object i.e if you want to delete a step set is_active=false
   * if the definition saved from the modal then call the method with the newDef as true
   */
  getUpdatedStep(newDef = false, definition = true) {
    let updatedStep: Step = {
      assignments: [],
      no_of_approval_required: this.numberOfReviewerRequired,
      order: this.step.order,
      is_active: this.step.is_active,
    };
    let assign = this.step.assignments;

    if (definition) {
      // This step will deliver formatted step object used for saving new or update old definition
      updatedStep['assignments'] = this.reviewerList.map((reviewer) => {
        let obj: Assignment = {
          assigned_to_user_id: reviewer.assigned_to_user_id,
          assigned_to_function_id: reviewer.assigned_to_function_id,
          is_mandatory: this.mandatoryReviews ? reviewer.is_mandatory : true,
          is_active: true,
        };
        if (!newDef) {
          obj.id =
            reviewer.assign_id ??
            assign.find(
              (assigner) =>
                (reviewer.assigned_to_function_id ??
                  reviewer.assigned_to_user_id) ==
                (assigner.assigned_to_function_id ??
                  assigner.assigned_to_user_id)
            )?.id ??
            0;
        }

        if (this.type === 'firm')
          obj.duration = this.mandatoryReviews
            ? reviewer.duration
            : this.timeLine;
        else if (this.type === 'modal')
          obj.duration = this.mandatoryReviews
            ? moment(reviewer.dueDate).diff(moment(), 'days') + 1
            : moment(this.dueDate).diff(moment(), 'days') + 1;

        return obj;
      });

      // If any assignment is removed from the original list then add that assignment as is_active false to delete it from backend
      if (!newDef) {
        updatedStep.id = this.step?.id ?? 0;
        assign.forEach((user) => {
          if (
            !updatedStep.assignments.find(
              (x) =>
                (x.assigned_to_function_id ?? x.assigned_to_user_id) ==
                (user.assigned_to_function_id ?? user.assigned_to_user_id)
            )
          )
            updatedStep.assignments.push({
              ...user,
              is_active: false,
            });
        });
      }
    } else {
      // This step will return formatted step value for assign reviewer api
      updatedStep['assignments'] = this.reviewerList.map((reviewer) => {
        let obj: Assignment = {
          is_mandatory: this.mandatoryReviews ? reviewer.is_mandatory : true,
          due_at: this.mandatoryReviews
            ? this.datePipe.transform(reviewer.dueDate, 'MM-dd-yyyy')
            : this.datePipe.transform(this.dueDate, 'MM-dd-yyyy'),
          is_active: true,
        };
        if (reviewer.assigned_to_user_id)
          obj = {
            assigned_to_user_id: reviewer.assigned_to_user_id,
            ...obj,
          };
        else
          obj = {
            assigned_to_function_id: reviewer.assigned_to_function_id,
            ...obj,
          };

        if (!newDef) {
          obj.id =
            reviewer.assign_id ??
            assign.find(
              (assigner) =>
                (reviewer.assigned_to_function_id ??
                  reviewer.assigned_to_user_id) ==
                (assigner.assigned_to_function_id ??
                  assigner.assigned_to_user_id)
            )?.id ??
            0;
        }
        return obj;
      });

      // if the definition has ids that needs to be handled
      if (!newDef) {
        updatedStep.id = this.step.id ?? 0;
        assign.forEach((user) => {
          if (
            !updatedStep.assignments.find(
              (x) =>
                (x.assigned_to_function_id ?? x.assigned_to_user_id) ==
                (user.assigned_to_function_id ?? user.assigned_to_user_id)
            )
          ) {
            let obj: Assignment = {
              is_mandatory: this.mandatoryReviews ? user.is_mandatory : true,
              due_at: this.mandatoryReviews
                ? this.datePipe.transform(user.due_at, 'MM-dd-yyyy')
                : this.datePipe.transform(this.dueDate, 'MM-dd-yyyy'),
              is_active: false,
            };
            if (user.assigned_to_user_id)
              obj = {
                assigned_to_user_id: user.assigned_to_user_id,
                ...obj,
              };
            else
              obj = {
                assigned_to_function_id: user.assigned_to_function_id,
                ...obj,
              };

            obj.id = user.id ?? 0;

            updatedStep.assignments.push(obj);
          }
        });
      }
    }

    return updatedStep;
  }

  handleReviewerDataChange(data) {
    switch (data.type) {
      case 'delete':
        this.reviewerList.splice(data.index, 1);
        if (this.reviewerList.length === 1) this.mandatoryReviews = false;
        this.setMinReviewerCount();
        break;
      case 'reviewerAdd':
        if (
          !this.reviewerList.find(
            (x) =>
              (x.assigned_to_function_id ?? x.assigned_to_user_id) ===
              (data.value.assigned_to_function_id ??
                data.value.assigned_to_user_id)
          )
        ) {
          data.value.dueDate = this.dueDate;
          this.reviewerList.push(data.value);
          this.numberOfReviewerRequired++;
        }
        break;
      case 'mandatoryChange':
        this.reviewerList[data.index].is_mandatory = data.value;
        this.setMinReviewerCount();
        break;
      case 'date':
        this.reviewerList[data.index].dueDate = data.value;
        break;
    }
  }

  handleDateChange(date) {
    this.dueDate = date;
  }

  getMandatoryReviews(assignments) {
    let count = 0;
    assignments.forEach((ass) => {
      if (ass.is_mandatory) count++;
    });

    return count || 1;
  }

  handleReviewerChange(reviewerList) {
    this.reviewerList = reviewerList;
    this.setMinReviewerCount();
    Object.assign(this.step, this.getUpdatedStep());
  }

  setMinReviewerCount() {
    this.numberOfReviewerRequired = 0;
    this.reviewerList.forEach((reviewer) => {
      if (reviewer.is_mandatory) this.numberOfReviewerRequired++;
    });
    if (!this.numberOfReviewerRequired) this.numberOfReviewerRequired = 1;
  }
  updateStep() {
    Object.assign(this.step, this.getUpdatedStep());
  }
}
