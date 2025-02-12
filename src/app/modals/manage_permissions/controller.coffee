class ManagePermissionController extends ModalController

  @register 'ManagePermissionController'

  @inject '$uibModalInstance', 'Restangular', 'Utils', '$state', 'tabType', 'resource_data', '$q', 'FundDataservice', 'FirmsResource', '$http', 'baseUrl', '$timeout', 'toaster', 'BaseDataService', 'DueDiligenceDataservice', 'FirmDataservice','total_entity_records','keywordConstants','USER_ROLES'

  initialize: ->
    @edit_mode = false
    @modalTitle = "Manage Permission"
    @selectMyFirm = false
    @accessLevelText = null
    @minDate = moment().subtract(5,'years').toDate()
    @maxDate = new Date()
    @is_investor = @Utils.isInvestor()
    @is_manager = @Utils.isManager()
    @formData = {
      "private_access": {}
    }
    @accessList = []
    @is_admin = @Utils.isAdmin()
    @current_user = @Utils.getCurrentUser()
    @loading = true
    @currentFirmId = @current_user.firmInfo.id

    @filters = {
      'Firm':{
        'tag_id': 'tag_id'
        'relationship_status_id': 'relationship_status_id'
      }
      'Fund':{
        'tag_id': 'tag_id'
        'relationship_status_id': 'relationship_status_id'
        'strategyId': 'strategyId'
      }
      'DueDiligence':{

      }
    }

    promises = []
    if @tabType
      if @tabType.type == "User"
        promises.push @getRoles()
        promises.push @fetchEmployees()
      if @tabType.type == "Team"
        promises.push @getVisibilityList()
        promises.push @getTeams()
    else if @resource_data
      @edit_mode = true
      if @resource_data.assigned_to_entity_type == 'User'
        promises.push @getRoles()
      else
        promises.push @getVisibilityList()
    else
      promises.push @getRoles()
      promises.push @getVisibilityList()
      promises.push @getTeams()
      promises.push @fetchEmployees()

    @$q.all(promises).then =>
      @diligence_types = [{name: 'Firm', value: 'Firm'}, {name: 'Product', value: 'Fund'}]
      if @is_manager
        @diligence_types = [{name: 'My Firm', value: 'MyFirm'}, {name: 'Product', value: 'Fund'}]
      @diligence_type = @diligence_types[0].value

      if @tabType
        if @tabType.type == "User"
          @setSelectionType('person')
          @getUserResources(@tabType.id)
        else if @tabType.type == "Team"
          @getTeamResources(@tabType.id)
          @setSelectionType('team')

        @formData.entity_type = @tabType.entity_type
      else
        @formData.entity_type = @keywordConstants.Product
        @setSelectionType('team')

      if @resource_data
        @selectionType = if @resource_data.assigned_to_entity_type == 'User' then 'person' else 'team'
        @formData = angular.copy @resource_data
        if @resource_data.assigned_to_entity_type == 'User'
          @selectionType = "person"
          @modalTitle = 'Manage Role Of '+@resource_data.assigned_to_name
        else
          @modalTitle = 'Manage Visibility Of '+@resource_data.assigned_to_name
          @selectionType = "team"

        @setSelectionType(@selectionType)
        @loading = false
        if @selectionType == 'team'
          @formData.private_access  = _(@accessList).findWhere({name: @resource_data.access_level})
      
      @onResourceTypeChanged()

  getVisibilityList: =>
    @Restangular.all('PermissionLevels').customGET().then (response) =>
      @accessList = response
      @accessListMain = response
      index = _(response).findIndex (permission)=>
        permission.name == 'Private'
      @accessListTemplate = response.slice(0,index)

  onResourceTypeChanged: =>
    if @formData.entity_type == @keywordConstants.Template
      @accessList = @accessListTemplate
    else
      @accessList = @accessListMain

  getRoles: =>
    @Restangular.one('firms', @currentFirmId).all('roles').getList(is_firmwide: false).then (response) =>
      @roles = response

  getTeams: =>
    @Restangular.one('firms', @currentFirmId).all('teams').getList().then (response) =>
      @teams = response
      if @tabType and  @tabType.type != 'User'
        @formData.teams = []
        @formData.teams.push _(@teams).findWhere({id: parseInt @tabType.id})
      if @edit_mode
        @formData.teams = []
        @formData.teams.push _(@teams).findWhere({id: @resource_data.assigned_to_entity_id})

  sortMembers: () =>
    @team_members = _(@team_members).sortBy((member) =>
      member.fullName.toLowerCase()
    )

  fetchEmployees: =>
    @Restangular.one('firms', @currentFirmId).all('users').getList().then (response) =>
      @team_members = _(response).filter (user)=>
        user.firmwide_role_name.toLowerCase() != @USER_ROLES.SECURITYADMIN
      @sortMembers()
      if @tabType and  @tabType.type == 'User'
        @formData.users = []
        @formData.users.push _(@team_members).findWhere({id: Number(@tabType.id)})
      if @edit_mode
        @formData.users = []
        @formData.users.push _(@team_members).findWhere({id: @resource_data.assigned_to_entity_id})

  filterUsers: (query) =>
    return @team_members unless query
    regex = new RegExp(query, 'i')
    _(@team_members).filter((member) -> regex.test(member.fullName))


  filterTeams: (query) =>
    return @teams unless query
    regex = new RegExp(query, 'i')
    _(@teams).filter((member) -> regex.test(member.name))

  # filterResources: (query) =>
  #   return @resources unless query
  #   regex = new RegExp(query, 'i')
  #   _(@resources).filter((fund) ->
  #     regex.test(fund.name)
  #     )

  getApiPayload: ->
    if @edit_mode
      obj = {}
      obj.id = @resource_data.id
      obj.assigned_to_entity_type = @resource_data.assigned_to_entity_type
      obj.assigned_to_entity_id = @resource_data.assigned_to_entity_id
      obj.entity_type = @resource_data.entity_type
      obj.entity_id = @resource_data.entity_id
    else
      obj = {}
      obj.assigned_to_entity_type = if @selectionType == 'person' then "User" else 'Team'
      obj.entity_type = @formData.entity_type
      obj.entity_ids = _(@formData.resource_list_ids).pluck('id')
      if @formData.entity_type == "my_firm"
        obj.entity_ids = []
        obj.entity_ids.push @currentFirmId
        obj.entity_type = 'Firm'
      if @selectionType == 'team'
        obj.assigned_to_entity_ids = _(@formData.teams).pluck('id')
      else
        obj.assigned_to_entity_ids = _(@formData.users).pluck('id')
      if @tabType
        obj.assigned_to_entity_ids = []
        obj.assigned_to_entity_ids.push Number(@tabType.id)

    if @selectionType != 'team'
      obj.role_id = @formData.role.id

    if @selectionType == 'team'
      obj.access_level = @formData.private_access.name
    obj

  validateResourceList: =>
    if not @edit_mode and @formData.resource_list_ids.length <= 0
      @toaster.pop 'error','','Please select resources'
      return false
    return true

  submit: =>
    @new_team_form.$setSubmitted(true)
    if @new_team_form.$valid and @validateResourceList()
      payload = @getApiPayload()
      @saving = true
      if @edit_mode
        @$http.put(@baseUrl + '/firms/'+@currentFirmId+'/ResourcePermissions/' + payload.id, payload).then ((response) =>
          @saving = false
          response = 'success'
          @toaster.pop 'success', '', "Resources assigned successfully"
          @$uibModalInstance.close response
        ), ((error) =>
          @saving = false
          message = 'Something went wrong. Please try again.'
          if error.data and error.data.message
            message = error.data.message
          @toaster.pop 'error', '', message
          avoid_error_logging_statuses = @BaseDataService.getAvoidErrorLoggingStatusList()
          if !(error.status in avoid_error_logging_statuses)
            @Utils.logError('Error while updating permission', error)
        )
      else
        @$http.post(@baseUrl + '/firms/'+@currentFirmId+'/ResourcePermissions', payload).then ((response) =>
          @saving = false
          response = 'success'
          @toaster.pop 'success', '', "Resources assigned successfully"
          @$uibModalInstance.close response
        ), ((error) =>
          @saving = false
          message = 'Something went wrong. Please try again.'
          if error.data and error.data.message
            message = error.data.message
          @toaster.pop 'error', '', message
          avoid_error_logging_statuses = @BaseDataService.getAvoidErrorLoggingStatusList()
          if !(error.status in avoid_error_logging_statuses)
            @Utils.logError('Error while updating permission', error)
        )

  setSelectionType: (type) =>
    @selectionType = type
    if @selectionType == 'team'
      @formData.private_access = _(@accessList).findWhere({name: "All"})
    else if @selectionType == 'person'
      @formData.role = _(@roles).findWhere({name: "Viewer"})
      if @edit_mode and @resource_data.assigned_to_entity_type == 'User'
        @formData.role = _(@roles).findWhere({id: Number(@resource_data.role_id)})

  getUserResources: (id) =>
    @$http.get(@baseUrl + '/firms/'+@currentFirmId+'/users/'+id+'/ResourcePermissions').then (response) =>
      @resources = response.data


  getTeamResources: (id) =>
    @$http.get(@baseUrl + '/firms/'+@currentFirmId+'/teams/'+id+'/ResourcePermissions').then (response) =>
      @resources = response.data
