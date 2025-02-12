import { Component, OnInit } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { UserState } from 'src/app2/store/user/user.state';
import { take } from 'rxjs/operators';
import { CurrentUserModel } from 'src/app2/store/user/user.model';
import { ReviewDefinitionsListService } from './review-definitions-list.service';
import { SetDefaultColumnDef } from 'src/app2/store/grid/grid.action';
import {
  defaultColumn,
  grid_widths_map,
} from 'src/app2/shared/constants/constant';
import { RouterService } from 'src/app2/services/router.service';
import { ReviewDefinitionsService } from 'src/app2/services/review-definitions/review-definitions.service';
import { Definition } from 'src/app2/shared/models/review-definitions.model';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { PanelControl } from 'src/app2/shared/components/dv-panel-heading/dv-panel-heading.component';
import { DvDatePipe } from 'src/app2/shared/pipes/dv-date.pipe';

@Component({
  selector: 'app-review-definitions-list',
  templateUrl: './review-definitions-list.component.html',
  styleUrls: ['./review-definitions-list.component.css'],
})
export class ReviewDefinitionsList implements OnInit {
  gridName = 'reviewDefinitions';
  currUser: CurrentUserModel;
  reviewDefinitions: Definition[];
  is_freeSubscription: boolean;
  @Select(UserState.getCurrentUserData) user;
  panelHeadingControls: PanelControl[];

  constructor(
    private readonly reviewDefinitionListService: ReviewDefinitionsListService,
    private readonly store: Store,
    private readonly dvDatePipe: DvDatePipe,
    private readonly utils: UtilsService,
    private readonly routerService: RouterService,
    private readonly reviewService: ReviewDefinitionsService,
    private readonly modal: CustomModalService
  ) {}

  ngOnInit(): void {
    this.initialize();
  }

  initialize(): void {
    this.getGridCols();
    this.user.pipe(take(1)).subscribe((user) => {
      if (user) {
        this.currUser = user;
        this.is_freeSubscription = this.utils.isFreeSubscription();
        if (!this.is_freeSubscription) this.setPanelHeadingControls();
      }
    });
  }

  setPanelHeadingControls() {
    this.panelHeadingControls = [
      {
        text: 'New Definition',
        handleClick: this.addReviewDefinition.bind(this),
        tooltip: 'Create New Definition',
        leftIcon: 'plus',
      },
    ];
  }

  getGridCols() {
    let defaultColumnDef =
      this.reviewDefinitionListService.getReviewDefinitionColDef();
    defaultColumnDef = [
      ...defaultColumnDef,
      {
        ...defaultColumn,
        colId: 'action',
        headerName: 'Action',
        field: 'action',
        sortable: false,
        cellRenderer: 'deleteActionsCellRenderer',
        minWidth: grid_widths_map.icon_xs,
        cellRendererParams: {
          clickedRemove: (field) => {
            this.reviewService.confirmReviewDefinitionDeletion(
              field.data,
              () => {
                this.reviewDefinitions = this.reviewDefinitions.filter(
                  (def) => def.id !== field.data.id
                );
              }
            );
          },
          tooltip: 'Delete Definition',
        },
        headerClass: 'my-permission-cursor-pointer',
      },
    ];
    this.store.dispatch(
      new SetDefaultColumnDef({ [this.gridName]: defaultColumnDef })
    );
    this.initGrid();
  }

  initGrid() {
    this.reviewService.getDefinitions().subscribe((response: any) => {
      this.reviewService.updateDefinitions(response);
      this.formatDefinitions(response);
    });
  }

  formatDefinitions(definitions) {
    this.reviewDefinitions = definitions
      .map((definitions) => ({
        name: definitions.name,
        created_by_name: definitions.created_by_name,
        updated_by_name:
          definitions.updated_by_name ?? definitions.created_by_name,
        updated_at: definitions.updated_at
          ? this.dvDatePipe.transform(definitions.updated_at)
          : definitions.created_at
          ? this.dvDatePipe.transform(definitions.created_at)
          : '',
        id: definitions.id,
        updated_at_date: new Date(definitions.updated_at) ?? null,
      }))
      .sort((a, b) => {
        if (a.name.toLowerCase() > b.name.toLowerCase()) {
          return 1;
        }
        if (a.name.toLowerCase() < b.name.toLowerCase()) {
          return -1;
        }
        return 0;
      });
  }

  onCellClicked = (event) => {
    if (event.colDef.colId !== 'action' && event.data) {
      this.routerService.navigateWithParams(
        `app.firm.settings.review_definitions.details`,
        {
          reviewId: event.data.id,
        }
      );
    }
  };

  addReviewDefinition() {
    this.modal.invoke('new-review-definition', {
      initialState: {
        definitions: this.reviewDefinitions,
        success: (definition) => {
          this.reviewDefinitions.push(definition);
          this.formatDefinitions(this.reviewDefinitions);
        },
      },
    });
  }
}
