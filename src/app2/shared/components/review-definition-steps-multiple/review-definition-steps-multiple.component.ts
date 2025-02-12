import {
  AfterViewChecked,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  QueryList,
  ViewChildren,
} from '@angular/core';
import {
  ReviewStep,
  Step,
} from '../../models/review-definitions.model';
import { ReviewDefinitionStepsComponent } from '../review-definition-steps/review-definition-steps.component';
import { ToastrService } from 'ngx-toastr';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { DiligenceType } from 'src/app2/apis/questionnaire/type/diligence.type';
import { UtilsService } from 'src/app2/services/utils.service';

/*
* This component is wrapper around the review-definition-step and holds accordion logic.
* This component also has all the required validation check that are applied on steps.
* Inputs : 
            1. Steps - Array of steps which are shown as accordions based on order ID \
            2. TeamRole - all the team user and function list
            4. type - Weather this component is called from modal or from firm settings
            5. diligence - diligence obj to determine project deadline
*/
@Component({
  selector: 'review-definition-steps-multiple',
  templateUrl: './review-definition-steps-multiple.component.html',
  styleUrls: ['./review-definition-steps-multiple.component.css'],
})
export class ReviewDefinitionStepsMultipleComponent
  implements OnInit, AfterViewChecked
{
  @Input() steps: Step[] & ReviewStep[];
  @Input() type: 'modal' | 'firm' = 'firm';
  @Input() teamRoleList;
  @Input() level: 'Project' | 'Question' | 'QuestionAdd' = 'Project';
  @Input() diligence: DiligenceType;

  updatedStepList;
  @Output() handleDeleteStepEmit = new EventEmitter<any>();
  @Output() handleAllStepReady = new EventEmitter();
  @ViewChildren('step') step: QueryList<ReviewDefinitionStepsComponent>;
  freeUser;
  index: number;
  activeId: number;
  constructor(
    private readonly toaster: ToastrService,
    private readonly sweetAlert: SweetAlertService,
    private readonly utils: UtilsService
  ) {}

  ngOnInit(): void {
    this.freeUser = this.utils.isFreeSubscription();
    this.activeId = this.steps.find((step: any) => !step.is_completed)?.order;
    if (!this.activeId) this.activeId = 1;
  }

  checkValid(submit = true) {
    let valid = true;
    let flag = 1;
    this.step.toArray().forEach((step) => {
      valid = valid && step.isValid(submit);
      if (!valid && flag) {
        if (submit) this.activeId = step.step.order;
        flag = 0;
      }
    });
    return valid;
  }

  getChanges(newDef = false, definition = true) {
    let updatedSteps: Step[] = [];
    this.step.toArray().forEach((element) => {
      updatedSteps.push(element.getUpdatedStep(newDef, definition));
    });

    return updatedSteps;
  }

  onDragStart() {
    this.step.toArray().forEach((element) => {
      element.updateStep();
    });
  }

  handleUpdateList(step, event, index) {
    if (this.level === 'Question') return; //Dont allow for question level edit modal
    this.steps = event;
    this.setProperOrder();
    this.activeId = step.order;
  }

  handleDeleteStep(index) {
    if (this.getActiveSteps() > 1) {
      this.activeId = this.steps[index].order - 1;
      if (this.steps[index].id) {
        this.steps[index].is_active = false;
      } else this.steps.splice(index, 1);
      this.setProperOrder();
      if (this.getActiveSteps() === 1) this.activeId = 1;
      this.handleDeleteStepEmit.emit();
    } else this.toaster.error('Atleast 1 step is required');
  }

  getActiveSteps() {
    let count = 0;
    this.steps.forEach((step) => {
      if (step.is_active) count++;
    });

    return count;
  }

  setProperOrder() {
    let count = 1;
    this.steps.forEach((step) => {
      if (step.is_active) {
        step.order = count;
        count++;
      } else step.order = 1;
    });
  }

  handleDeleteStepAlert(index) {
    event.stopPropagation();
    if (this.getActiveSteps() === 1 || this.steps[index].is_completed) return;
    const title = 'Are you sure you want to delete this step?';

    this.sweetAlert
      .confirm({
        title,
        text: 'Settings for this step will be lost and cannot be undone.',
        confirmButtonText: 'Yes, Delete',
        focusCancel: true,
      })
      .then((isConfirm) => {
        if (isConfirm.value && isConfirm.value === true) {
          this.handleDeleteStep(index);
        }
      });
  }

  addStep() {
    let step: Step = {
      assignments: [],
      order: null,
      no_of_approval_required: null,
      is_active: true,
      id: null,
    };
    this.steps.push(step);
    this.setProperOrder();
    this.activeId = this.steps[this.steps.length - 1].order;
  }

  ngAfterViewChecked(): void {
    this.handleAllStepReady.emit();
  }

  changeActiveState(step) {
    if (this.getActiveSteps() === 1) {
      return;
    }
    this.activeId = step.order;
  }
}
