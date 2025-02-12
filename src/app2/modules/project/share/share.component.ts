import { Component, OnInit, ViewChild } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { ToastrService } from 'ngx-toastr';
import { finalize, take, tap } from 'rxjs/operators';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { RouterService } from 'src/app2/services/router.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { DvStepperComponent } from 'src/app2/shared/components/dv-stepper/dv-stepper.component';
import {
  defaultColumn,
  FILTER_TERNARY_OPERATORS,
  FollowUpType,
  grid_widths_map,
  keywordConstants,
} from 'src/app2/shared/constants/constant';
import { SetDefaultColumnDef } from 'src/app2/store/grid/grid.action';
import {
  UpdateActivePanelId,
} from 'src/app2/store/user/user.action';
import { UserState } from 'src/app2/store/user/user.state';
import { ShareDDResourceService } from './sharedDDResource';
import { ProjectSummaryService } from 'src/app2/services/project-summary.service';
import { NgForm } from '@angular/forms';
import { SidePanelService } from 'src/app2/services/side-panel.service';
@Component({
  selector: 'app-share',
  templateUrl: './share.component.html',
  styleUrls: ['./share.component.css'],
})
export class ShareComponent implements OnInit {
  @ViewChild('dvStepper') stepInstance: DvStepperComponent;

  diligenceId: any;
  DVEntityDisplayName: any = '';
  email_templates = [];
  disallow_custom_edits = false;
  use_email_templates = false;
  is_internal = false;
  dd_status = null;
  loading = true;
  followup_responses = [];
  current_user: any;
  startDDShare = false;
  display_sidebar = false;
  display_investor_selection_error = false;
  accept_confidential_agreement = false;
  selected_investors: Array<any> = [];
  default_email_template_message_id: any;
  diligence: any;
  email_text: any;
  followupLoading: boolean;
  response: { id: any };
  new_followup_response: any = {};
  gridName = 'project_share';
  // followup_form: any;
  // @ViewChild('followupForm') followup_form: NgForm;
  @ViewChild('followupForm') form: NgForm;
  saving_followup_response: boolean;
  BaseDataService: any;
  selected_investors_temp = [];
  all_selected_investors_arr = [];
  all_selected_investors_contacts_arr = [];
  keywordConstants = keywordConstants;
  selectedFilters = [];
  selectedGlobalTernaryOperator: any;
  filterApplied: boolean;
  display_entity_selection_error: boolean;
  firm_preferences_copy: any = {};
  tinyMceInit: any;
  request: any = {};
  is_admin = false;
  isOwner = false;
  rowData = [];
  isGridLoaded = false;
  sendingRequest = false;
  @Select(UserState.getCurrentUserData) user$;
  @Select(UserState.getSubscriptionLimitsData) subscriptionLimits;
  @Select(UserState.getFirmPreferenceData) firmPref$;
  @Select(UserState.getActivePanelId) activePanelId;
  isSidePanelOpened: boolean;
  conversations: any[];
  constructor(
    private readonly SweetAlert: SweetAlertService,
    private readonly customModalService: CustomModalService,
    private readonly routerService: RouterService,
    private readonly utilsService: UtilsService,
    private readonly toastrService: ToastrService,
    private readonly store: Store,
    private readonly shareDDResourceService: ShareDDResourceService,
    private readonly projectSummary: ProjectSummaryService,
    private panelService: SidePanelService
  ) {}

  ngOnInit(): void {
    this.user$
      .pipe(
        take(1),
      )
      .subscribe((user) => {
        if (user) {
          this.current_user = user;
          this.is_admin = user.isAdmin;
          this.isOwner = user.isOwner;
          this.initialize();
          this.getFirmPreferences();
        }
      });
    this.loadGrid();
    this.selectedGlobalTernaryOperator = FILTER_TERNARY_OPERATORS.AND;
    this.panelService.sidePanelSub.subscribe((val) => {
      this.isSidePanelOpened = val;
    });
  }

