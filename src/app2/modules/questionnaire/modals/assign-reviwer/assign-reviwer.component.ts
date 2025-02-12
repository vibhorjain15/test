import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Select, Store } from '@ngxs/store';
import * as moment from 'moment';
import { QuestionnaireService } from 'src/app2/apis/questionnaire/questionnaire.service';
import { DiligenceType } from 'src/app2/apis/questionnaire/type/diligence.type';
import { UtilsService } from 'src/app2/services/utils.service';
import { UserModel } from 'src/app2/store/user/user.model';
import { keywordConstants } from 'src/app2/shared/constants/constant';
import { diligenceStatusConstant } from '../../constants/quick-view-headers.constant';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { ToastrService } from 'ngx-toastr';
import { UserState } from 'src/app2/store/user/user.state';
import { StateDiligenceUpdateType } from '../../store/questionnaire.modal';
import { ReviewType, TaskType } from '../../constants/question-status.constant';
import {
  assignReviewer,
  entity_type_investor,
  entity_type_manager,
  subcategoryFilter,
} from '../../types/assign-reviewer.type';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { DvDraftService } from '../../service/draft.service';
import {
  UpdateDraftData,
  getReviewAssignments,
  TriggerSilentReload,
  GetQuestionCount,
  GetReviewers,
} from '../../store/questionnaire.action';
import { takeUntil, take } from 'rxjs/operators';
import { Subject } from 'rxjs';
import {
  Definition,
  Step,
} from 'src/app2/shared/models/review-definitions.model';
import { ReviewDefinitionStepsMultipleComponent } from 'src/app2/shared/components';
import { QuestionAttributeType } from '../../types/questions.type';
import { SidePanelService } from 'src/app2/services/side-panel.service';
import { AssignReviewerService } from './assign-reviewer.service';
import { ReviewDefinitionsService } from 'src/app2/services/review-definitions/review-definitions.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { QuestionnaireStatusService } from '../../service/status.service';

/*
This modal opens up at 4 different levels.
  1. Project level (Only assignment is possible)
  2. Section level (Only assignment is possible)
  3. Question level (Assignment and updation possible)
  4. Rating level (Assignment and updation possible)
*/
@Component({
  selector: 'assign-reviwer',
  templateUrl: './assign-reviwer.component.html',
  styleUrls: ['./assign-reviwer.component.css'],
})
export class AssignReviwerComponent implements OnInit, OnDestroy {
  @Input() success;
  @Input() type:
    | 'Question'
    | 'Project'
    | 'Section'
    | 'Rating'
    | 'QuestionAdd'
    | 'RatingAdd' = 'Project'; // type == question/rating means to update the existing assigned questionLevel/ratingLevel reviewer and QuestionAdd/RatingAdd means to add new reviewers (Over writing existing ones).
  @Input() response: any;
  @Input() question: QuestionAttributeType;
  @ViewChild('steps') steps: ReviewDefinitionStepsMultipleComponent;
  @Input() newDefinition: Definition = {} as Definition;
  @Input() deleteButtonDisabled: boolean;
  @Select(UserState.getFirmPreferenceData) firmData;
  firmPref;
  verificationType;
  categories: any[] = [];
  categoryCopy: any[];
  firstButtonLabel: string;
  secondButtonLabel: string;
  selectedButton:
    | assignReviewer.Newly_Assign
    | assignReviewer.Copy_Reviewer
    | assignReviewer.definition = assignReviewer.Newly_Assign;
  selectedSubcategoryList: any[] = [];
  assignReviewerConstants = assignReviewer;
  starting_review_second: boolean;
  isManager: boolean;
  definitions: Definition[];
  isInvestor: boolean;
  user: UserModel;
  diligence: DiligenceType & StateDiligenceUpdateType;
  team_role_list: any[] = [];
  loading: boolean = true;
  firm_pref: any;
  entity_id: any;
  entity_type: any;
  funds: any = {};
  keywordConstants = keywordConstants;
  firms: any = {};
  fund_list: any;
  firm_list: any;
  vehiclesList: any;
  strategiesList: any;
  filterId: string = 'all'; // for all sub-category and categories
  vehicles: any = {};
  strategies: any = {};
  source_diligence = null;
  diligencesBackup: any;
  diligences: any;
  loadingVerifiers: boolean;
  fetchDefinition: boolean;
  starting_review: boolean;
  verifiersForProject: any;
  assigned_to_user: any;
  reviewStarted: boolean = true; // Can only access modal when review has been started now
  defaultReviewer;
  editMode: boolean = false;
  freeUser: boolean;
  duplicateDefName: boolean;
  newDefName: string;
  selectedDefinition: Definition = null;
  private ngUnsubscribe = new Subject<void>();
  filterList = subcategoryFilter;
  secondLoader: boolean;
  entity_types = entity_type_investor;
  maxDate = new Date();
  handleShowSaveDefCheck: boolean = false;
  objectValues = Object.values;
  selectedDefJson;
  entityLabel: string;
  showUpdateButtonVar: boolean;
  //form controls
  @ViewChild('newReview') newReviewForm: NgForm;
  @ViewChild('copyForm') copyForm: NgForm;
  dueDate: any = moment().add(10, 'days').toDate();
  minDate = moment().subtract(5, 'years').toDate();

