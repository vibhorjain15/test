import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Select, Store } from '@ngxs/store';
import { validateAllFormFields } from 'src/app2/modules/firm-settings/tags-modal/tags-modal.util';
import * as moment from 'moment';
import { ToastrService } from 'ngx-toastr';
import {
  DiligenceTypeEnum,
  errorMessageMap,
  ErrorStatusCode,
  IssueType,
} from 'src/app2/shared/constants/constant';
import { RecommendationTrackerService } from 'src/app2/apis/recommendationTracker.service';
import { RouterService } from 'src/app2/services/router.service';
import { combineLatest, forkJoin } from 'rxjs';
import { RecommendationState } from '../../store/recommendation.state';
import { finalize, tap } from 'rxjs/operators';
import {
  getIssuePriorities,
  getIssueStatuses,
  getIssueTags,
} from '../../store/recommendation.action';
import {
  noHtmlValidator,
  noWhitespaceValidator,
} from 'src/app2/shared/validators/no-white-space.validator';

@Component({
  selector: 'add-recommendation',
  templateUrl: './add-recommendation.component.html',
  styleUrls: ['./add-recommendation.component.css'],
})
export class AddRecommendationComponent implements OnInit {
  @Input() editingRecommendation: any;
  @Input() entity_type: any;
  @Input() entity_id: any;
  // Applicable only for question and project level recommendations
  @Input() recommendationSubject: any;
  @Input() diligence;
  @Output() onSave = new EventEmitter();
  @Output() onUpdate = new EventEmitter();
  @Output() onCancel = new EventEmitter();
  diligenceId: any;
  fromFirmId: any;
  toFirmId: any;
  dueDates;
  questionForm: FormGroup;
  loading = false;
  currentUser: any;
  users: any;
  tags: any;
  priorities = [];
  minDate = new Date();
  statuses = [];
  internalUsers: any;
  externalUsers: any;
  isExternalRecommendationAllowed: boolean = true;
  currentUserFirmId: any;
  btnLoader: boolean;
  disableInputs: any = {
    subject: false,
    description: false,
    isExternal: false,
    priority: false,
    dueDate: false,
    initiatedBy: false,
    assignTo: false,
    tags: false,
  };
  isExternalToolTip = '';
  reported_by_list = [];
  issueTrackerName = 'Recommendation';
  firmPreferenceIsExternalAllowed = true;
  priorityData: any;
  @Select(RecommendationState.getIssuePrioritiesPref) priorities$;
  @Select(RecommendationState.getIssueStatusesPref) statuses$;
  @Select(RecommendationState.getIssueTagsPref) tags$;
  suggestedDate: any;
  errorMessageMap = errorMessageMap;
  constructor(
    private store: Store,
    private readonly toaster: ToastrService,
    private readonly recommendationTrackerService: RecommendationTrackerService,
    private readonly router: RouterService
  ) {}

