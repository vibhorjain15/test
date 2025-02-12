import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ColDef } from 'ag-grid-community';
import { TeamsService } from './teams.service';
import { RouterService } from 'src/app2/services/router.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { NewTeamServiceService } from 'src/app2/services/new-team/new-team.service';
import { UserState } from 'src/app2/store/user/user.state';
import { Select, Store } from '@ngxs/store';
import { SetDefaultColumnDef } from 'src/app2/store/grid/grid.action';
import { GetCurrentUser } from 'src/app2/store/user/user.action';
import { take, tap } from 'rxjs/operators';
import { PanelControl } from 'src/app2/shared/components/dv-panel-heading/dv-panel-heading.component';

@Component({
  selector: 'app-teams',
  templateUrl: './teams.component.html',
  styleUrls: ['./teams.component.css'],
})
export class TeamsComponent implements OnInit, OnDestroy {
  permissions_enabled;
  teamCount;
  allowed_teams;
  render_grid;
  is_admin: any;
  current_user: any;
  currentFirmId: any;
  teams: any;
  columnDefs: ColDef[] = [];
  gridName = 'teams';
  newTeamSub;
  @Select(UserState.getCurrentUserData) user;

  panelHeadingControls: PanelControl[] = [];
  constructor(
    private readonly http: HttpClient,
    private readonly teamsService: TeamsService,
    private readonly NewTeamServiceService: NewTeamServiceService,
    private readonly NewModalFactory: CustomModalService,
    private readonly routerService: RouterService,
    private readonly store: Store
  ) {}

  ngOnInit(): void {
    this.user.pipe(take(1)).subscribe((user) => {
      if (user) {
        this.current_user = JSON.parse(JSON.stringify(user));
        this.is_admin = user.isAdmin;
        this.initApis();
      }
    });
    this.newTeamSub = this.NewTeamServiceService.newTeamSub.subscribe(() => {
      this.initGrid();
      this.teamCount++;
    });
  }

  setPanelHeadingControls() {
    this.panelHeadingControls = [
      {
        text: 'New Team',
        handleClick: this.openNewTeamDialog.bind(this),
        isDisabled:
          !this.permissions_enabled && this.teamCount >= this.allowed_teams,
        tooltip:
          !this.permissions_enabled && this.teamCount >= this.allowed_teams
            ? 'Please contact customer service in order to enable this feature for your firm'
            : 'Add New Team',
        leftIcon: 'plus',
      },
    ];
  }

  initApis(): void {
    this.permissions_enabled = this.current_user.firmInfo.hasPermissionEnabled;
    this.allowed_teams = this.current_user.firmInfo.allowed_teams;
    this.currentFirmId = this.current_user.firmInfo.id;
    const defaultColumnDef = this.teamsService.getTeamsColDef();
    defaultColumnDef.map((x) => (x.cellClass = 'my-permission-cursor-pointer'));
    this.store.dispatch(
      new SetDefaultColumnDef({ [this.gridName]: defaultColumnDef })
    );
    this.http
      .get(`firms/${this.currentFirmId}/teams`)
      .subscribe((response: any) => {
        this.teamCount = response.length;
        this.setPanelHeadingControls();
      });
    this.initGrid();
  }

  openNewTeamDialog() {
    if (!!this.permissions_enabled || !(this.teamCount >= this.allowed_teams)) {
      this.NewModalFactory.invoke('new-team', {
        initialState: { gridData: this.teams?.data },
        class: 'modal-lg',
        closeInterceptor: () => {
          return new Promise<void>((resolve) => {
            resolve();
            this.initGrid();
          });
        },
      });
    }
  }

  initGrid() {
    this.render_grid = false;
    this.teamsService
      .getTeamsRowData(this.currentFirmId)
      .subscribe((response) => {
        this.teams = response;
        this.teams.sort((a, b) => a.team.localeCompare(b.team));
        this.render_grid = true;
      });
  }

  onRowClicked = (event) => {
    if (event?.node?.group && event.node.field === 'team') {
      const teamName = event.node.key;
      const teamId = this.teams.find((x) => x.team === teamName).team_id;
      this.routerService.navigateWithParams(
        'app.firm.settings.permission.detail',
        {
          entity_id: teamId,
          entity_type: 'Team',
          entity_name: teamName,
        }
      );
    } else if (event?.data) {
      this.routerService.navigateWithParams(
        'app.firm.settings.permission.detail',
        {
          entity_id: event?.data.entity_id,
          entity_type: event?.data.entity_type,
          entity_name: event?.data.entity_name,
        }
      );
    }
  };
  ngOnDestroy(): void {
    this.newTeamSub.unsubscribe();
  }
}