  initialize() {
    this.diligenceId = this.routerService.getState().params.diligenceId;
    this.subscriptionLimits.pipe(take(2)).subscribe((limits) => {
      if (limits?.length) {
        this.DVEntityDisplayName = this.utilsService.getDVEntityDisplayName(
          limits[0],
          this.current_user.isInvestor
        );
      }
    });
    this.tinyMceInit = {
      statusbar: false,
      placeholder: '',
    };

    this.projectSummary
      .getEmailTemplates()
      .pipe(
        tap((response: any) => {
          this.email_templates = response;
        })
      )
      .subscribe(() => {
        this.loading = false;
        if (
          this.default_email_template_message_id &&
          this.use_email_templates
        ) {
          this.renderEmailTemplate(this.default_email_template_message_id);
        }
      });

    this.getDueDiligenceList();
  }

  getFirmPreferences() {
    this.firmPref$.pipe(take(1)).subscribe((response: any) => {
      if (response) {
        this.default_email_template_message_id =
          response.default_email_template_message_id;
        if (response.disallow_custom_email_template_edit) {
          this.disallow_custom_edits = true;
          this.use_email_templates = true;
        }

        if (response.customize_intro) {
          this.use_email_templates = true;
        }
      }
    });
  }

  loadGrid() {
    let defaultColumnDef =
      this.shareDDResourceService.getMyApprovalGridColDef();
    defaultColumnDef = [
      {
        ...defaultColumn,
        colId: 'actions',
        headerName: 'Actions',
        field: 'action',
        flex: 1,
        minWidth: grid_widths_map.sm_column_xm,
        width: grid_widths_map.sm_column_xm,
        suppressColumnsToolPanel: true,
        cellRenderer: 'ShareActionRenderer',
        cellRendererParams: {
          openFollowupDialog: (field) => {
            this.openFollowupDialog(field.data);
          },
          revokeAccessModal: (field) => {
            this.revokeAccessModal(field.data);
          },
        },
        sortable: false,
        headerClass: 'my-permission-cursor-pointer',
      },
      ...defaultColumnDef,
    ];

    this.store.dispatch(
      new SetDefaultColumnDef({ [this.gridName]: defaultColumnDef })
    );
    this.getShareGridData();
  }

  getShareGridData() {
    this.shareDDResourceService
      .getData(this.diligenceId)
      .subscribe((response) => {
        this.rowData = response;
        this.isGridLoaded = true;
      });
  }

  getDueDiligenceList() {
    this.loading = true;
    this.projectSummary
      .getCurrentDiligence(this.diligenceId, this.current_user)
      .subscribe((diligence: { is_internal: any; status: any }) => {
        this.diligence = diligence;
        this.is_internal = diligence.is_internal;
        this.dd_status = diligence.status;
        this.loading = false;
      });
  }

  renderEmailTemplate(id: any) {
    const template = this.email_templates.find((x) => x.id === id);
    if (template) {
      this.email_text = template.content;
    } else {
      this.email_text = '';
    }
  }

  reInitShare() {
    this.getShareGridData();
    this.followup_responses = [];
    this.startDDShare = false;
    this.display_sidebar = false;
    this.display_investor_selection_error = false;
    this.accept_confidential_agreement = false;
    this.selected_investors = [];
    this.loading = false;
    this.isGridLoaded = true;
    this.rowData = [];
  }

  getDefaultEmailTemplate(use_email_template: any) {
    if (use_email_template) {
      return this.renderEmailTemplate(this.default_email_template_message_id);
    } else {
      return (this.email_text = '');
    }
  }

  startSharingProcess() {
    if (this.dd_status === 'Approved') {
      this.projectSummary
        .getCurrentDiligence(this.diligenceId, this.current_user)
        .subscribe((diligence: any) => {
          this.diligence = diligence;
        });
      this.startDDShare = true;
    }
  }

  cancelSharingProcess() {
    this.isGridLoaded = false;
    this.rowData = [];
    this.reInitShare();
  }

