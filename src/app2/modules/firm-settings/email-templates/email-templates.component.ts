import { Component, OnDestroy, OnInit } from '@angular/core';
import swal from 'sweetalert2/dist/sweetalert2.js';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { EmailTemplatesService } from './email-templates.service';
import {
  defaultColumn,
  grid_widths_map,
} from 'src/app2/shared/constants/constant';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { ManageEmailService } from 'src/app2/services/manage-email-template/manage-email-template.service';
import { ToastrService } from 'ngx-toastr';
import { HttpClient } from '@angular/common/http';
import { Select, Store } from '@ngxs/store';
import { finalize, take } from 'rxjs/operators';
import { SetDefaultColumnDef } from 'src/app2/store/grid/grid.action';
import { UserState } from 'src/app2/store/user/user.state';
import { GetCurrentUser } from 'src/app2/store/user/user.action';
import { PanelControl } from 'src/app2/shared/components/dv-panel-heading/dv-panel-heading.component';

@Component({
  selector: 'app-email-email_templates',
  templateUrl: './email-templates.component.html',
  styleUrls: ['./email-templates.component.css'],
})
export class EmailTemplatesComponent implements OnInit, OnDestroy {
  renderGrid;
  loading;
  columnDefs;
  email_templates;
  firm_preferences: any;
  firm_preferences_copy: any;
  templateSub: any;
  gridName = 'email-templates';
  @Select(UserState.getFirmPreferenceData) firmPref;
  panelHeadingControls: PanelControl[];

  constructor(
    private readonly emailTemplatesService: EmailTemplatesService,
    private readonly SweetAlert: SweetAlertService,
    private readonly NewModalFactory: CustomModalService,
    private readonly ManageEmailService: ManageEmailService,
    private readonly toaster: ToastrService,
    private readonly store: Store,
    private readonly http: HttpClient
  ) {}

  ngOnInit(): void {
    this.getFirmPreferences();
    this.setPanelHeadingControls();
    let defaultColumnDef = this.emailTemplatesService.getEmailTemplatesColDef();
    defaultColumnDef = [
      {
        ...defaultColumn,
        colId: 'name',
        headerName: 'Name',
        field: 'name',
        minWidth: grid_widths_map.sm_column_xl,
        filter: 'agTextColumnFilter',
        floatingFilter: true,
        floatingFilterComponent: 'textFloatingFilterComponent',
        floatingFilterComponentParams: {
          suppressFilterButton: true,
          placeHolder: 'Search by Name',
        },
        cellRenderer: 'emailTemplateNameCellRenderer',
        cellRendererParams: {
          clickedView: (field) => {
            this.viewTemplate(field.data.template);
          },
        },
        suppressColumnsToolPanel: true,
      },
      ...defaultColumnDef,
      {
        ...defaultColumn,
        colId: 'action',
        headerName: 'Actions',
        field: 'action',
        minWidth: grid_widths_map.sm_column_xm,
        cellRenderer: 'emailTemplateActionsCellRenderer',
        cellRendererParams: {
          clickedDefault: (field) => {
            this.selectDefaultTemplate(field.data.template);
          },
          clickedEdit: (field) => {
            this.editTemplate(field.data.template);
          },
          clickedDelete: (field) => {
            this.confirmDeleteTemplate(field.data.template);
          },
        },
        sortable: false,
        headerClass: 'my-permission-cursor-pointer',
      },
    ];
    this.store.dispatch(
      new SetDefaultColumnDef({ [this.gridName]: defaultColumnDef })
    );
    this.initGrid();
    this.templateSub = this.ManageEmailService.templateSub.subscribe(() => {
      this.initGrid(true);
    });
  }

  getFirmPreferences() {
    this.firmPref.pipe(take(1)).subscribe((response: any) => {
      if (response) {
        this.firm_preferences = JSON.parse(JSON.stringify(response));
        this.firm_preferences_copy = { ...this.firm_preferences };
      }
    });
  }

  setPanelHeadingControls() {
    this.panelHeadingControls = [
      {
        text: 'New Template',
        handleClick: this.addEmailTemplate.bind(this),
        tooltip: 'Add New Template',
        leftIcon: 'plus',
      },
    ];
  }

  confirmDeleteTemplate(template) {
    const title = 'Are you sure you want to delete this template?';
    const warningText = '';
    this.SweetAlert.confirm({
      title,
      text: warningText,
      focusCancel: true,
      showLoaderOnConfirm: true,
      preConfirm: () => {
        return new Promise<void>((resolve) => {
          this.deleteTemplate(template, resolve);
        });
      },
    }).then(() => {
      swal.close();
    });
  }

  deleteTemplate(template, resolve) {
    this.http
      .delete(`EmailTemplateMessages/${template.id}`)
      .pipe(finalize(() => resolve()))
      .subscribe(() => {
        this.toaster.success('Template deleted successfully');
        let tempCopy = JSON.parse(JSON.stringify(this.email_templates));
        tempCopy.splice(
          this.email_templates.findIndex((val) => val.id === template.id),
          1
        );
        this.email_templates = tempCopy;
      });
  }

  initGrid(slientLoading = false) {
    this.loading = !slientLoading;
    this.emailTemplatesService
      .getEmailTemplatesRowData()
      .subscribe((email_templates) => {
        this.email_templates = email_templates;
        this.loading = false;
      });
  }

  selectDefaultTemplate(template) {
    if (template.is_default) {
      return;
    }
    this.firm_preferences_copy.default_email_template_message_id = template.id;
    this.ManageEmailService.updateFirmPref(this.firm_preferences_copy);
  }

  addEmailTemplate() {
    this.NewModalFactory.invoke('manage-email-template', { class: 'modal-lg' });
  }

  viewTemplate(template) {
    this.NewModalFactory.invoke('view-email-template', {
      initialState: {
        emailObj: template,
      },
      class: 'modal-lg',
    });
  }

  editTemplate(templateObj) {
    let isDefault = this.email_templates.find(
      (val) => val.template.id === templateObj.id
    ).is_default;
    this.NewModalFactory.invoke('manage-email-template', {
      initialState: {
        template: templateObj,
        isDefault,
      },
      class: 'modal-lg',
    });
  }

  ngOnDestroy(): void {
    this.templateSub.unsubscribe();
  }
}