  ngOnInit(): void {
    if (!this.editingRecommendation) {
      this.getSuggestedDueDate(30);
    }
    this.currentUser = this.store.selectSnapshot(
      (state) => state.user.currentUser
    );
    let firmPreferences = this.store.selectSnapshot(
      (state) => state.user.firmPreference
    );
    this.issueTrackerName =
      firmPreferences?.issue_tracker_default_name ?? 'Recommendation';
    this.firmPreferenceIsExternalAllowed =
      firmPreferences?.allow_external_issues;
    this.isExternalToolTip = `${
      this.currentUser.isManager ? 'Investors' : 'Managers'
    } will be able to view this ${this.issueTrackerName.toLowerCase()} on their end and will be notified`;
    this.currentUserFirmId = this.currentUser.firmInfo.id;
    this.users = this.internalUsers = this.store.selectSnapshot(
      (state) => state.user.teamMembers
    );
    this.reported_by_list = this.internalUsers;
    if (this.editingRecommendation) {
      this.isExternalToolTip = `External visibility of a ${this.issueTrackerName.toLowerCase()} can not be updated`;
      this.entity_id = this.editingRecommendation.entity_id;
      this.entity_type = this.editingRecommendation.entity_type;
      this.disableInputs.initiatedBy = true;
      this.disableInputs.isExternal = true;
      if (
        !(
          this.currentUser.id == this.editingRecommendation.reported_by_id ||
          this.currentUser.id == this.editingRecommendation.assigned_to_id ||
          this.currentUser.isAdmin
        )
      ) {
        this.disableInputs.dueDate = true;
        this.disableInputs.assignTo = true;
        this.disableInputs.tags = true;
      }
      if (
        !(
          this.currentUserFirmId == this.editingRecommendation.fromfirm_id &&
          (this.currentUser.id == this.editingRecommendation.reported_by_id ||
            this.currentUser.id == this.editingRecommendation.assigned_to_id ||
            this.currentUser.isAdmin)
        )
      ) {
        this.disableInputs.priority = true;
      }
      if (
        !(
          this.currentUserFirmId == this.editingRecommendation.fromfirm_id &&
          (this.currentUser.id == this.editingRecommendation.reported_by_id ||
            this.currentUser.isAdmin)
        )
      ) {
        this.disableInputs.subject = true;
        this.disableInputs.description = true;
      }
    }

    this.isExternalRecommendationAllowed =
      this.getIsExternalRecommendationAllowed();

    this.createForm();
    this.loading = true;

    forkJoin([
      this.store.dispatch(new getIssueStatuses()),
      this.store.dispatch(new getIssuePriorities()),
      this.store.dispatch(new getIssueTags()),
    ]).subscribe((state: any) => {
      const {
        recommendationStatuses,
        recommendationPriorities,
        recommendationTags,
      } = this.store.selectSnapshot((state) => state.recommendation);
      this.statuses = recommendationStatuses;
      this.priorities = recommendationPriorities;
      this.tags = recommendationTags;
      this.setInitialValue();
    });

    if (
      this.entity_type == IssueType.Question ||
      this.entity_type == IssueType.Project
    ) {
      if (this.editingRecommendation) {
        this.fromFirmId = this.editingRecommendation.fromfirm_id;
        this.toFirmId = this.editingRecommendation.tofirm_id;
        this.diligenceId = this.editingRecommendation.diligence_id;
      } else {
        this.fromFirmId = this.diligence.fromfirm_id;
        this.toFirmId = this.diligence.tofirm_id;
        this.diligenceId = this.diligence.id;
      }

      if (this.isExternalRecommendationAllowed) {
        let payloadFirmId;
        if (this.editingRecommendation) {
          payloadFirmId = this.toFirmId;
        } else {
          payloadFirmId =
            this.fromFirmId == this.currentUserFirmId
              ? this.toFirmId
              : this.fromFirmId;
        }

        this.recommendationTrackerService
          .getEntityExternalSubscribers(
            this.diligenceId,
            'Duediligence',
            payloadFirmId
          )
          .subscribe(
            (users: any) => {
              this.loading = false;
              this.externalUsers = users.map((user) => {
                user.id = user.user_id;
                return user;
              });
              if (this.editingRecommendation?.is_external) {
                this.users = this.externalUsers;
                this.setAssignToAndReportedBy();
              }
            },
            (err) => {
              if (
                !(
                  err &&
                  err.status &&
                  Object.values(ErrorStatusCode).includes(err.status)
                )
              ) {
                this.toaster.error('Something went wrong while fetching data');
              }
              this.loading = false;
            }
          );
      } else {
        this.loading = false;
      }
    } else {
      if (this.isExternalRecommendationAllowed) {
        this.recommendationTrackerService
          .getAssociatedContacts(this.entity_id, this.entity_type)
          .subscribe(
            (userList: any[]) => {
              this.loading = false;
              // filtering out users who have not been activated yet
              this.externalUsers = userList.filter(
                (user) => user.conversionDateTime
              );
              if (
                this.editingRecommendation?.is_external &&
                this.currentUserFirmId ===
                  this.editingRecommendation.fromfirm_id
              ) {
                this.users = this.externalUsers;
                this.setAssignToAndReportedBy();
              }
            },
            (err) => {
              this.loading = false;
              if (
                !(
                  err &&
                  err.status &&
                  Object.values(ErrorStatusCode).includes(err.status)
                )
              ) {
                this.toaster.error('Something went wrong while fetching data');
              }
            }
          );
      } else {
        this.loading = false;
      }
    }
    if (
      this.editingRecommendation &&
      (!this.editingRecommendation.isExternal ||
        !this.isExternalRecommendationAllowed ||
        this.editingRecommendation.fromfirm_id !== this.currentUserFirmId)
    ) {
      this.setAssignToAndReportedBy();
    }
  }