  selectedUser: any;
  diligenceFilters: any;
  selected_filter = 4;
  customDateFilter: any = {};
  selectEntityType: any;
  projectAssignedUser: any[];
  diligenceFiltered;
  constructor(
    private store: Store,
    private readonly questionnaire: QuestionnaireService,
    readonly util: UtilsService,
    private modalService: BsModalRef,
    private readonly toaster: ToastrService,
    private readonly sweetAlert: SweetAlertService,
    private readonly draftService: DvDraftService,
    private readonly sidePanelService: SidePanelService,
    private readonly reviewerService: AssignReviewerService,
    private readonly reviewService: ReviewDefinitionsService,
    private readonly mainModal: BsModalRef,
    private readonly status: QuestionnaireStatusService
  ) {}

  ngOnInit(): void {
    // Initializing data

    this.loading = true;
    this.user = this.store.selectSnapshot((state) => state.user);
    this.freeUser = this.util.isFreeSubscription();
    if (!this.freeUser) this.firstButtonLabel = '(s)';
    else this.firstButtonLabel = '';
    this.diligence = this.store.selectSnapshot(
      (state) => state.questionnaire.diligence
    );
    this.reviewerService.updateData(this.diligence, this.user);
    this.isManager = this.user.currentUser.isManager;
    this.isInvestor = this.user.currentUser.isInvestor;
    this.reviewerService
      .getFunctions()
      .subscribe((response) => (this.team_role_list = response));

    this.firmData
      .pipe(take(2))
      .subscribe((firmPref) => (this.firmPref = firmPref));

    // Adding a step to definition var if empty
    if (!this.newDefinition || Object.keys(this.newDefinition).length === 0) {
      this.newDefinition = {} as Definition;
      this.newDefinition.steps = [];
      this.newDefinition.steps.push(this.addStep());
    }

    // To fetch the needed categories and subcategories (ONLY FOR PROJECT AND SECTION LEVEL MODALS)
    if (this.type == 'Project' || this.type === 'Section') {
      if (this.type === 'Project') this.getDefinitions();
      this.reviewService.getReviewFilters().subscribe((filters: any) => {
        this.diligenceFilters = filters.filter((x) => {
          let selectedValue = true;
          if (
            !this.firmPref.enable_es_autofill ||
            this.isInvestor ||
            this.freeUser
          ) {
            // If es autofill is not enabled then remove the 100% criteria
            selectedValue &&= x.name !== 'PartialMatchAutofill';
            if (x.name === 'ExactMatchAutofill')
              x.display_name = 'Auto-filled Responses';
          }
          if (this.isManager) {
            selectedValue &&= x.name !== 'Flag';
          } else if (this.isInvestor && !this.diligence.is_internal) {
            // Remove all autofill filters for investor external projects
            selectedValue &&=
              x.name !== 'ExactMatchAutofill' &&
              x.name !== 'PartialMatchAutofill' &&
              x.name !== 'RevisedAutofill' &&
              x.name !== 'Manual';
          }
          return selectedValue;
        });
        this.loading = false;
      });

      if (this.isManager) this.entity_types = entity_type_manager;

      if (this.store.selectSnapshot((state) => state.questionnaire.categories))
        this.categories = JSON.parse(
          JSON.stringify(
            this.store.selectSnapshot((state) =>
              Object.values(state.questionnaire.categories)
            )
          )
        );

      this.categoryCopy = this.reviewerService.getCategories(this.categories);

      this.projectAssignedUser = [];
    } else this.loading = false;

    if (this.type === 'Section') {
      this.setSectionData();
    }

    this.updateSecondButtonLabel();
  }

