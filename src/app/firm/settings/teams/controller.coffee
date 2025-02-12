class FirmSettingsTeamsController extends BaseController
  @register 'FirmSettingsTeamsController'

  @inject 'Restangular', 'Utils', '$q', '$timeout', 'SweetAlert', '$scope', 'toaster', 'TeamsManager', 'ModalFactory', '$state','angularEnabled'

  initialize: ->
    @is_admin = @Utils.isAdmin()
    @current_user = @Utils.getCurrentUser()
    @permissions_enabled = @current_user.firmInfo.hasPermissionEnabled
    @allowed_teams = @current_user.firmInfo.allowed_teams
    @render_grid = true
    @currentFirmId = @current_user.firmInfo.id
    @teams = @TeamsManager.$new({firm_id: @currentFirmId})

    @Restangular.one('firms', @currentFirmId).all('teams').getList().then (response) =>
      @teamCount = response.length

  openNewTeamDialog: =>
    unless (!@permissions_enabled && @teamCount >= @allowed_teams)
      @ModalFactory.invokeModal 'new_team',
        resolve:
          gridData: => @teams.data
          entityData: => null
          user: => null
        success: (new_user) =>
          @initGrid()
          @teamCount++

  openRow: (row,col)=>
    if !row.internalRow && col.field != "selectionRowHeaderCol" && col.field != 'action'
      if row.entity.user_id
        @$state.go("app.firm.settings.permission.detail",{entity_id: row.entity.user_id, entity_type: 'User', entity_name: row.entity.user_name})
      else
        @$state.go("app.firm.settings.permission.detail",{entity_id: row.entity.team_id, entity_type: 'Team', entity_name: row.entity.team_name})
    if row.internalRow && col.field != 'action'
      if row.treeNode.children[0]
        teamId = row.treeNode.children[0].row.entity.team_id
        teamName = row.treeNode.children[0].row.entity.team_name
        @$state.go("app.firm.settings.permission.detail",{entity_id: teamId, entity_type: 'Team', entity_name: teamName})

  removeUserFromTeamModal: (entity) ->
    @SweetAlert.confirm({
      title: 'Are you sure you want to revoke access ?'
      confirmButtonText: 'Yes, Please!'
      showLoaderOnConfirm: true
      preConfirm: =>
        @removeUser(entity)
    })


  editTeam: (data) =>
    @ModalFactory.invokeModal 'new_team',
      resolve:
        gridData: => null
        entityData: => data
        user: => null
      success: (new_user) =>
        @initGrid()

  removeUser: (entity) =>
    @loading = true
    obj = {
      Assigned_member_ids: []
      Unassigned_member_ids: [entity.user_id]
      role_id: entity.role_id
      team: {name: entity.team_name, id: entity.team_id}
    }
    @Restangular.one('firms', @currentFirmId).one('teams', entity.team_id).customPUT(obj).then(=>
      @toaster.pop 'success', '', 'Access Revoked'
    ).finally (=>
      swal.close() #stupid angular-sweetalert guy isn't tagging the updated code!
      @initGrid()
    )

  initGrid: =>
    delete @teams
    @render_grid = false
    @teams = @TeamsManager.$new({firm_id: @currentFirmId})
    @$timeout =>
      @render_grid = true
