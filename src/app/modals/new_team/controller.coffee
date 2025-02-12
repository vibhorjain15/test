class AddTeamController extends ModalController

  @register 'AddTeamController'

  @inject '$uibModalInstance', 'Restangular', 'Utils', '$state', '$q', '$scope', '$http' , 'baseUrl', 'gridData', '$timeout', 'toaster', 'entityData', 'user','BaseDataService', 'SweetAlert','FundDataservice','FirmDataservice','keywordConstants','USER_ROLES'

  initialize: ->
    # @is_investor = @Utils.isInvestor()
    @is_admin = @Utils.isAdmin()
    @teamType = "new"
    @addToTeam = {}
    @team_members = []
    @idsOfMyTeam = []
    @formData = {}
    @alreadyAddedMembers = []
    @membersObject = {
      "memberNames": []
    }
    @adding_new_members = false
    @existing_members = []
    @formData.team_members = []
    @editingName = true
    @current_user = @Utils.getCurrentUser()
    @currentFirmId = @current_user.firmInfo.id
    @originalTeamMembers = []
    @teamCreated = false
    @modifiedData = []
    @resources = []
    @teamSelectorDisplayParams ={
      id: 'id'
      name: 'fullName'
    }
    @permissions = {
      entity_type: @keywordConstants.Product
      resource_list_ids: []
    }
    if @gridData
      team_ids = @getTeamIds(@gridData)
      @modifiedData = @modifyGridData(team_ids, @gridData)

    if @entityData
      @edit_role_mode = true
      @initResources()

    if @user
      @initResources()

    @teams = [{}]
    @roles = []

  initResources: =>
    @loading_resources = true
    promises = []
    if @edit_role_mode
      promises.push @getRoles()
    else if @user
      promises.push @getRoles()
      promises.push @getTeams()
    else
      promises.push @fetchEmployees()
      promises.push @getRoles()
      promises.push @getVisibilityList()

    @$q.all(promises).then (response)=>
      @loading_resources = false
      @loading = true

  getTeamIds: (gridData) ->
    tempTeamIDs = []
    for item in gridData
      if tempTeamIDs.indexOf(item.team_id) == -1
        tempTeamIDs.push item.team_id
    tempTeamIDs


  getTeamsByUserId: (id) =>
    @$http.get(@baseUrl + '/firms/'+@currentFirmId+'/users/'+id+'/TeamMemberships').then (response) =>
      @myTeams = response.data
      if @myTeams.length
        @idsOfMyTeam  = _(@myTeams).pluck 'team_id'
      @teams = _(@teams).filter((team) =>
            @idsOfMyTeam.indexOf(team.id) == -1
          )
      if !@teams.length
        @teams = [{}]


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
      indexOfAddedMember = @alreadyAddedMembers.indexOf(entity.user_id)
      @existing_members.splice idx, 1
      if indexOfAddedMember > -1
        @alreadyAddedMembers.splice indexOfAddedMember, 1
      userIndex = _(@membersObject.memberNames).findIndex (member)=>
          member.id == entity.user_id
      if userIndex > -1
        @membersObject.memberNames.splice userIndex, 1
      @getExistingTeamMembers(payload.id)
      swal.close()
    ), ((error) =>
      swal.close()
      avoid_error_logging_statuses = @BaseDataService.getAvoidErrorLoggingStatusList()
      @saving_team = false
      if !(error.status in avoid_error_logging_statuses)
        @Utils.logError('Edit team failed', error)
    )

  setRoleText: (role_id) =>
    role = _(@roles).findWhere({id: role_id})
    if role
      @roleText = role.description

  modifyGridData: (teamIds, gridData) ->
    modifiedData = []
    for item in teamIds
      obj = {}
      obj.team_members = []
      for gridItem in gridData
        if gridItem.team_id == item
          obj.team_name = gridItem.team_name
          obj.team_id = gridItem.team_id
          obj.team_members.push {id: gridItem.user_id, fullName: gridItem.user_name, role: gridItem.role_name, role_id: gridItem.role_id}
      modifiedData.push obj
    modifiedData

  getVisibilityList: =>
    @Restangular.all('PermissionLevels').customGET().then (response) =>
      @accessList = response
      @accessListMain = response
      index = _(response).findIndex (permission)=>
        permission.name == 'Private'
      @accessListTemplate = response.slice(0,index)
      @permissions.private_access = _(@accessList).findWhere({name: "All"})

  onResourceTypeChanged: =>
    if @permissions.entity_type == @keywordConstants.Template
      @accessList = @accessListTemplate
    else
      @accessList = @accessListMain

  sortMembers: () =>
    @team_members = _(@team_members).sortBy((member) =>
      member.fullName.toLowerCase()
    )

  fetchEmployees: =>
    @Restangular.one('firms', @currentFirmId).all('users').getList().then (response) =>
      @team_members = _(response).filter (user)=>
        user.firmwide_role_name.toLowerCase() != @USER_ROLES.SECURITYADMIN
      @copy_of_team_members = angular.copy @team_members
      @sortMembers()


  getRoles: =>
    @Restangular.one('firms', @currentFirmId).all('roles').getList(is_firmwide: false).then (response) =>
      @roles = response
      role_id = null
      @membersObject.role_id =  _(@roles).findWhere({name: 'Viewer'}).id
      if @membersObject.role_id
        role_id = @membersObject.role_id
      if @edit_role_mode
        @formData.role_id = _(@roles).findWhere({id: Number(@entityData.role_id)}).id
        if @formData.role_id
          role_id = @formData.role_id
      if @user
        @addToTeam.role_id = _(@roles).findWhere({name: 'Viewer'}).id
        if @addToTeam.role_id
          role_id = @addToTeam.role_id
      if role_id
        @setRoleText(role_id)

  getTeams: =>
    @Restangular.one('firms', @currentFirmId).all('teams').getList().then (response) =>
      @teams = response
      if @user
        @getTeamsByUserId(@user.id)
      if !@teams.length
        @teams = [{}]
      if @edit_role_mode
        @formData.team = _(@teams).findWhere({id: @entityData.team_id})

  removeAddedUsersFromSelectionList: =>
    @team_members = []
    #filter the list manually to use the copy of each object instead of directly using the object
    _(@copy_of_team_members).each((member) =>
      if @alreadyAddedMembers.indexOf(member.id) == -1
        @team_members.push angular.copy(member)
    )
    @sortMembers()

  setTeamType: (type) ->
    @teamType = type

  createNewTeam: (term) =>
    @$scope.$apply =>
      @teams.push {name: term}
      @newTeamAdded = true
      @formData.team = @teams[@teams.length - 1]



  getApiPayload: (addedMembers) ->
    payload =
      members: []

    if @createdTeam
      payload.id = @createdTeam.id
      payload.name = @createdTeam.name
    else
      payload.name = @formData.team_name
    if addedMembers and addedMembers.memberNames.length
      for eachMember in addedMembers.memberNames
        if @alreadyAddedMembers.indexOf(Number(eachMember.id)) == -1
          @alreadyAddedMembers.push Number(eachMember.id)
          payload.members.push {user_id: eachMember.id, role_id: addedMembers.role_id, is_active: true}
    payload

  getExistingTeamMembers: (id) =>
    @Restangular.one('firms', @currentFirmId).one('teams', id).all('TeamMemberships').customGET().then (response) =>
      @existing_members = response
      @alreadyAddedMembers = _(@existing_members).pluck 'user_id'
      @removeAddedUsersFromSelectionList()

  addUserToTeam: =>
    if !@addToTeam.team
      @toaster.pop 'error', '', 'Please select a team' , 2000
      return false
    if !@addToTeam.role_id
      @toaster.pop 'error', '', 'Please select role' , 2000
      return false

    payload =
      members: []
    payload.id = @addToTeam.team.id
    payload.name = @addToTeam.team.name
    payload.members.push {user_id: @user.id, role_id: @addToTeam.role_id, is_active: true}
    @adding_user_to_teams = true
    @Restangular.one('firms', @currentFirmId).one('teams', payload.id).customPUT(payload).then ((response) =>
      @toaster.pop 'success', '', "Members added successfully", 2000
      @adding_new_members = false
      @$uibModalInstance.close response
      @adding_user_to_teams = false
    ), ((error) =>
      @adding_user_to_teams = false

    )

  validateData: (addedMembers) ->
    if !addedMembers.role_id
      @toaster.pop 'error', '', 'Please select role' , 2000
      return false
    if !addedMembers.memberNames.length
      @toaster.pop 'error', '', 'Please select team members' , 2000
      return false
    return true

  addMembersRow: =>
    if @validateData(@membersObject)
      payload = @getApiPayload(@membersObject)
      if payload
        @adding_new_members = true
        @Restangular.one('firms', @currentFirmId).one('teams', @createdTeam.id).customPUT(payload).then ((response) =>
          @toaster.pop 'success', '', "Members added successfully", 2000
          @adding_new_members = false
          @getExistingTeamMembers(@createdTeam.id)
        ), ((error) =>
          @adding_new_members = false
        )

  updateRole: ->
    payload =
      members: []
    payload.name = @entityData.team_name
    payload.id = @entityData.team_id
    payload.members.push {user_id: @entityData.user_id, role_id: @formData.role_id, is_active: true}
    @updating_role = true
    @Restangular.one('firms', @currentFirmId).one('teams', payload.id).customPUT(payload).then ((response) =>
      @toaster.pop 'success', '', "Role updated successfully", 2000
      @updating_role = false
      @$uibModalInstance.close 'success'
    ), ((error) =>
      @updating_role = false
    )

  cancelNameEdit: ->
    @editingName = false


  closeTeamModal: =>
    @$uibModalInstance.close 'refresh'

  saveTeam: =>
    payload = {}
    payload.members = []
    payload.name = @formData.team_name
    @saving_team = true
    if @teamCreated
      payload.id = @createdTeam.id
      @Restangular.one('firms',@currentFirmId).one('teams', payload.id).customPUT(payload).then ((response) =>
        @toaster.pop 'success', '', "Team updated successfully"
        @createdTeam = response
        @saving_team = false
        @editingName = false
      ), ((error) =>
        @saving_team = false
      )
    else
      @Restangular.one('firms', @currentFirmId).all('teams').post(payload).then ((response) =>
        @toaster.pop 'success', '', "Team created successfully"
        @createdTeam = response
        @saving_team = false
        @teamCreated = true
        @editingName = false
        @initResources()
      ), ((error) =>
        @saving_team = false
      )


  editTeamName: =>
    @editingName = true

  getPermissionsApiPayload: ->
    obj = {}
    obj.assigned_to_entity_type = 'Team'
    obj.entity_type = @permissions.entity_type
    obj.entity_ids = _(@permissions.resource_list_ids).pluck('id')
    if @permissions.entity_type == "my_firm"
      obj.entity_ids = []
      obj.entity_ids.push @currentFirmId
      obj.entity_type = 'Firm'
    obj.assigned_to_entity_ids = [@createdTeam.id]

    if @permissions.private_access
      obj.access_level = @permissions.private_access.name
    obj

  validateResourceList: =>
    if @permissions.resource_list_ids.length <= 0
      @toaster.pop 'error','','Please select resources'
      return false
    return true

  getTeamResources: =>
    @$http.get(@baseUrl + '/firms/'+@currentFirmId+'/teams/'+@createdTeam.id+'/ResourcePermissions').then (response) =>
      @resources = response.data

  revokeAccessModal: (entity, index) ->
    @SweetAlert.confirm({
      title: 'Are you sure you want to revoke access ?'
      confirmButtonText: 'Yes, Please!'
      showLoaderOnConfirm: true
      preConfirm: =>
        @revokeAccess(entity, index)
    })


  revokeAccess: (entity,index) =>
    @Restangular.one('firms', @currentFirmId).one('ResourcePermissions', entity.id).remove().then(=>
      @resources.splice index,1
      @toaster.pop 'success', '', 'Access Revoked'
      swal.close() #stupid angular-sweetalert guy isn't tagging the updated code!
    ,(error)=>
      swal.close() #stupid angular-sweetalert guy isn't tagging the updated code!
    )

  submit: =>
    if @validateResourceList()
      payload = @getPermissionsApiPayload()
      @adding_resources = true
      @$http.post(@baseUrl + '/firms/'+@currentFirmId+'/ResourcePermissions', payload).then ((response) =>
        @adding_resources = false
        response = 'success'
        @toaster.pop 'success', '', "Resources assigned successfully"
        @permissions.resource_list_ids.length = 0
        @getTeamResources()
        # @$uibModalInstance.close response
      ), ((error) =>
        @adding_resources = false
        if error.data and error.data.message
          message = error.data.message
          @toaster.pop 'error', '', message
        avoid_error_logging_statuses = @BaseDataService.getAvoidErrorLoggingStatusList()
        if !(error.status in avoid_error_logging_statuses)
          @Utils.logError('Error while updating permission', error)
      )