  handleEntityTypeChange(entity) {
    this.setEntityType(entity.id);
  }

  getEntityName() {
    if (this.isManager && this.entity_type === 'Firm')
      this.entityLabel = 'Firm Name';
    else if (this.util.getDisplayEntityType(this.entity_type) === 'MyFirm')
      this.entityLabel = 'My Firm';
    else
      this.entityLabel =
        'Select ' + this.util.getDisplayEntityType(this.entity_type);
  }

  updateSubcategoriesList(subList, catId) {
    this.selectedSubcategoryList[catId] = subList;
  }

  setSectionData() {
    this.filterId = 'select';

    this.categoryCopy.find((cat) => {
      return cat.list.find((subcat) => {
        if (subcat.id === this.response.id) {
          subcat.isSelected = true;
          if (cat.list.length === 1) cat.isCatSelected = true;
          return true;
        }
      });
    });
  }

  handleFilterChange(filterId) {
    if (filterId == 'all') this.modalService.setClass('modal-lg');
    else this.modalService.setClass('modal-xl');
  }

  getDefinitions() {
    this.questionnaire.getReviewDefinitions().subscribe(
      (definitions: Definition[]) => {
        this.definitions = definitions;
        this.loading = false;
      },
      (err) => (this.loading = false)
    );
  }

  handleChangeProjectAssignedUser(value) {
    if (value.length) this.projectAssignedUser = value;
    else {
      // keep the old value
      this.assigned_to_user = this.projectAssignedUser;
      this.sweetAlert
        .confirm({
          title: `Are you sure you want to remove ${this.projectAssignedUser[0].name} as a reviewer?`,
        })
        .then((isConfirm) => {
          if (isConfirm.value) {
            // if deletion is confirmed, remove the selection
            this.assigned_to_user = this.projectAssignedUser = [];
          }
        });
    }
  }

  toggleButton(label) {
    this.selectedButton = label;
    this.updateSecondButtonLabel();
    this.filterId = 'all';
    if (label == assignReviewer.Copy_Reviewer) {
      this.modalService.setClass('modal-md');
      this.secondLoader = true;
      this.getDiligences();
    } else {
      this.selectedDefinition = null;
      this.handleShowSaveDefCheck = false;
      this.modalService.setClass('modal-lg');
    }
  }

  updateSecondButtonLabel() {
    this.secondButtonLabel = '';
    if (
      (this.selectedButton === this.assignReviewerConstants.definition ||
        this.handleShowSaveDefCheck) &&
      !this.freeUser &&
      this.type === 'Project'
    ) {
      if (
        this.selectedButton === this.assignReviewerConstants.definition &&
        !this.handleShowSaveDefCheck
      ) {
        if (this.showUpdateButtonVar)
          this.secondButtonLabel =
            'Update & Assign Reviewer' + this.firstButtonLabel;
      } else
        this.secondButtonLabel =
          'Save & Assign Reviewer' + this.firstButtonLabel;
    } else if (this.type === 'Question' || this.type === 'Rating') {
      this.secondButtonLabel = 'Delete Reviewer' + this.firstButtonLabel;
    }
  }