  getIsExternalRecommendationAllowed() {
    if (this.editingRecommendation?.is_external) {
      return true;
    }

    if (!this.firmPreferenceIsExternalAllowed) {
      return false;
    }

    if (
      this.entity_type === IssueType.Question ||
      this.entity_type === IssueType.Project
    ) {
      return this.editingRecommendation
        ? !this.editingRecommendation.is_internal_diligence
        : !this.diligence.is_internal &&
            this.diligence.diligence_type != DiligenceTypeEnum.shared_profile;
    } else {
      // for other entity types, external recommendation is allowed only for investors.
      return this.currentUser.isInvestor;
    }
  }

  createForm() {
    this.questionForm = new FormGroup({
      subject: new FormControl(
        {
          value: this.recommendationSubject ?? null,
          disabled: this.disableInputs.subject,
        },
        [
          Validators.required,
          noWhitespaceValidator,
          noHtmlValidator,
          Validators.maxLength(200),
        ]
      ),
      description: new FormControl(
        { value: null, disabled: this.disableInputs.description },
        [Validators.required, noWhitespaceValidator]
      ),
      isExternal: new FormControl({
        value: false,
        disabled: this.disableInputs.isExternal,
      }),
      priority: new FormControl(
        { value: null, disabled: this.disableInputs.priority },
        [Validators.required]
      ),
      dueDate: new FormControl({
        value: null,
        disabled: this.disableInputs.dueDate,
      }),
      initiatedBy: new FormControl(
        { value: this.currentUser, disabled: this.disableInputs.initiatedBy },
        [Validators.required]
      ),
      assignTo: new FormControl(
        { value: null, disabled: this.disableInputs.assignTo },
        [Validators.required]
      ),
      tags: new FormControl({ value: null, disabled: this.disableInputs.tags }),
    });
  }
  setInitialValue() {
    if (this.editingRecommendation) {
      this.dueDates = new Date(this.editingRecommendation.due_date);
      this.questionForm.patchValue({
        subject: this.editingRecommendation.subject,
        description: this.editingRecommendation.description,
        isExternal: this.editingRecommendation.is_external,
        priority: this.priorities.find(
          (p) =>
            p.system_issue_priority_id == this.editingRecommendation.priority
        ),
        dueDate: this.editingRecommendation.due_date
          ? new Date(this.editingRecommendation.due_date)
          : null,
        tags: this.editingRecommendation.tags,
      });
    } else {
      this.questionForm.patchValue({
        priority: this.priorities[1],
        assignTo: this.users.find((user) => user.id == this.currentUser.id),
      });
    }
  }

  setSuggestedDueDate(numDaysToAdd) {
    this.dueDates = this.getSuggestedDueDate(numDaysToAdd);
    this.questionForm.patchValue({
      dueDate: this.getSuggestedDueDate(numDaysToAdd),
    });
  }

  getSuggestedDueDate(numDaysToAdd) {
    const newDate = moment(new Date());
    let count = 0;
    while (numDaysToAdd > 0) {
      newDate.add(1, 'days');
      count++;
      if (newDate.day() !== 0 && newDate.day() !== 6) {
        numDaysToAdd--;
      }
    }
    this.suggestedDate = moment().add(count, 'days').toDate();
    return this.suggestedDate;
  }

  setAssignToAndReportedBy() {
    if (this.editingRecommendation) {
      this.reported_by_list = [
        {
          fullName: this.editingRecommendation.reported_by_name,
          user_id: this.editingRecommendation.reported_by_id,
        },
      ];
      this.questionForm.patchValue({
        initiatedBy: {
          fullName: this.editingRecommendation.reported_by_name,
          user_id: this.editingRecommendation.reported_by_id,
          id: this.editingRecommendation.reported_by_id,
        },
      });
      let tempAssignedTo = this.users.find(
        (e) => e.id == this.editingRecommendation.assigned_to_id
      );
      if (tempAssignedTo) {
        this.questionForm.patchValue({
          assignTo: tempAssignedTo,
        });
      } else {
        let externalUser = {
          fullName: this.editingRecommendation.assigned_to_name,
          user_id: this.editingRecommendation.assigned_to_id,
          id: this.editingRecommendation.assigned_to_id,
        };
        this.users = [...this.users, externalUser];
        this.questionForm.patchValue({ assignTo: externalUser });
      }
    }
  }

  handleAssignUserChange(data) {
    this.questionForm.patchValue({
      assignTo: data,
    });
  }

  handleInitiatedByChange(data) {
    this.questionForm.patchValue({
      initiatedBy: data,
    });
  }

  handleDueDateValue(event) {
    this.questionForm?.patchValue({
      dueDate: event,
    });
  }

