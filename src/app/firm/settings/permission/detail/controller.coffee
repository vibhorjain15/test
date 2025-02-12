class FirmSettingsPermissionDetailsViewController extends BaseController
  @register 'FirmSettingsPermissionDetailsViewController'

  @inject 'Restangular', 'Utils', '$q', '$timeout', 'SweetAlert', '$scope', 'toaster', '$stateParams', '$http', 'baseUrl', '$state', '$window', 'ModalFactory','EntityAssignmentResource', 'BaseDataService', 'TeamMembersResource', 'UserInTeamsResource','USER_ROLES','angularEnabled','keywordConstants','USER_ROLES'

  initialize: ->
    @is_admin = @Utils.isAdmin()
    @current_user = @Utils.getCurrentUser()
    @is_investor = @Utils.isInvestor()
    @is_manager = @Utils.isManager()
    @team_members = []
    @current_team = {}
    @$stateParams.entity_id = parseInt(@$stateParams.entity_id)
    @currentFirmId = @current_user.firmInfo.id
    @permissions_enabled = @current_user.firmInfo.hasPermissionEnabled
    @edit_self_mode = false
    @selectedUser = {}
    @teams = []
    @funds = []
    @loading = true
    @assignments_grid_type = 'assignments_grid'


    @firms = []
    @projects = []
    @selectedTabForResources = 'Fund'
    @$scope.headerButtonClick = (ev) ->
      return
    @$scope.$on 'team_members_changed', =>
      @getTeamMembersAsResource(@$stateParams.entity_id)

    @initData()
    @getVisibilityList()
    @getRoles()
    @assignmentResources = null


  editTeam: =>
    @ModalFactory.invokeModal 'edit_team',
      resolve:
        existing_members : => @team_members
        team : => @current_team
        adding_member : => null
      success: (response) =>
        @initData()
        # @getPermissions()

  setSelectionType: (type) =>
    @selectionType = type
    @getPermissions(type)
    # firmId = @Utils.getCurrentFirm().id

  editRole: (team) =>
    @ModalFactory.invokeModal 'new_team',
      resolve:
        gridData: => null
        entityData: => team
        user: => null
      success: (new_user) =>
        @initData()

  goBack: =>
    @$window.history.back()


  getUserById: (id) =>
    @Restangular.one('users', id).get().then (response) =>
      @selectedUser = response

  getTeams: =>
    @Restangular.one('firms', @currentFirmId).all('teams').getList().then (response) =>
      @teams = response
      @current_team = _(@teams).findWhere({id: Number(@$stateParams.entity_id)})


  getTeamMembersAsResource: =>
    @allTeamMembers = null
    @$timeout =>
      @allTeamMembers = @TeamMembersResource.$new({id: parseInt(@$stateParams.entity_id), firm_id: @currentFirmId})
      @team_members = @allTeamMembers.data

  initData: =>
    @loading = false
    @entity_name = @$stateParams.entity_name
    if @$stateParams.entity_type and @$stateParams.entity_type == 'User'
      @getUserInTeamsAsResource()
      @getUserById(@$stateParams.entity_id)
    else
      @getTeamMembersAsResource()
      @getTeams()

    @getSelectedTabData(@selectedTabForResources)

  goToSelectedEntity: (row)=>
    if !@edit_self_mode
      type = if @$stateParams.entity_type == 'User' then 'Team' else "User"
      name = if @$stateParams.entity_type == 'User' then row.team_name else row.user_name
      entity_id = if @$stateParams.entity_type == 'User' then row.team_id else row.user_id
      @$state.go("app.firm.settings.permission.detail",{entity_id: entity_id, entity_type: type, entity_name: name})

  toggleAddRemove: (item) =>
    if item.removed
      item.removed = false
    else
      item.removed = true


  editUser: ->
    @ModalFactory.invokeModal 'new_user',
      resolve:
        existing_user: => {id: @$stateParams.entity_id, name: @$stateParams.entity_name}
      success: (response) =>
        @initData()

  confirmTeamDeletion: ->
    title = 'Are you sure you want to remove this team?'
    text = ""
    @SweetAlert.confirm({
      title: title
      confirmButtonText: 'Yes, Please!'
      showLoaderOnConfirm: true
      preConfirm: =>
        @removeTeam()
    })


  confirmUserDeletion: ->
    title = 'Are you sure you want to delete this user?'
    text = ""
    @SweetAlert.confirm({
      title: title
      confirmButtonText: 'Yes, Please!'
      showLoaderOnConfirm: true
      preConfirm: =>
        @removeUserFromPlatform()
    })


  removeUserFromPlatform: ->
    userId = Number(@$stateParams.entity_id)
    @Restangular.one('users', userId).remove().then ((response) =>
      @toaster.pop 'success', '', 'User removed successfully' , 2000
      swal.close()
      @$timeout =>
        @$state.go("app.firm.settings.employees")
    ), ((error) =>
      swal.close()
      avoid_error_logging_statuses = @BaseDataService.getAvoidErrorLoggingStatusList()
      if !(error.status in avoid_error_logging_statuses)
        @Utils.logError('Edit team failed', error)
    )

  removeUserConfirm: (entity, idx) =>
    title = 'Are you sure you want to remove this user?'
    text = ""
    @SweetAlert.confirm({
      title: title
      confirmButtonText: 'Yes, Please!'
      showLoaderOnConfirm: true
      preConfirm: =>
        @removeUserFromTeam(entity, idx)
    })

  removeUserFromTeam: (entity, idx) =>
    payload =
      members: []
    payload.id = entity.team_id
    payload.name = entity.team_name
    payload.members.push {user_id: entity.user_id, role_id: entity.role_id, is_active: false}

    @Restangular.one('firms', @currentFirmId).one('teams', entity.team_id).customPUT(payload).then ((response) =>
      @toaster.pop 'success', '', 'User removed successfully' , 2000
      @initData()
      swal.close()
    ), ((error) =>
      swal.close()
      avoid_error_logging_statuses = @BaseDataService.getAvoidErrorLoggingStatusList()
      @saving_team = false
      if !(error.status in avoid_error_logging_statuses)
        @Utils.logError('Edit team failed', error)
    )


  removeTeamConfirm: (entity, idx) =>
    title = 'Are you sure you want to remove this team?'
    text = ""
    @SweetAlert.confirm({
      title: title
      confirmButtonText: 'Yes, Please!'
      showLoaderOnConfirm: true
      preConfirm: =>
        @removeTeamFromUser(entity, idx)
    })

  removeTeamFromUser: (entity, idx) =>
    payload =
      members: []
    payload.id = entity.team_id
    payload.name = entity.team_name
    payload.members.push {user_id: entity.user_id, role_id: entity.role_id, is_active: false}
    @Restangular.one('firms', @currentFirmId).one('teams', entity.team_id).customPUT(payload).then ((response) =>
      @toaster.pop 'success', '', 'Team removed successfully' , 2000
      swal.close()
      @getUserInTeamsAsResource()
      @getSelectedTabData(@selectedTabForResources)
    ), ((error) =>
      swal.close()
      avoid_error_logging_statuses = @BaseDataService.getAvoidErrorLoggingStatusList()
      if !(error.status in avoid_error_logging_statuses)
        @Utils.logError('Edit team failed', error)
    )

  addTeamMembers: =>
    @ModalFactory.invokeModal 'edit_team',
      resolve:
        existing_members : => @team_members
        team : => @current_team
        adding_member : => true
      success: (response) =>
        @initData()


  addUserToTeam: ->
    unless @selectedUser.firmwide_role_name.toLowerCase() == @USER_ROLES.SECURITYADMIN
      @ModalFactory.invokeModal 'new_team',
        resolve:
          gridData: => null
          entityData: => null
          user: => {id: @$stateParams.entity_id, name: @$stateParams.entity_name}
        success: (new_user) =>
          @initData()

  removeTeam: ->
    @Restangular.one('firms', @currentFirmId).one('teams', @$stateParams.entity_id).remove().then (=>
      @toaster.pop 'success', '', 'Team deleted successfully'
      swal.close()
      @goBack()
    ), ((error) =>
      swal.close()
    )

  getVisibilityList: =>
    @Restangular.all('PermissionLevels').customGET().then (response) =>
      @accessList = response
      @accessListMain = response
      index = _(response).findIndex (permission)=>
        permission.name == 'Private'
      @accessListTemplate = response.slice(0,index)

  onResourceTypeChanged: =>
    if @selectedTabForResources == @keywordConstants.Template
      @accessList = @accessListTemplate
    else
      @accessList = @accessListMain

  revokeAccessModal: (entity) ->
    @SweetAlert.confirm({
      title: 'Are you sure you want to revoke access ?'
      confirmButtonText: 'Yes, Please!'
      showLoaderOnConfirm: true
      preConfirm: =>
        @revokeAccess(entity)
    })

  toggleSelectAll: (gridApi,rows) =>
    if gridApi.grid.options.gridName
      if gridApi.grid.options.gridName == "team_members"
        @toggleSelectAllTeamMembers(gridApi,rows)
      else if gridApi.grid.options.gridName == "assignments_grid"
        @toggleSelectAllAssignments(gridApi,rows)
      else if gridApi.grid.options.gridName == "user_teams"
        @toggleSelectAllUserTeams(gridApi,rows)

  toggleSelectAllAssignments: (gridApi,rows) =>
    #get total selected rows from the grid api
    selectedCount = gridApi.selection.getSelectedRows().length
    selectAll = selectedCount > 0
    @totalSelectedRecords = selectedCount
    @$scope.vm.show_bulk_actions = selectAll

  toggleSelectAllUserTeams: (gridApi,rows) =>
    #get total selected rows from the grid api
    selectedCount = gridApi.selection.getSelectedRows().length
    selectAll = selectedCount > 0
    @totalSelectedRecords = selectedCount
    @$scope.vm.show_bulk_actions_team_permissions = selectAll

  toggleSelectAllTeamMembers: (gridApi,rows) =>
    #get total selected rows from the grid api
    selectedCount = gridApi.selection.getSelectedRows().length
    selectAll = selectedCount > 0
    @totalSelectedRecords = selectedCount
    @$scope.vm.show_bulk_actions_team_permissions = selectAll

  toggleButtonClick: (grid,row) =>
    #Normal row selection is handled by ui grid
    #But grouped rows we have to handle. Following conditions are for that.
    if row.internalRow
      angular.forEach row.treeNode.children,(children) =>     #loop over all the rows inside this group
        children.row.isSelected = false
        #select only visible rows
        if children.row.visible and row.isSelected
          children.row.isSelected = true             #and select all the rows inside that group

    #Below logic is used to select the group header row if all items inside the group are selected.
    else if row.treeNode.parentRow                            #if the row is a child inside a group
      row.treeNode.parentRow.isSelected = true                #Check the group header row
      angular.forEach row.treeNode.parentRow.treeNode.children,(children) =>
        if !children.row.isSelected                           #if any of the group's children are not checked
          row.treeNode.parentRow.isSelected = false           #then uncheck the group header row

    #Get the number of selected rows
    @totalSelectedRecords = grid.api.selection.getSelectedRows().length

    #Show/hide bulk actions depending on the number of selected rows.
    if @totalSelectedRecords > 0
      if grid.options.gridName == "assignments_grid"
        @$scope.vm.show_bulk_actions = true
      else
        @$scope.vm.show_bulk_actions_team_permissions = true
    else
      @$scope.vm.show_bulk_actions_team_permissions = false
      @$scope.vm.show_bulk_actions = false

  confirmBulkTeamMemberDeletion: ->
    title = 'Are you sure you want to remove selected members?'
    text = ""
    @SweetAlert.confirm({
      title: title
      confirmButtonText: 'Yes, Please!'
      showLoaderOnConfirm: true
      preConfirm: =>
        @deleteSelectedTeamsMembers()
    })

  deleteSelectedTeamsMembers: =>
    items_arr = @teamMembersGrid.selection.getSelectedRows()

    for item in items_arr
      item.is_active = false

    @Restangular.one('firms', @currentFirmId).all('TeamMemberships/bulk_update').customPUT(items_arr).then ((response) =>
      @initData()
      @closeQuickActions(@$stateParams.entity_type)
      swal.close()
      @$scope.vm.show_bulk_actions_team_permissions = false
    ), ((error) =>
      swal.close()
      @$scope.vm.show_bulk_actions_team_permissions = false
    )

  confirmBulkUserTeamDeletion: ->
    title = 'Are you sure you want to remove selected teams?'
    text = ""
    @SweetAlert.confirm({
      title: title
      confirmButtonText: 'Yes, Please!'
      showLoaderOnConfirm: true
      preConfirm: =>
        @deleteSelectedUserTeams()
    })

  deleteSelectedUserTeams: =>
    items_arr = @userInTeamsGrid.selection.getSelectedRows()

    for item in items_arr
      item.is_active = false

    @Restangular.one('firms', @currentFirmId).all('TeamMemberships/bulk_update').customPUT(items_arr).then ((response) =>
      @initData()
      @closeQuickActions(@$stateParams.entity_type)
      swal.close()
      @$scope.vm.show_bulk_actions_team_permissions = false
    ), ((error) =>
      swal.close()
      @$scope.vm.show_bulk_actions_team_permissions = false
    )

  closeQuickActions: (type) =>
    items_arr = []
    selectedGrid = {}
    if type
      if type == @assignments_grid_type
        @assignmentsGrid.selection.clearSelectedRows()
        items_arr = @assignmentsGrid.grid.rows
        selectedGrid = @assignmentsGrid
      else if type == 'Team'
        @teamMembersGrid.selection.clearSelectedRows()
        items_arr = @teamMembersGrid.grid.rows
        selectedGrid = @teamMembersGrid
      else if type == 'User'
        @userInTeamsGrid.selection.clearSelectedRows()
        items_arr = @userInTeamsGrid.grid.rows
        selectedGrid = @userInTeamsGrid

      _(items_arr).each (rows) =>
        rows.isSelected = false
        rows.entity.isSelected = false
        selectedGrid.selection.unSelectRow(rows)
      selectedGrid.grid.appScope.vm.select_all = false

    @$scope.vm.show_bulk_actions = false
    @$scope.vm.show_bulk_actions_team_permissions = false

  confirmBulkResourceDeletion: ->
    title = 'Are you sure you want to remove selected items?'
    text = ""
    @SweetAlert.confirm({
      title: title
      confirmButtonText: 'Yes, Please!'
      showLoaderOnConfirm: true
      preConfirm: =>
        @deleteSelectedResources()
    })

  deleteSelectedResources: =>
    items_arr = @assignmentsGrid.selection.getSelectedRows()

    for item in items_arr
      item.is_active = false

    @Restangular.one('firms', @currentFirmId).all('ResourcePermissions/bulk_update').customPUT(items_arr).then ((response) =>
      @getSelectedTabData(@selectedTabForResources)
      @closeQuickActions(@assignments_grid_type)
      swal.close()
    ), ((error) =>
      swal.close()
    )

  editSelectedRoles: =>
    @bulkRoleEditMode = true

  cancelBulkRoleEdit: =>
    @bulkRoleEditMode = false

  cancelEditSelectedRoles: =>
    @bulkRoleEditMode = false



  displayAccessChangeConfirmation: (data, type) =>
    text = ""
    if type == 'assignment'
      text = 'Are you sure you want to change visibility to '+data.alias+' ?'
    else
      text = 'Are you sure you want to change role '+data.alias+' ?'
    @SweetAlert.confirm({
      title: text
      confirmButtonText: 'Yes, Please!'
      showLoaderOnConfirm: true
      preConfirm: =>
        @bulkEditAccess(data, type)
    })

  bulkEditAccess: (data, type) =>
    if type == 'assignment'
      items_arr = @assignmentsGrid.selection.getSelectedRows()
      RestEndpoint = @Restangular.one('firms', @currentFirmId).all('ResourcePermissions/bulk_update')
    else if type == 'teams'
      RestEndpoint = @Restangular.one('firms', @currentFirmId).all('TeamMemberships/bulk_update')

      if @$stateParams.entity_type == 'User'
        items_arr = @userInTeamsGrid.selection.getSelectedRows()
      else
        items_arr = @teamMembersGrid.selection.getSelectedRows()

    for item in items_arr
      if type == 'assignment'
        item.access_level = data.name
      else
        item.role_id = data.id

    RestEndpoint.customPUT(items_arr).then ((response) =>
      @initData()
      if type == 'assignment'
        @cancelEdit()
        @closeQuickActions(@assignments_grid_type)
      else
        @cancelEditSelectedRoles()
        @closeQuickActions(@$stateParams.entity_type)
      swal.close()
    ), ((error) =>
      if type == 'assignment'
        @cancelEdit()
        @closeQuickActions(@assignments_grid_type)
      else
        @cancelEditSelectedRoles()
        @closeQuickActions(@$stateParams.entity_type)
      swal.close()
    )

  editSelected: =>
    @bulkResourceEditMode = true

  cancelEdit: =>
    @bulkResourceEditMode = false

  revokeAccess: (entity) =>
    @Restangular.one('firms', @currentFirmId).one('ResourcePermissions', entity.id).remove().then(=>
      @toaster.pop 'success', '', 'Access Revoked'
      @getSelectedTabData(@selectedTabForResources)
    ).finally (=>
      swal.close() #stupid angular-sweetalert guy isn't tagging the updated code!
      @initData()
    )

  getRoles: =>
    @Restangular.one('firms', @currentFirmId).all('roles').getList(is_firmwide: false).then (response) =>
      @roles = response

  manageResources: (resources) =>
    teamIds = []
    @funds = []
    @firms = []
    @projects = []
    for item in resources
      if item.entity_type == "Fund"
        @funds.push item
        # @funds.push {name: item.entity_name, id: item.entity_id, access_level: item.access_level, owner_name: item.assigned_to_name, assigned_to_entity_type: item.assigned_to_entity_type, role_name: item.role_name}
      if item.entity_type == "Firm"
        # @firms.push {name: item.entity_name, id: item.entity_id, access_level: item.access_level, owner_name: item.assigned_to_name, assigned_to_entity_type: item.assigned_to_entity_type, role_name: item.role_name}
        @firms.push item
      if item.entity_type == "Duediligence"
        # @projects.push {name: item.entity_name, id: item.entity_id, access_level: item.access_level, owner_name: item.assigned_to_name, assigned_to_entity_type: item.assigned_to_entity_type, role_name: item.role_name}
        @projects.push item


  getTeamsByUserId: (id) =>
    @$http.get(@baseUrl + '/firms/'+@currentFirmId+'/users/'+id+'/TeamMemberships').then (response) =>
      @teams = response.data


  getUserInTeamsAsResource: =>
    @allTeamsUserIsIn = null
    @$timeout =>
      @allTeamsUserIsIn = @UserInTeamsResource.$new({id: parseInt(@$stateParams.entity_id), firm_id: @currentFirmId})

  showInitials: (fullName) ->
    if fullName
      firstName = fullName.split(' ').slice(0, -1).join(' ')
      lastName = fullName.split(' ').slice(-1).join(' ')
      initials = firstName[0] + lastName[0]
      initials

  openNewPermissionDialog: ->
    unless @$stateParams.entity_type and @$stateParams.entity_type == 'User' and @selectedUser.firmwide_role_name.toLowerCase() == @USER_ROLES.SECURITYADMIN
      @ModalFactory.invokeModal 'manage_permissions',
        resolve:
          tabType : => {type: @$stateParams.entity_type, id: @$stateParams.entity_id, name: @$stateParams.entity_name, entity_type: @selectedTabForResources}
          resource_data : => null
        success: (response) =>
          @initData()

  editResourceList: (data) ->
    @ModalFactory.invokeModal 'manage_permissions',
      resolve:
        tabType : => null
        resource_data : => data
      success: (response) =>
        @initData()

  getUserResources: (id) =>
    @$http.get(@baseUrl + '/firms/'+@currentFirmId+'/users/'+id+'/ResourcePermissions').then (response) =>
      @resources = response.data
      @manageResources(@resources)


  getTeamResources: (id) =>
    @$http.get(@baseUrl + '/firms/'+@currentFirmId+'/teams/'+id+'/ResourcePermissions').then (response) =>
      @resources = response.data
      @manageResources(@resources)

  openRow: (row,col)=>
    if !row.internalRow && col.field != "selectionRowHeaderCol"  && col.field != 'action'
      @goToSelectedEntity(row.entity)


  openPermissionsRow: (row,col)=>
    if !row.internalRow && col.field != "selectionRowHeaderCol" && col.field != 'action'
      if row.entity.entity_type == 'Fund' and @is_investor
        @$state.go 'app.funds.profile.monitor',{fundId: row.entity.entity_id}
      else if row.entity.entity_type == 'Fund' and @is_manager
        @$state.go 'app.funds.profile.summary',{fundId: row.entity.entity_id}
      else if row.entity.entity_type == 'Firm'
        @$state.go 'app.firms.profile.monitor',{firmId: row.entity.entity_id}
      else if row.entity.entity_type == 'Duediligence' and @is_investor
        @$state.go 'app.diligence.project.summary',{diligenceId: row.entity.entity_id}
      else if row.entity.entity_type == 'Duediligence' and @is_manager
        @$state.go 'app.diligence.project.questionnaire',{diligenceId: row.entity.entity_id}
      else if row.entity.entity_type == 'Template'
        @$state.go 'app.diligence.template.preview',{templateId: row.entity.entity_id}

  getSelectedTabData: (type)=>
    @loading_assignments = true
    @selectedTabForResources = type
    @assignmentResources = null
    @$timeout =>
      @assignmentResources = @EntityAssignmentResource.$new({entity_type:type, firms: @currentFirmId, owner_id: @$stateParams.entity_id, owner_type: @$stateParams.entity_type})
      @onResourceTypeChanged()
      @closeQuickActions()
      @loading_assignments = false