  onEntityChanged(entity) {
    this.entity_id = entity.id;
    this.source_diligence = [];
    this.verifiersForProject = [];
    this.filterDiligences();
  }

  handleDateChange(date) {
    this.dueDate = date;
  }

  submit() {
    if (this.type != 'Question' && this.type != 'Rating') {
      let title =
        'Are you sure you want to assign reviewer? all your unsaved changes will be lost';
      this.draftService.showCountAlert(
        () => {
          this.handleAssignReview();
        },
        () => {
          this.handleAssignReview();
          this.store.dispatch(new UpdateDraftData(null));
        },
        title,
        undefined,
        'Save & Assign',
        `Don't save & assign`
      );
    } else this.handleAssignReview();
  }

  handleAssignReview() {
    if (this.selectedButton == assignReviewer.Copy_Reviewer) {
      if (this.copyForm.valid) {
        this.copyReviewer();
      }
    } else {
      if (
        this.newReviewForm.valid ||
        this.selectedButton === this.assignReviewerConstants.definition
      ) {
        this.assignReviewer();
      }
    }
  }
  getEntityObject(list, id) {
    return list?.find((x) => x.id == id);
  }

  getEntityTypeObject() {
    return this.entity_types.find((e) => e.id == this.entity_type);
  }

  handleRangeDate(date) {
    if (date && date.endDate && date.startDate) {
      let start_date = new Date(date.startDate);
      let end_date = new Date(date.endDate);
      this.diligenceFiltered = this.diligencesBackup.filter((diligence) => {
        let date = new Date(diligence.created_at);
        if (date >= start_date && date <= end_date) return true;
      });
    } else {
      this.diligenceFiltered = this.diligencesBackup;
    }
    this.generateEntities();
    this.filterDiligences();
    this.secondLoader = false;
  }

  getFirmPref() {
    if (!this.firm_pref) {
      this.loading = true;
      this.firmData
        .pipe(takeUntil(this.ngUnsubscribe))
        .subscribe((res: any) => {
          this.firm_pref = res;
          this.customDateFilter = this.util.getPredefinedDateRanges(
            res.default_daterange_months
          );
          this.customDateFilter.range = res.default_daterange_months;
          let dateFilter = this.util
            .getDateRanges()
            .find(
              (x) =>
                (x.value == 'null' ? null : x.value) ==
                res?.default_daterange_months
            )?.label;
          this.customDateFilter.selectedRange = dateFilter;

          if (
            this.customDateFilter.selectedRange == 'No Filter' ||
            !this.customDateFilter.selectedRange
          ) {
            this.customDateFilter.startDate = null;
            this.customDateFilter.endDate = null;
            this.customDateFilter.range = null;
          }
          this.handleRangeDate(this.customDateFilter);
          if (
            this.isManager &&
            this.diligence.entity_type == keywordConstants.Firm
          )
            this.setEntityType(keywordConstants.MyFirm);
          else
            this.setEntityType(
              this.diligence.entity_type,
              this.diligence.entity_id
            );
          this.loading = false;
          this.secondLoader = false;
        });
    } else this.secondLoader = false;
  }