  canProceedToReview() {
    this.setEntities();
    const can_proceed = this.areSelectedEntitiesValid();
    const bouncedEntitiesList = [];
    const allEntitiesList = this.selected_investors;
    const bouncedEmailsList = [];
    const allEmailsList = [];
    this.selected_investors.forEach(
      (entity: { notification_contacts: any }) => {
        let bouncedContactsCount = 0;
        const notification_contacts = [];

        entity.notification_contacts.forEach(
          (contact: { is_removed: any; has_bounce_history: any }) => {
            if (!contact.is_removed) {
              allEmailsList.push(contact);
            }
            if (!contact.is_removed) {
              notification_contacts.push(contact);
            }
            if (contact.has_bounce_history && !contact.is_removed) {
              bouncedContactsCount++;
              bouncedEmailsList.push(contact);
            }
          }
        );
        if (
          (bouncedContactsCount === notification_contacts.length &&
            notification_contacts.length > 0) ||
          notification_contacts.length === 0
        ) {
          bouncedEntitiesList.push(entity);
        }
      }
    );
    if (bouncedEmailsList.length > 0 || bouncedEntitiesList.length > 0) {
      this.customModalService.invoke('alert-bounced-contacts', {
        initialState: {
          entitiesList: {
            bounced: bouncedEntitiesList,
            all: allEntitiesList,
            entity_type: 'Duediligence',
          },
          contactsList: {
            bounced: bouncedEmailsList,
            all: allEmailsList,
          },
          success: (response: string) => {
            if (response !== 'canceled') {
              if (
                this.selected_investors.length !== bouncedEntitiesList.length
              ) {
                const entIds = bouncedEntitiesList.map((val) => val.id);
                this.selected_investors.forEach((ent: any) => {
                  if (entIds.includes(ent.id)) {
                    ent.is_selected = false;
                  }
                });
              }
              if (!can_proceed) {
                this.display_investor_selection_error = true;
              }
              if (can_proceed) {
                this.display_investor_selection_error = false;
                this.stepInstance.next();
              }
            }
          },
        },
      });
    } else {
      if (!can_proceed) {
        this.display_investor_selection_error = true;
        if (this.areSelectedEntitiesValid()) {
          this.display_investor_selection_error = false;
          this.stepInstance.next();
        }
      } else {
        this.stepInstance.next();
      }
    }
  }

  areSelectedEntitiesValid() {
    const all_selected_investors_arr = [];
    this.selected_investors.forEach(
      (entity: { id: any; notification_contacts: any }) => {
        const entity_item = {
          id: entity.id,
          notification_contacts: [],
        };
        entity.notification_contacts.forEach(
          (contact: { is_removed: any; id: any }) => {
            if (!contact.is_removed) {
              entity_item.notification_contacts.push(contact.id);
            }
          }
        );
        if (entity_item.notification_contacts.length) {
          all_selected_investors_arr.push(entity_item);
        }
      }
    );
    return all_selected_investors_arr.length;
  }

  sendDueDiligenceRequest() {
    if (!this.accept_confidential_agreement) {
      this.SweetAlert.error({
        title: 'Confidentiality Agreement',
        text: 'Please agree with the binding conditions by clicking the checkbox before you can send this request',
      });
      return;
    }
    this.sendingRequest = true;
    const postObj = {
      id: this.diligenceId,
      email_text: this.email_text,
      investors: [],
    };

    for (let investor of Array.from(this.selected_investors)) {
      const investorsObj: any = {};
      investorsObj.id = investor.id;
      investorsObj.notification_contacts =
        investor.notification_contacts.filter(
          (contact: { is_removed: any }) => {
            if (!contact.is_removed) {
              return contact;
            }
          }
        );
      if (investorsObj.notification_contacts.length > 0) {
        investorsObj.notification_contacts =
          investorsObj.notification_contacts.map((x: { id: any }) => x.id);
        postObj.investors.push(investorsObj);
      }
    }
    this.projectSummary.shareProject(postObj).subscribe(
      (response) => {
        this.sendingRequest = false;
        this.toastrService.success('Diligence shared successfully');
        this.reInitShare();
      },
      (e) => {
        this.sendingRequest = false;
      }
    );
  }

