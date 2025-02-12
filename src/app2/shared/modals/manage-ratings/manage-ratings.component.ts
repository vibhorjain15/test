import { Component, Input, OnInit, ViewChild } from '@angular/core';
import * as moment from 'moment';
import { ToastrService } from 'ngx-toastr';
import { CustomFieldsService } from 'src/app2/services/custom-fields.service';
import { DueDiligenceDataService } from 'src/app2/services/duediligence-data-service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { CustomFieldSelectionComponent } from '../../components/custom-field-selection/custom-field-selection.component';
import { EditableOnlyScoreComponent } from '../../components/editable-only-score/editable-only-score.component';
import {
  diligenceStatusConstant,
  dvThresholds,
  ratingConstants,
  responseStatus,
} from '../../constants/constant';
import { Store } from '@ngxs/store';

import { BsModalRef } from 'ngx-bootstrap/modal';

import { Subscription, interval } from 'rxjs';
@Component({
  selector: 'app-manage-ratings',
  templateUrl: './manage-ratings.component.html',
  styleUrls: ['./manage-ratings.component.css'],
})
export class ManageRatingsModal implements OnInit {
  @Input() entityType: any;
  @Input() entityId: Number;
  @Input() subEntityId: Number;
  @Input() rating: any;
  @Input() readonly: boolean;
  @Input() ratingScales: any[];
  @Input() naValue: any;
  @Input() enableReview: boolean;
  @Input() enable_tracking: boolean;
  @Input() functions: any[];
  @Input() assignedFunctions: any[];
  @Input() diligenceType: any;
  @Input() response: any;
  @Input() diligence;
  isFree: boolean;
  loading: boolean;
  showReviewStatusPanel: boolean = false;
  current_user: any;
  @ViewChild('fields')
  customFieldsComponent: CustomFieldSelectionComponent;
  reviewButtonShow: {
    edit: boolean;
    decline: boolean;
    accept: boolean;
    updateverifier: boolean;
    addverifier: boolean;
  };
  ratingConstants = ratingConstants;
  responseStatus = responseStatus;
  dvThresholds = dvThresholds;
  value_attr: string;
  loading_custom_fields: boolean;
  customFields: any;
  assignments;
  activeSection;
  @ViewChild('editableScore')
  scoreComponent: EditableOnlyScoreComponent;
  previousFields: any[];
  diligenceStatusConstant = diligenceStatusConstant;
  observableSubscriptions: Subscription;
  rejectedRating = [];
  approvedRating = [];
  time = dvThresholds.REVIEW_UNDO;
  subscription;
  constructor(
    private readonly Utils: UtilsService,
    private readonly customFieldsService: CustomFieldsService,
    private readonly SweetAlert: SweetAlertService,
    private readonly toaster: ToastrService,
    private readonly dueDiligenceDataService: DueDiligenceDataService,
    private readonly ModalFactory: CustomModalService,
    private readonly store: Store,
    private modalService: BsModalRef
  ) {}

  ngOnInit(): void {
    this.reviewButtonShow = {
      edit: false,
      decline: false,
      accept: false,
      updateverifier: false,
      addverifier: false,
    };
    if (this.rating.mode === this.ratingConstants.Absolute) {
      this.value_attr = 'rating_value';
    } else {
      this.value_attr = 'score_value';
    }
    this.current_user = this.store.selectSnapshot(
      (state) => state.user.currentUser
    );

    this.rating['verifierEdit'] = false;

    this.loadCustomFieldsData();
    this.updateRatingIcons(true);

    this.isFree = this.Utils.isFreeSubscription();
  }

  getAssignments() {
    this.activeSection = this.store.selectSnapshot(
      (state) => state.questionnaire.activeSection
    );
    this.dueDiligenceDataService
      .getReviewerForSection(this.diligence.id, this.activeSection.id)
      .subscribe((assignments) => {
        this.assignments = assignments;
        this.updateRatingIcons();
      });
  }

  updateRatingIcons(firstLoad = false) {
    if (!firstLoad) {
      this.rating.assignments = null;
      if (this.assignments?.length)
        this.rating.assignments = this.assignments?.find(
          (assign) => assign.entity_id === this.rating.attributes.rating_id
        );
    }

    if (!this.rating.assignments) {
      this.rating['activeStep'] = null;
      this.rating['assignmentObj'] = null;
      this.approvedRating = [];
      this.rejectedRating = [];
      // code if no reviewer is assigned
    } else {
      this.approvedRating = [];
      this.rejectedRating = [];
      this.rating.assignments?.steps.forEach((step) => {
        step.assignments.forEach((assign) => {
          if (assign.status === responseStatus.REVIEWSUCCESS)
            this.approvedRating.push(assign);
          else if (assign.status === responseStatus.REVIEWFAILED)
            this.rejectedRating.push(assign);
        });
      });
      let activeStep = this.rating.assignments.steps.find(
        (step) => step.status === responseStatus.INREVIEW
      );
      if (activeStep) {
        this.rating['activeStep'] = activeStep;
        const verifiers = this.rating['activeStep'].assignments;
        this.rating['assignmentObj'] = this.Utils.isAssignedToUser(
          verifiers,
          this.diligence.myFunction
        );
      } else {
        this.rating['activeStep'] = null;
        this.rating['assignmentObj'] = null;
      }
    }
  }