  setEntityType(entity_type, entity_id?) {
    this.entity_type = entity_type;
    this.entity_id = entity_id ? entity_id : null;
    this.source_diligence = null;
    if (this.entity_type == keywordConstants.MyFirm)
      this.entity_id = this.user.currentUser.firmInfo.id;
    else if (this.entity_type == keywordConstants.Product && !this.entity_id) {
      let fundKeys = Object.keys(this.funds);
      this.entity_id = fundKeys.length > 0 ? this.funds[fundKeys[0]].id : null;
    } else if (this.entity_type == keywordConstants.Firm && this.entity_id) {
      let firmKeys = Object.keys(this.firms);
      this.entity_id = firmKeys.length > 0 ? this.firms[firmKeys[0]].id : null;
    } else if (
      this.entity_type == keywordConstants.Vehicle &&
      !this.entity_id
    ) {
      let vKeys = Object.keys(this.vehicles);
      this.entity_id = vKeys.length > 0 ? this.vehicles[vKeys[0]].id : null;
    } else if (
      this.entity_type == keywordConstants.Strategy &&
      !this.entity_id
    ) {
      let stratKeys = Object.keys(this.strategies);
      this.entity_id =
        stratKeys.length > 0 ? this.strategies[stratKeys[0]].id : null;
    }
    if (this.diligenceFiltered) this.filterDiligences();
    this.getEntityName();
  }

  filterDiligences() {
    this.diligences = this.diligenceFiltered.filter(
      (diligence) => diligence.entity_id == this.entity_id
    );
  }

  getDiligences() {
    let params = {
      diligence_id: this.diligence.id,
      task_type:
        this.diligence.status == diligenceStatusConstant.Completed ||
        this.diligence.status == diligenceStatusConstant.Evaluation
          ? ReviewType.Evaluation
          : ReviewType.InReview,
      start_date: this.customDateFilter?.start_date,
      end_date: this.customDateFilter?.end_date,
    };
    return this.questionnaire.getDiligences(params).subscribe(
      (res) => {
        this.diligencesBackup = res;
        this.getFirmPref(); // To get the needed date range
      },
      (err) => (this.secondLoader = false)
    );
  }

  handleDefinitionChange(definition) {
    this.fetchDefinition = true;
    this.showUpdateButtonVar = false;
    this.selectedDefJson = null;
    this.questionnaire
      .fetchDefinitionById(definition.id)
      .subscribe((definitionStep: Definition) => {
        this.fetchDefinition = false;
        this.selectedDefinition = definitionStep;
        this.selectedDefinition.steps = this.selectedDefinition.steps.sort(
          (a, b) => a.order - b.order
        );
        this.selected_filter = this.selectedDefinition.review_filter_id;
        this.newDefName = this.selectedDefinition.name;
        if (!this.selectedDefinition.steps.length)
          this.selectedDefinition.steps.push(this.addStep());
        this.showUpdateButtonVar = false;
        this.updateSecondButtonLabel();
      });
  }

  handleUpdateStep() {
    if (
      this.selectedButton === this.assignReviewerConstants.definition &&
      !this.selectedDefJson
    )
      this.selectedDefJson = this.steps?.getChanges();
  }

  generateEntities() {
    this.firms = {};
    this.funds = {};
    this.vehicles = {};
    this.strategies = {};
    this.firm_list = [];
    this.strategiesList = [];
    this.fund_list = [];
    this.vehiclesList = [];
    this.diligencesBackup.forEach((diligence) => {
      if (diligence.entity_type == keywordConstants.Product)
        this.funds[diligence.entity_name] = {
          id: diligence.entity_id,
          type: diligence.entity_type,
          name: diligence.entity_name,
        };
      else if (diligence.entity_type == keywordConstants.Firm) {
        this.firms[diligence.entity_name] = {
          id: diligence.entity_id,
          type: diligence.entity_type,
          name: diligence.entity_name,
        };
      } else if (diligence.entity_type == keywordConstants.Vehicle) {
        this.vehicles[diligence.entity_name] = {
          id: diligence.entity_id,
          type: diligence.entity_type,
          name: diligence.entity_name,
        };
      } else if (
        diligence.entity_type == keywordConstants.Strategy &&
        diligence.entity_name
      ) {
        this.strategies[diligence.entity_name] = {
          id: diligence.entity_id,
          type: diligence.entity_type,
          name: diligence.entity_name,
        };
      }
    });
    this.firm_list = Object.values(this.firms);
    this.fund_list = Object.values(this.funds);
    this.vehiclesList = Object.values(this.vehicles);
    this.strategiesList = Object.values(this.strategies);
  }

