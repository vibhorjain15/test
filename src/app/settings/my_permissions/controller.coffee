class MyPermissionsController extends BaseController
  @register 'MyPermissionsController'

  @inject 'Restangular', 'Utils', '$q', '$timeout', 'SweetAlert', '$scope', 'toaster', '$stateParams', '$http', 'baseUrl', '$state', '$window', 'ModalFactory', 'EntityAssignmentResource','angularEnabled'

  initialize: ->
    @is_admin = @Utils.isAdmin()
    @current_user = @Utils.getCurrentUser()
    @hasFirmWideRole = @Utils.hasFirmWideRole()
    @currentFirmId = @current_user.firmInfo.id
    @edit_self_mode = false
    @selectedUser = {}
    @teams = []
    @roles = []
    @funds = []
    @firms = []
    @projects = []
    @selectedTabForResources = 'Fund'
    @assignmentResources = null
    @is_manager = @Utils.isManager()
    @is_investor = @Utils.isInvestor()
    @initData()


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

  initData: =>
    @getRoles()
    @getTeamsByUserId(@current_user.id)
    @getSelectedTabData(@selectedTabForResources)


  goToSelectedEntity: (row)=>
    @$state.go("app.firm.settings.permission.detail",{entity_id: row.team_id, entity_type: 'Team', entity_name: row.team_name})

  toggleAddRemove: (item) =>
    if item.removed
      item.removed = false
    else
      item.removed = true


  getRoles: =>
    @Restangular.one('firms', @currentFirmId).all('roles').getList(is_firmwide: true).then (response) =>
      @roles = response
      @roleDescription = _(@roles).findWhere({name: @current_user.firmwide_role}).description


  revokeAccess: (entity) =>
    @loading = true
    @Restangular.one('firms', @currentFirmId).one('ResourcePermissions', entity.id).remove().then(=>
      @loading = false
      @toaster.pop 'success', '', 'Access Revoked'
      @initData()
    ).finally (=>
      @loading = false
    )


  editUser: ->
    @ModalFactory.invokeModal 'new_user',
      resolve:
        existing_user: => {id: @current_user.id, name: @current_user.fullName}
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
      'role_id': entity.role_id
      'Assigned_member_ids': []
      'Unassigned_member_ids': [ entity.user_id ]
      'team':
        'id': entity.team_id
        'name': entity.team_name

    @Restangular.one('firms', @currentFirmId).one('teams', entity.team_id).customPUT(payload).then ((response) =>
      @toaster.pop 'success', '', 'User removed successfully' , 2000
      @team_members.splice idx, 1
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
      'role_id': entity.role_id
      'Assigned_member_ids': []
      'Unassigned_member_ids': [entity.user_id]
      'team':
        'id': entity.team_id
        'name': entity.team_name

    @Restangular.one('firms', @currentFirmId).one('teams', entity.team_id).customPUT(payload).then ((response) =>
      @toaster.pop 'success', '', 'Team removed successfully' , 2000
      @teams.splice idx, 1
      swal.close()
    ), ((error) =>
      swal.close()
      avoid_error_logging_statuses = @BaseDataService.getAvoidErrorLoggingStatusList()
      if !(error.status in avoid_error_logging_statuses)
        @Utils.logError('Edit team failed', error)
    )


  addUserToTeam: ->
    @ModalFactory.invokeModal 'new_team',
      resolve:
        gridData: => null
        entityData: => null
        user: => {id: @current_user.id, name: @current_user.fullName}
      success: (new_user) =>
        @initData()


  revokeAccessModal: (entity) ->
    @SweetAlert.confirm({
      title: 'Are you sure you want to revoke access ?'
      confirmButtonText: 'Yes, Please!'
      showLoaderOnConfirm: true
      preConfirm: =>
        @revokeAccess(entity)
    })


  revokeAccess: (entity) =>
    @Restangular.one('firms', @currentFirmId).one('ResourcePermissions', entity.id).remove().then(=>
      @toaster.pop 'success', '', 'Access Revoked'
    ).finally (=>
      swal.close() #stupid angular-sweetalert guy isn't tagging the updated code!
      @initData()
    )

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

  getTeamMembers: (id) =>
    # firms/1/Teams/24/TeamMemberships
    @$http.get(@baseUrl + '/firms/'+@currentFirmId+'/Teams/'+id+'/TeamMemberships').then (response) =>
      @team_members = response.data

  getTeamsByUserId: (id) =>
    @$http.get(@baseUrl + '/firms/'+@currentFirmId+'/users/'+id+'/TeamMemberships').then (response) =>
      @teams = response.data

  openNewPermissionDialog: ->
    @ModalFactory.invokeModal 'manage_permissions',
      resolve:
        tabType : => {type: 'User', id: @current_user.id, name: @current_user.fullName, entity_type: @selectedTabForResources}
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

  getSelectedTabData: (type)=>
    @loading_assignments = true
    @selectedTabForResources = type
    @$timeout =>
      @assignmentResources = @EntityAssignmentResource.$new({entity_type:type, firms: @currentFirmId, owner_id: @current_user.id, owner_type: 'User'})
      for column, index in @assignmentResources.columnDefs
        if column.field == 'action'
          @assignmentResources.columnDefs.splice index, 1
          break
      @loading_assignments = false

  openPermissionsRow: (row,col)=>
    if !row.internalRow && col.field != "selectionRowHeaderCol"
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