  loadCustomFieldsData() {
    this.loading_custom_fields = true;
    const payload = {
      entity_id: this.entityId,
      entity_type: this.entityType,
      schema_type: 'rating',
      sub_entity_id: this.subEntityId,
    };
    this.customFieldsService
      .getCustomFieldsData(payload)
      .subscribe((response: any) => {
        this.customFields = response.data;
        this.previousFields = [...this.customFields];
        this.loading_custom_fields = false;
      });
  }

  checkConditionsForDisplayingReview(button: any) {
    this.reviewButtonShow[button] = false;
    if (this.rating.assignmentObj && this.rating.assignmentObj?.is_completed) {
      const completed_at = moment(this.rating.assignmentObj.completed_at);
      this.rating.timeDiff = moment().diff(completed_at, 'milliseconds');
    }

    switch (button) {
      case 'edit':
        if (
          this.rating?.assignmentObj?.status === responseStatus.INREVIEW &&
          !this.rejectedRating.length
        ) {
          this.reviewButtonShow[button] = true;
          return true;
        }
        return false;
      case 'decline':
        if (
          this.rating?.assignmentObj?.status === responseStatus.INREVIEW &&
          !this.rejectedRating.length
        ) {
          this.reviewButtonShow[button] = true;
          return true;
        }
        return false;
      case 'addverifier':
        if (!this.rating.assignments) {
          this.reviewButtonShow[button] = true;
          return true;
        }
        return false;
      case 'updateverifier':
        if (
          this.rating.assignments &&
          (!this.rating['assignmentObj'] ||
            this.rating['assignmentObj'].status !== responseStatus.INREVIEW)
        ) {
          this.reviewButtonShow[button] = true;
          return true;
        }
        return false;

      case 'accept':
        if (
          this.rating?.assignmentObj?.status === responseStatus.INREVIEW &&
          !this.rejectedRating.length
        ) {
          this.reviewButtonShow[button] = true;
          return true;
        }
        return false;

      case 'sendForVerify':
        if (
          this.rejectedRating.length &&
          typeof this.rating.timeDiff === 'number' &&
          this.rating.timeDiff > this.dvThresholds.REVIEW_TIMELIMIT
        ) {
          this.reviewButtonShow[button] = true;
          return true;
        }
        return false;

      case 'undo':
        if (
          this.rating.timeDiff <= this.dvThresholds.REVIEW_TIMELIMIT &&
          [responseStatus.REVIEWFAILED, responseStatus.REVIEWSUCCESS].includes(
            this.rating.assignmentObj.status
          )
        ) {
          this.reviewButtonShow[button] = true;
          return true;
        }
        return false;

      case 'editable':
        if (
          (!this.enableReview && !this.readonly) ||
          (this.enableReview &&
            (!this.rating.assignments ||
              this.rating.verifierEdit ||
              (this.rating.attributes.rating_status ===
                this.responseStatus.REVIEWSUCCESS &&
                typeof this.rating.timeDiff === 'number' &&
                this.rating.timeDiff > this.dvThresholds.REVIEW_TIMELIMIT) ||
              (this.rejectedRating.length &&
                typeof this.rating.timeDiff === 'number' &&
                this.rating.timeDiff > this.dvThresholds.REVIEW_TIMELIMIT)))
        ) {
          this.reviewButtonShow[button] = true;
          return true;
        }
        return false;

      default:
        return false;
    }
  }

  undoVerification(status: 'undo' | 'complete') {
    this.subscription?.unsubscribe();
    if (status === 'undo')
      this.updateResponseStatus(this.responseStatus.INREVIEW).subscribe(
        (response) => {
          this.rating.assignmentObj.is_completed = false;
          this.rating.assignmentObj.status = responseStatus.INREVIEW;
          this.rating.assignmentObj.completed_by_name = '';
          this.rating.assignmentObj.completed_by = '';
          this.rating.assignmentObj.completed_at = null;
        }
      );
    else this.getAssignments();
  }

  onRatingChange(value) {
    this.rating.attributes.rating_value = value;
  }

  onScoreChange(value) {
    this.rating.attributes.score_value = value;
  }

  editResponse() {
    this.rating.verifierEdit = !this.rating.verifierEdit;
  }