  getVerifiers(element) {
    this.source_diligence = element;
    if (this.source_diligence) {
      this.loadingVerifiers = true;
      let params = {
        task_type:
          this.diligence.status == diligenceStatusConstant.Completed ||
          this.diligence.status == diligenceStatusConstant.Evaluation
            ? TaskType.Evaluation
            : TaskType.Inreview,
      };
      this.questionnaire
        .getReviewers(this.source_diligence.id, params)
        .subscribe(
          (res: any) => {
            if (res)
              this.verifiersForProject = res.filter(
                (value) => value.fullName && value.fullName !== ' '
              );
            this.loadingVerifiers = false;
          },
          (error) => (this.loadingVerifiers = false)
        );
    }
  }

  copyReviewer() {
    if (this.diligence && this.diligence.id) {
      this.starting_review = true;
      let params = {
        review_type:
          this.diligence.status == diligenceStatusConstant.Completed ||
          this.diligence.status == diligenceStatusConstant.Evaluation
            ? ReviewType.Evaluation
            : ReviewType.InReview,
        diligence_id: this.diligence.id,
        source_diligence_id: this.source_diligence.id,
      };
      this.questionnaire.copyReviewers(this.diligence.id, params).subscribe(
        (res) => {
          this.toaster.success('Reviewers copied');
          this.status.destroyActiveEditorInstace();
          this.starting_review = false;
          this.starting_review_second = false;
          this.store.dispatch(new TriggerSilentReload(Math.random()));
          this.mainModal.hide();
        },
        (error) => {
          this.starting_review = false;
        }
      );
    }
  }

  assignReviewerModal() {
    let saveDefCheck = null;
    if (this.type === 'Project') {
      if (this.handleShowSaveDefCheck) saveDefCheck = 'saveDef';
      else saveDefCheck = 'updateDef';
    } else saveDefCheck = 'deleteDef';
    this.assignReviewer(saveDefCheck);
  }

  assignReviewer(saveDefCheck: 'saveDef' | 'updateDef' | 'deleteDef' = null) {
    if (saveDefCheck) this.starting_review_second = true;
    else this.starting_review = true;
    if (saveDefCheck === 'deleteDef') {
      this.showDeleteReviewerAlert();
      return;
    }

    let valid = this.steps?.checkValid();
    if (!valid) {
      if (!this.steps) this.toaster.error('Please select a definition');
      else this.toaster.error('Please enter valid values');
      this.starting_review = false;
      this.starting_review_second = false;
      return;
    } else if (valid && (this.type == 'Project' || this.type === 'Section')) {
      let activeSteps = [];
      this.steps.getChanges(false, false).forEach((step) => {
        let tempStep = step;
        tempStep.id = tempStep.id ?? 0;
        tempStep.assignments = step.assignments.filter(
          (assignment) => assignment.is_active
        );
        if (tempStep.assignments.length && step.is_active)
          activeSteps.push(tempStep);
      });
      if (!activeSteps.length) {
        this.toaster.error('Please enter valid data');
        this.starting_review = false;
        this.starting_review_second = false;
        return;
      }
      let params = {
        steps: activeSteps,
        entity_ids: [this.diligence.id],
        review_type:
          this.diligence.status == diligenceStatusConstant.Completed ||
          this.diligence.status == diligenceStatusConstant.Evaluation
            ? ReviewType.Evaluation
            : ReviewType.InReview,
        review_filter_id: this.selected_filter,
        entity_type: 'DueDiligence',
      };

      if (this.filterId == 'select') {
        let selectedSubcategory = [];
        for (let category of this.categoryCopy) {
          for (let subcategory of category.list)
            if (category.isCatSelected || subcategory.isSelected)
              selectedSubcategory.push(subcategory.id);
        }
        params.entity_type = 'Section';
        params.entity_ids = selectedSubcategory;
        if (!selectedSubcategory.length) {
          this.toaster.error('Please select categories or subcategories');
          this.starting_review = false;
          this.starting_review_second = false;
          return;
        }
      }

      if (saveDefCheck) this.UpdateSaveAssign(params, saveDefCheck);
      else this.addReviewer(params);
    } else this.assignReview();
  }