  handleSaveClick() {
    validateAllFormFields(this.questionForm);
    if (this.questionForm.valid) {
      const {
        subject,
        description,
        isExternal,
        priority,
        dueDate,
        initiatedBy,
        assignTo,
        tags,
      } = this.questionForm.value;
      let tagids = [];
      if (tags) {
        tags.forEach((tag) => {
          tagids.push(tag?.id);
        });
      }
      if (this.editingRecommendation) {
        let param = {
          issue_id: this.editingRecommendation.id,
          subject: subject,
          description: description,
          is_external: isExternal,
          issue_status: this.editingRecommendation.status,
          issue_priority: priority?.system_issue_priority_id,
          due_date: dueDate
            ? moment(dueDate).format('YYYY-MM-DD HH:mm:ss')
            : null,
          reported_by: this.editingRecommendation.reported_by_id,
          assigned_to: assignTo?.id,
          entity_id: this.entity_id,
          entity_type: this.entity_type,
          diligence_id: this.diligenceId,
          tags: tagids.toString(),
        };
        this.btnLoader = true;
        this.recommendationTrackerService.updateIssue(param).subscribe(
          (res: any) => {
            this.toaster.success(
              this.issueTrackerName + ' updated successfully!'
            );

            res[0].reported_by_id = this.editingRecommendation.reported_by_id;
            res[0].reported_by_name =
              this.editingRecommendation.reported_by_name;
            res[0].assigned_to_id = assignTo?.id;
            res[0].created_date = res[0].created_at;
            res[0].comment_count = this.editingRecommendation.comment_count;
            res[0].diligence_id = this.editingRecommendation.diligence_id;
            res[0].due_date = res[0].due_at;
            res[0].is_internal_diligence =
              this.editingRecommendation.is_internal_diligence;
            this.onUpdate.emit(res);
            this.btnLoader = false;
          },
          (err) => {
            if (
              !(
                err &&
                err.status &&
                Object.values(ErrorStatusCode).includes(err.status)
              )
            ) {
              this.toaster.error(
                this.issueTrackerName + ' not updated. Something went wrong!'
              );
            }
            this.btnLoader = false;
          }
        );
      } else {
        let param = {
          subject: subject,
          description: description,
          is_external: isExternal,
          issue_status:
            this.statuses.find((status) => status.order === 1)
              ?.system_status_id ?? 1,
          issue_priority: priority?.system_issue_priority_id,
          due_date: dueDate
            ? moment(dueDate).format('YYYY-MM-DD HH:mm:ss')
            : null,
          reported_by: initiatedBy.id,
          assigned_to: assignTo?.id,
          entity_id: this.entity_id,
          entity_type: this.entity_type,
          diligence_id: this.diligenceId,
          tags: tagids.toString(),
        };
        this.btnLoader = true;
        this.recommendationTrackerService
          .createIssue(param)
          .pipe(finalize(() => (this.btnLoader = false)))
          .subscribe(
            (res: any) => {
              this.toaster.success(
                this.issueTrackerName + ' created successfully!'
              );
              res[0].reported_by_id = initiatedBy.id;
              res[0].reported_by_name = res[0].created_by_name;
              res[0].assigned_to_id = assignTo?.id;
              res[0].created_date = res[0].created_date;
              res[0].comment_count = 0;
              res[0].diligence_id = this.diligenceId;
              res[0].due_date = res[0].due_at;
              this.onSave.emit(res);
              this.btnLoader = false;
            },
            (err) => {
              if (
                !(
                  err &&
                  err.status &&
                  Object.values(ErrorStatusCode).includes(err.status)
                )
              ) {
                this.toaster.error(
                  this.issueTrackerName + ' not created. Something went wrong!'
                );
              }
              this.btnLoader = false;
            }
          );
      }
    }
  }

  handleOnCancelClick() {
    this.editingRecommendation = null;
    this.onCancel.emit(this.questionForm.touched);
  }

  handleisExternalChange(event) {
    this.questionForm.patchValue({
      assignTo: null,
      isExternal: event,
    });
    if (event) {
      this.users = [...this.externalUsers];
      if (this.users.length < 1) {
        this.toaster.info('No external contacts available');
      }
    } else {
      this.users = [...this.internalUsers];
    }
  }

  handleTagsChange(event) {
    this.questionForm.patchValue({
      tags: event,
    });
  }

  handleChange(event) {
    this.questionForm.patchValue({
      priority: event,
    });
  }

  goToTags() {
    this.router.navigate('app.firm.settings.all_tags');
  }
}
