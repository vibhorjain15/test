import { Component, OnInit } from '@angular/core';
import { TemplateService } from 'src/app2/apis/template/template.service';
import { Select, Store } from '@ngxs/store';
import { TemplateGridService } from './template-grid.service';
import { SetDefaultColumnDef } from 'src/app2/store/grid/grid.action';
import { RouterService } from 'src/app2/services/router.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { UserState } from 'src/app2/store/user/user.state';
import { take, tap } from 'rxjs/operators';
import { GetCurrentUser } from 'src/app2/store/user/user.action';
import { UtilsService } from 'src/app2/services/utils.service';
import { PanelControl } from 'src/app2/shared/components/dv-panel-heading/dv-panel-heading.component';
import { DvDatePipe } from 'src/app2/shared/pipes/dv-date.pipe';

@Component({
  selector: 'template-grid',
  templateUrl: './template-grid.component.html',
  styleUrls: ['./template-grid.component.css'],
})
export class TemplateGridComponent implements OnInit {
  allTemplates: any[] = [];
  isLoading: boolean = true;
  templateColumns: any;
  gridName: string = 'templates';
  @Select(UserState.getCurrentUserData) user;
  panelHeadingControls: PanelControl[] = [];
  constructor(
    private readonly routerService: RouterService,
    private readonly template: TemplateService,
    private readonly store: Store,
    private readonly templategrid: TemplateGridService,
    private readonly modal: CustomModalService,
    private readonly dvDatePipe: DvDatePipe
  ) {
    this.onRowClicked = this.onRowClicked.bind(this);
  }

  ngOnInit(): void {
    this.setPanelHeadingControls();
    this.user
      .pipe(
        take(2),
        tap((userData) => {
          if (!userData) {
            this.store.dispatch(new GetCurrentUser());
          }
        })
      )
      .subscribe((data) => {
        if (data) {
          this.templateColumns = this.templategrid.getTemplateGridColumn(
            data.isInvestor
          );
          this.store.dispatch(
            new SetDefaultColumnDef({ [this.gridName]: this.templateColumns })
          );
          this.template.getAllTemplated().subscribe((templates: any) => {
            this.allTemplates = [];
            templates.sort((a, b) => {
              let fa = a.templateInfo.name.toLowerCase(),
                fb = b.templateInfo.name.toLowerCase();

              if (fa < fb) {
                return -1;
              }
              if (fa > fb) {
                return 1;
              }
              return 0;
            });
            templates.forEach((template) => {
              this.allTemplates.push({
                id: template.templateInfo.id,
                name: template.templateInfo.name,
                type: this.getLabelValue(template.type, data.isManager),
                is_draft: this.getLabelValue(
                  template.templateInfo.is_draft,
                  data.isManager
                ),
                strategy: template.strategy,
                ownership: template.templateInfo.ownership,
                questionCount: template.questionCount,
                last_updated_at: template.last_updated_at,
                rating_scheme_id: template.templateInfo.rating_scheme_id,
                has_rating_scheme: !!template.templateInfo.rating_scheme_id
                  ? 'Yes'
                  : 'No',
                has_rating_scheme_custom_fields: !!template.templateInfo
                  .rating_scheme_custom_fields
                  ? 'Yes'
                  : 'No',
              });
            });
            this.isLoading = false;
          });
        }
      });
  }

  setPanelHeadingControls() {
    this.panelHeadingControls = [
      {
        tooltip: 'Create New Template',
        text: 'New Template',
        handleClick: this.addNewTemplate.bind(this),
        leftIcon: 'plus',
      },
    ];
  }

  onRowClicked(event) {
    if (!event.node?.group) {
      this.routerService.navigateWithParams('app.diligence.template.preview', {
        templateId: event.data.id,
      });
    }
  }

  addNewTemplate() {
    this.modal.invoke('new-template', {
      initialState: {},
    });
  }

  /**
   *
   * @param status status value
   * @param isManager user is manager
   * @returns string
   */
  getLabelValue(status: string, isManager = false) {
    let cellLabel = '';
    if (`${status}` == `${true}`) {
      cellLabel = 'draft';
    } else if (`${status}` == `${false}`) {
      cellLabel = status = 'active';
    } else if (status == 'dd_new') {
      cellLabel = 'Standard';
    } else if (status == 'dd_doc') {
      cellLabel = 'Document';
    } else if (status == 'dd_profile') {
      cellLabel = isManager ? 'Q/A Library' : 'Profile';
    }

    return cellLabel;
  }
}