  assignReview() {
    let activeSteps = [];
    // Method to check if there are active steps being submitted or not
    this.steps.getChanges(false, false).forEach((step) => {
      let tempStep = step;
      tempStep.id = tempStep.id ?? 0;
      tempStep.assignments = step.assignments.filter(
        (assignment) => assignment.is_active
      );
      if (tempStep.assignments.length && step.is_active)
        activeSteps.push(tempStep);
    });

    if (!activeSteps.length) {
      this.toaster.error('Please enter valid data');
      this.starting_review = false;
      this.starting_review_second = false;
      return;
    }

    let params = {
      steps: this.steps.getChanges(false, false),
      entity_ids: [this.response.id],
      review_type:
        this.diligence.status == diligenceStatusConstant.Completed ||
        this.diligence.status == diligenceStatusConstant.Evaluation
          ? ReviewType.Evaluation
          : ReviewType.InReview,
      review_filter_id: 1, // The id 1 is for all responses filter and it has no significance at question/rating level
      entity_type: 'Response',
    };

    if (this.type === 'Question') {
      this.updateQuestionLevelReviewers(params);
    } else if (this.type === 'QuestionAdd') {
      params.steps = activeSteps;
      this.addReviewer(params);
    } else if (this.type === 'Rating') {
      params.entity_type = 'Rating';
      params.entity_ids = [this.response.attributes.rating_id];
      this.updateRatingLevelReviewer(params);
    } else if (this.type === 'RatingAdd') {
      params.entity_type = 'Rating';
      params.entity_ids = [this.response.attributes.rating_id];
      params.steps = activeSteps;
      this.addReviewer(params);
    }
  }

  addReviewer(params) {
    this.reviewerService.assignReviewer(params).subscribe(
      (response) => {
        if (this.success) this.success();
        this.status.destroyActiveEditorInstace();
        this.starting_review = false;
        this.starting_review_second = false;
        this.store.dispatch(new GetReviewers());
        this.mainModal.hide();
      },
      (error) => {
        this.starting_review = false;
        this.starting_review_second = false;
      }
    );
  }

  updateQuestionLevelReviewers(params) {
    this.questionnaire
      .updateReviewer(
        this.question.sectionID,
        this.diligence.id,
        this.question.answer.id,
        this.newDefinition.id,
        params
      )
      .subscribe(
        (response) => {
          this.toaster.success(`Reviewer${this.firstButtonLabel} updated`);
          this.store.dispatch(
            new getReviewAssignments(this.diligence.id, this.question.sectionID)
          );
          this.store.dispatch(new GetReviewers());
          this.store.dispatch(new GetQuestionCount());
          this.status.destroyActiveEditorInstace();
          this.starting_review = false;
          this.starting_review_second = false;
          this.mainModal.hide();
        },
        (error) => {
          this.starting_review = false;
          this.starting_review_second = false;
        }
      );
  }

  updateRatingLevelReviewer(params) {
    this.questionnaire
      .updateRatingReviewer(
        this.diligence.id,
        this.response.attributes.rating_id,
        this.newDefinition.id,
        params
      )
      .subscribe(
        (response) => {
          this.toaster.success(`Reviewer${this.firstButtonLabel} updated`);
          if (this.success) this.success();
          this.status.destroyActiveEditorInstace();
          this.starting_review = false;
          this.starting_review_second = false;
          this.mainModal.hide();
        },
        (error) => {
          this.starting_review = false;
          this.starting_review_second = false;
        }
      );
  }

