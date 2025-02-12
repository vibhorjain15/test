import { Component, OnDestroy, OnInit } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { Subscription } from 'rxjs';
import { take, tap } from 'rxjs/operators';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { RouterService } from 'src/app2/services/router.service';
import {
  GetAllTemplates,
  GetCurrentTemplateData,
} from '../../store/reports.actions';
import { ReportState } from '../../store/reports.state';

@Component({
  selector: 'report-template-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css'],
})
export class ReportTemplatesListComponent implements OnInit, OnDestroy {
  templates;
  AllTemplate;
  selectedTempId: any = -1;
  allTemplatesSub: Subscription;
  @Select(ReportState.getTemplatesList) allTemplates;
  actionIconsList = [
    {
      name: `search`,
      key: 'action-search',
      tooltip: `Search`,
      iconClass: ``,
    },
    {
      name: `plus`,
      key: `action-plus`,
      tooltip: `Add new presentation report design`,
      iconClass: ``,
    },
  ];
  actionButtonsList = [];
  title = 'Presentation Report Design';
  templatesDataCopy = [];
  constructor(
    private readonly router: RouterService,
    private ModalFactory: CustomModalService,
    private store: Store
  ) {}

  ngOnInit() {
    this.allTemplatesSub = this.allTemplates
      .pipe(
        tap((templates: any) => {
          if (!templates) {
            this.store.dispatch(
              new GetAllTemplates({
                include_new_reports: true,
              })
            );
          }
        })
      )
      .subscribe((response) => {
        this.templates = response;
        this.templatesDataCopy = response;
        this.AllTemplate = response;
        if (response?.length) {
          if (this.selectedTempId == -1) {
            this.redirectToTemplate(response[0]);
          }
        }
      });
  }

  handleActionIconClick(iconKey: ActionIcon) {
    this.title = '';
    if (iconKey === 'action-plus') {
      this.title = 'Presentation Report Design';
      this.redirectToNewTemplate();
    } else if (iconKey === 'action-search') {
      this.actionIconsList = [];
      this.actionButtonsList = [
        {
          key: `action-search`,
          type: `input-search`,
          class: `flex-1`,
          placeholder: 'Search Report Design',
          name: `search`,
          isPrimary: false,
          isDisabled: false,
          hide: false,
          tooltip: `Search in Report Design`,
        },
        {
          key: `cancel-action-search`,
          type: `icon`,
          name: `times`,
          isPrimary: false,
          isDisabled: false,
          hide: false,
          tooltip: `Cancel`,
        },
      ];
    } else if (iconKey === 'cancel-action-search') {
      this.title = 'Presentation Report Design';
      this.actionIconsList = [
        {
          name: `search`,
          key: 'action-search',
          tooltip: `Search`,
          iconClass: ``,
        },
        {
          name: `plus`,
          key: `action-plus`,
          tooltip: `Add new presentation report design`,
          iconClass: `Add Question`,
        },
      ];
      this.actionButtonsList = [];
    }
  }

  handleSearchChange(data) {
    if (!data) this.templates = this.templatesDataCopy;
    this.templates = data;
    this.templates = this.templatesDataCopy.filter((val) =>
      val.name
        .split('<separator>')[0]
        .toLowerCase()
        .includes(data.toLowerCase())
    );
  }
  ngOnDestroy() {
    this.allTemplatesSub.unsubscribe();
  }

  redirectToTemplate(template) {
    window.scroll({
      top: 0,
      behavior: 'smooth',
    });
    this.selectedTempId = -1;
    this.store
      .dispatch(
        new GetCurrentTemplateData({
          id: template.id,
          is_new_report: template.is_new_report,
        })
      )
      .pipe(take(1))
      .subscribe(() => {
        this.selectedTempId = template.id;
        this.router.navigateWithParams('app.reports.templates.list.preview', {
          templateId: template.id,
          is_new_report: template.is_new_report,
        });
      });
  }

  redirectToNewTemplate() {
    this.ModalFactory.invoke('add-report-template', { class: 'gray modal-lg' });
  }
}
type ActionIcon =
  | `action-plus`
  | `action-search`
  | `action-search`
  | `cancel-action-search`;
