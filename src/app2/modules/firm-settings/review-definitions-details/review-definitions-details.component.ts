import {
  Component,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Select } from '@ngxs/store';
import { take } from 'rxjs/operators';
import { RouterService } from 'src/app2/services/router.service';
import { CurrentUserModel } from 'src/app2/store/user/user.model';
import { UserState } from 'src/app2/store/user/user.state';
import { ToastrService } from 'ngx-toastr';
import { ReviewDefinitionsService } from 'src/app2/services/review-definitions/review-definitions.service';
import {
  Definition,
  Step,
} from 'src/app2/shared/models/review-definitions.model';
import { UtilsService } from 'src/app2/services/utils.service';
import { questionFilter } from 'src/app2/shared/constants/constant';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { ReviewDefinitionStepsMultipleComponent } from 'src/app2/shared/components';

/*
 * This component is a parent component which holds definitions
 * It has all the required operation related to each review definition
 */

@Component({
  selector: 'app-review-definitions-details',
  templateUrl: './review-definitions-details.component.html',
  styleUrls: ['./review-definitions-details.component.css'],
})
export class ReviewDefinitionsDetails implements OnInit {
  definition: Definition;
  teamRoleList: any = [];
  teamMembers: any;
  teamRolesObj: any;
  currUser: CurrentUserModel;
  reviewerList: any[] = [];
  timeLine: any;
  numberOfReviewerRequired: number;
  mandatoryReviews: boolean = false;
  filter: string;
  buttonLoader: boolean;
  activeSteps: number = 0; // This is used to calculate the number of deleted steps i.e number of steps set to is_active = false
  @ViewChild('stepMultiple') steps: ReviewDefinitionStepsMultipleComponent;
  @Select(UserState.getCurrentUserData) user;
  @Select(UserState.getTeamMembersData) teamMembersData;
  @Select(UserState.getTeamRoles) teamRoles;
  id: number;
  questionFilter = questionFilter;
  isOpen: boolean;
  constructor(
    private readonly routerService: RouterService,
    private readonly reviewService: ReviewDefinitionsService,
    private readonly utils: UtilsService,
    private readonly toaster: ToastrService,
    private readonly modal: CustomModalService,
  ) {}

  ngOnInit(): void {
    let state = this.routerService.getState();
    this.id = state?.params?.reviewId;
    this.reviewService.activeId = this.id;

    this.initialize();
  }

  initialize(): void {
    this.user.pipe(take(1))
      .subscribe((user) => {
        if (user) {
          this.currUser = user;
        }
      });

    this.reviewService.getReviewFilters().subscribe((filters: any) => {
      this.questionFilter = filters;
      this.filter = this.questionFilter[0].id;
    });

    this.teamMembersData.pipe(take(2)).subscribe((teamMembers) => {
      if (teamMembers) {
        this.teamMembers = teamMembers;
      }
    });
    this.teamRoles.pipe(take(2)).subscribe((teamRole) => {
      this.teamRolesObj = teamRole;
      if (teamRole || this.teamMembers) this.init();
    });
  }

  init() {
    this.reviewService
      .fetchDefinitionById(this.id)
      .subscribe((definition: Definition) => {
        definition.steps = this.utils.sortByAplha(definition.steps, 'order');
        this.definition = definition;
        this.activeSteps = this.getActiveSteps();
        if (!this.definition.steps.length) {
          let step: Step = {
            assignments: [],
            order: 1,
            no_of_approval_required: null,
            is_active: true,
            id: null,
          };
          this.definition.steps.push(step);
        }
        this.filter = definition.review_filter_id;
      });

    if (this.teamRolesObj)
      this.teamRoleList = this.teamRoleList.concat(
        this.teamRolesObj.map((user_role: any) => ({
          id: user_role.function_id,
          name: user_role.function_name,
          type: 'User Roles',
          is_mandatory: true,
          duration: null,
          assigned_to_function_id: user_role.function_id,
        }))
      );

    if (this.teamMembers)
      this.teamRoleList = this.teamRoleList.concat(
        this.teamMembers.map((user) => ({
          id: user.id,
          name: user.fullName,
          type: 'Users',
          firstName: user.firstName,
          lastName: user.lastName,
          assigned_to_user_id: user.id,
          is_mandatory: true,
          duration: null,
        }))
      );

    // check for showing userRoles first
    this.teamRoleList = this.utils.sortByAplha(this.teamRoleList, 'type');
  }

  handleGoBack() {
    this.routerService.navigate('app.firm.settings.review_definitions.list');
  }

  handleDelete() {
    this.reviewService.confirmReviewDefinitionDeletion(this.definition, () => {
      this.handleGoBack();
    });
  }

  handleEdit() {
    this.reviewService
      .getDefinitions()
      .subscribe((definitions: Definition[]) => {
        this.modal.invoke('new-review-definition', {
          initialState: {
            type: 'edit',
            success: (name) => {
              this.definition.name = name;
            },
            definitions: definitions,
            currDef: this.definition,
          },
        });
      });
  }

  addStep() {
    this.steps.addStep();
    this.activeSteps++;
  }

  /*
   * This function will first check the validity of each step and then fetches data from every step.
   * Saves data in proper format and then api call is made
   */
  saveChanges() {
    this.buttonLoader = true;
    let valid = this.steps.checkValid();

    if (!valid) {
      this.toaster.error('Please enter valid data');
      this.buttonLoader = false;
      return;
    } else {
      let updatedSteps: Step[] = this.steps.getChanges(false, true);
      let updatedDefinition: Definition = {
        ...this.definition,
        review_filter_id: this.filter,
      };
      updatedDefinition.steps = [...updatedSteps];

      this.reviewService.updateDefinition(updatedDefinition).subscribe(
        (res: Definition) => {
          this.buttonLoader = false;
          this.toaster.success('Review definition updated');
          res.steps = this.utils.sortByAplha(res.steps, 'order');
          this.definition = res;
        },
        (error) => (this.buttonLoader = false)
      );
    }
  }

  getActiveSteps() {
    let count = 0;
    this.definition.steps.forEach((step) => {
      if (step.is_active) count++;
    });

    return count;
  }

  handleDeleteStep() {
    this.activeSteps--;
  }
}