  showDeleteReviewerAlert() {
    this.starting_review_second = false;
    this.sweetAlert.confirm({
      title: `Are you sure you want to delete all review assignments for this ${
        this.type === 'Question' ? 'response' : 'rating'
      }?`,
      confirmButtonText: 'Yes, Please!',
      showLoaderOnConfirm: true,
      preConfirm: () => {
        return new Promise<void>((resolve) => {
          this.starting_review_second = true;
          this.deleteReviewer(resolve);
        });
      },
    });
  }

  deleteReviewer(resolve) {
    this.questionnaire
      .deleteReviewAssignment(this.diligence.id, this.newDefinition.id)
      .subscribe(
        (response) => {
          this.toaster.success('Reviewer deleted successfully');
          this.sidePanelService.close();
          this.starting_review_second = false;
          this.store.dispatch(new GetQuestionCount());
          this.store.dispatch(
            new getReviewAssignments(
              this.diligence.id,
              this.question?.sectionID ?? this.response.attributes.section_id
            )
          );
          this.store.dispatch(new GetReviewers());
          this.success('delete');
          resolve();
          this.mainModal.hide();
        },
        (err) => (this.starting_review_second = false)
      );
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  addStep() {
    let step: Step = {
      assignments: [],
      order: 1,
      no_of_approval_required: null,
      is_active: true,
      id: null,
    };

    return step;
  }

  handleAddStep() {
    this.steps.addStep();
  }

  UpdateSaveAssign(
    params,
    type: 'saveDef' | 'updateDef' | 'deleteDef' = 'saveDef'
  ) {
    if (!this.newDefName) {
      this.starting_review = false;
      this.starting_review_second = false;
      this.toaster.error('Please enter definition name');
      return;
    } else if (
      type !== 'updateDef' &&
      this.definitions.find(
        (x) =>
          x.name.toLocaleLowerCase().trim() ===
          this.newDefName.toLocaleLowerCase().trim()
      )
    ) {
      this.starting_review = false;
      this.starting_review_second = false;
      this.duplicateDefName = true;
      this.toaster.error(
        'Definition name already present. Please enter another name'
      );
      return;
    }

    let obj = [];

    obj.push(this.reviewerService.assignReviewer(params));
    if (type === 'saveDef') {
      this.newDefinition.name = this.newDefName.trim();

      this.newDefinition.steps = this.steps.getChanges(true);

      this.newDefinition.review_filter_id = this.selected_filter;
      obj.push(this.questionnaire.addDefinition(this.newDefinition));
    } else if (type === 'updateDef') {
      this.selectedDefinition.name = this.newDefName.trim();
      this.selectedDefinition.steps = this.steps.getChanges(false);
      this.selectedDefinition.review_filter_id = this.selected_filter;
      obj.push(
        this.questionnaire.updateReviewDefinition(this.selectedDefinition)
      );
    }

    obj[0].subscribe(
      (res) => {
        obj[1].subscribe((res) => {
          this.toaster.success('Review definition saved');
          this.definitions.push(res[1]);
          this.status.destroyActiveEditorInstace();
          this.starting_review = false;
          this.starting_review_second = false;
          this.mainModal.hide();
        }),
          (error) => {
            this.starting_review = false;
            this.starting_review_second = false;
          };
      },
      (error) => {
        this.starting_review = false;
        this.starting_review_second = false;
      }
    );
  }

  handleShowSaveDef() {
    this.handleShowSaveDefCheck = !this.handleShowSaveDefCheck;
    this.updateSecondButtonLabel();
  }

  showUpdateButton() {
    if (this.selectedButton !== assignReviewer.definition) return;
    if (this.selectedDefJson) {
      this.showUpdateButtonVar = !(
        JSON.stringify(this.selectedDefJson) ===
        JSON.stringify(this.steps.getChanges())
      );
      this.updateSecondButtonLabel();
    }
  }
}