  verifyRequest() {
    if (this.checkCustomFieldsHasTracking()) {
      this.showTrackingWarning();
    } else {
      this.verifyRating();
    }
  }

  updateResponseStatus(status) {
    return this.dueDiligenceDataService.updateResponseStatus(
      this.rating.attributes.rating_id,
      status,
      this.entityId,
      this.rating.assignments.id,
      this.rating.activeStep.id,
      this.rating.assignmentObj.id
    );
  }

  reviewAgain() {
    this.updateResponseStatus(this.responseStatus.INREVIEW).subscribe(
      (response: any) => {
        this.rating.assignmentObj.status = this.responseStatus.INREVIEW;
        this.rating.assignmentObj.is_completed = false;
        this.rating.assignmentObj.completed_by_name = '';
        this.rating.assignmentObj.completed_by = '';
        this.rating.assignmentObj.completed_at = null;
        this.updateRatingIcons();
      }
    );
  }

  checkCustomFieldsHasTracking() {
    let field: any;
    for (let i = 0; i < this.previousFields.length; i++) {
      field = this.previousFields[i];
      if (
        field.type === 'textmultiline' &&
        field.value[0].value.indexOf('<span class="ice') > -1
      ) {
        return true;
      }
    }
    return false;
  }

  showTrackingWarning() {
    this.SweetAlert.error({
      title: 'You have pending tracking changes',
      text: 'Please accept or reject the changes and save before marking this rating as reviewed',
    });
  }

  verifyRating() {
    this.rating.verifierEdit = false;
    this.updateResponseStatus(this.responseStatus.REVIEWSUCCESS).subscribe(
      (response: any) => {
        this.rating.assignmentObj.status = this.responseStatus.REVIEWSUCCESS;
        this.rating.assignmentObj.is_completed = true;
        this.rating.assignmentObj.completed_by_name =
          this.current_user.fullName;

        this.rating.assignmentObj.completed_by = this.current_user.id;
        this.rating.assignmentObj.completed_at = this.Utils.formatDatetimeUtc(
          moment.utc()
        );
        const message = 'Rating successfully verified';
        this.toaster.success(message);
        this.time = dvThresholds.REVIEW_UNDO;
        this.subscription = interval(1000).subscribe(() => {
          this.time--;
          if (this.time <= 0) {
            this.undoVerification('complete');
          }
        });
      }
    );
  }

  rejectRating() {
    this.rating.verifierEdit = false;
    this.updateResponseStatus(this.responseStatus.REVIEWFAILED).subscribe(
      (response: any) => {
        this.rating.assignmentObj.status = this.responseStatus.REVIEWFAILED;
        this.rating.assignmentObj.is_completed = true;
        this.rating.assignmentObj.completed_by_name =
          this.current_user.fullName;

        this.rating.assignmentObj.completed_by = this.current_user.id;
        this.rating.assignmentObj.completed_at = this.Utils.formatDatetimeUtc(
          moment.utc()
        );
        const message = 'Revision Requested';
        this.toaster.success(message);
        this.time = dvThresholds.REVIEW_UNDO;
        this.subscription = interval(1000).subscribe(() => {
          this.time--;
          if (this.time <= 0) {
            this.undoVerification('complete');
          }
        });
      }
    );
  }

  openVerifierModal() {
    if (this.rating.attributes[this.value_attr]) {
      if (this.showReviewStatusPanel) this.reviewStatusPanel();
      this.ModalFactory.invoke('assign-reviewer', {
        initialState: {
          type: this.rating.assignments ? 'Rating' : 'RatingAdd',
          newDefinition: this.rating.assignments,
          response: this.rating,
          success: (response) => {
            this.getAssignments();
          },
        },
        class: 'modal-lg',
      });
    }
  }

  submit(modalCallback) {
    if (
      this.customFieldsComponent &&
      !this.customFieldsComponent.isFormValid()
    ) {
      return;
    }
    if (this.scoreComponent && !this.scoreComponent.isScoreValid()) {
      return;
    }
    this.loading = true;
    const addedFields = this.customFieldsComponent?.getAddedFields();
    const response = {
      rating: this.rating,
      customFields: addedFields ?? [],
    };
    this.rating.verifierEdit = false;
    if (this.response) {
      this.response(response);
    }
    this.loading = false;
    modalCallback();
  }

  closeModal(modalCallback) {
    if (this.response) {
      const data = {
        rating: this.rating,
        cancelClick: true,
      };
      this.response(data);
    }
    modalCallback();
  }

  reviewStatusPanel() {
    this.showReviewStatusPanel = !this.showReviewStatusPanel;
    if (this.showReviewStatusPanel) {
      this.modalService.setClass('modal-xl');
    } else {
      this.modalService.setClass('modal-md');
    }
  }
}