  revokeAccessModal(entity: { acknowledged_at: any }) {
    if (entity.acknowledged_at == 'Never') {
      return this.SweetAlert.confirm({
        title: 'Are you sure you want to revoke access?',
        confirmButtonText: 'Yes please',
        focusCancel: true,
        showLoaderOnConfirm: true,
        preConfirm: () => {
          return new Promise<void>((resolve) => {
            this.revokeAccess(entity, resolve);
          });
        },
      });
    }
  }
  openFollowupDialog(response: { id: any }) {
    this.store.dispatch(new UpdateActivePanelId(`follow-up-${response.id}`));
    this.panelService.invoke('follow-up-panel', {
      diligence: this.diligence,
      shareResponseData: response,
      followUpType: FollowUpType.Project,
      onCommentAdded: (responseId) => {},
    });
  }

  resetForm() {
    this.form.reset();
  }

  saveFollowupResponse() {
    this.form.form.markAllAsTouched();
    if (this.form.valid) {
      this.saving_followup_response = true;
      const params = {
        text: this.form.value.new_followup_response,
        type: 'DiligenceFollowup',
        entity_id: this.diligenceId,
        entity_type: 'Duediligence',
      };

      this.projectSummary
        .saveFollowup(params)
        .pipe(finalize(() => (this.saving_followup_response = false)))
        .subscribe((response: any) => {
          this.conversations = response;
          const message = 'Your response was added!';
          this.toastrService.success(message);
          this.resetForm();
        });
    }
  }

  setEntities() {
    this.selected_investors_temp = [];
    this.all_selected_investors_arr = [];
    this.all_selected_investors_contacts_arr = [];
    this.selected_investors.forEach(
      (entity: {
        id: any;
        notification_contacts: any;
        name: any;
        is_selected: boolean;
      }) => {
        const entity_item = {
          id: entity.id,
          notification_contacts: [],
        };
        entity.notification_contacts.forEach(
          (contact: { is_removed: any; id: any; name: string; email: any }) => {
            if (!contact.is_removed) {
              entity_item.notification_contacts.push(contact.id);
              if (contact.name !== '') {
                this.all_selected_investors_contacts_arr.push(contact.name);
              } else {
                this.all_selected_investors_contacts_arr.push(contact.email);
              }
            }
          }
        );
        if (entity_item.notification_contacts.length) {
          this.selected_investors_temp.push(entity_item);
          this.all_selected_investors_arr.push(entity.name);
        }
      }
    );
  }

  formatTooltip(list: { join: (arg0: string) => any }) {
    return list.join(', ');
  }

  revokeAccess(entity: any, callBack) {
    this.projectSummary.revokeAccess(entity.id).subscribe((_) => {
      this.rowData = [];
      this.isGridLoaded = false;
      this.getShareGridData();
      this.toastrService.success('Access Revoked');
      callBack();
    });
  }

  handleSelectedEntities({ list, search, ternaryOperator }) {
    this.selectedFilters = search;
    this.selectedGlobalTernaryOperator = ternaryOperator;
    if (this.selectedFilters.length > 0) this.filterApplied = true;
    else this.filterApplied = false;
    this.selected_investors = JSON.parse(JSON.stringify(list));
    if (this.selected_investors.length > 0) {
      this.display_entity_selection_error = false;
    }
  }

  handleBackEvent() {
    this.display_investor_selection_error = false;
    this.stepInstance.previous();
  }

  handleEditorTextChange($event) {
    this.email_text = $event;
  }

  navigateToEmailTemplates() {
    this.routerService.navigate(`app.firm.settings.email_templates`);
  }
}
