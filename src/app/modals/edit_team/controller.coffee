class EditTeamController extends ModalController

  @register 'EditTeamController'

  @inject '$uibModalInstance', 'Restangular', 'Utils', '$state', '$q', '$scope', '$http' , 'baseUrl', '$timeout', 'toaster', 'existing_members' , 'team', 'SweetAlert', 'BaseDataService', 'adding_member', '$rootScope','USER_ROLES'

  initialize: ->
    # @is_investor = @Utils.isInvestor()
    @is_admin = @Utils.isAdmin()
    @addedTeamMembers = [{}]
    @teamData = {}
    @newAddedMembers = []
    @current_user = @Utils.getCurrentUser()
    @modifiedMembers = []
    @team_members = []
    @idsOfExistingMembers = []
    @membersObject = {
      "memberNames": []
    }
    @currentFirmId = @current_user.firmInfo.id
    @adding_new_members = false
    @teamSelectorDisplayParams ={
      id: 'id'
      name: 'fullName'
    }
    if @existing_members
      @idsOfExistingMembers = _(@existing_members).pluck 'user_id'

    if @team
      @teamData.team = angular.copy @team

    if @adding_member
      @getRoles()
      @fetchEmployees()

    @dict =
      "originalAssigned": {},
      "unassigned": {},
      "newAssigned":{}

  getTeamsByUserId: (id) =>
    @$http.get(@baseUrl + '/firms/'+@currentFirmId+'/users/'+id+'/TeamMemberships').then (response) =>
      @teams = response.data

  getRoles: =>
    @Restangular.one('firms', @currentFirmId).all('roles').getList(is_firmwide: false).then (response) =>
      @roles = response
      if @adding_member
        @membersObject.role_id =  _(@roles).findWhere({name: 'Viewer'}).id
        @teamData.role_id = _(@roles).findWhere({name: 'Viewer'}).id
        @setRoleText(@teamData.role_id)

  sortMembers: () =>
    @team_members = _(@team_members).sortBy((member) =>
      member.fullName.toLowerCase()
    )

  getApiPayload: (addedMembers) ->
    payload =
      members: []

    payload.id = @team.id
    payload.name = @teamData.team.name
    if addedMembers and addedMembers.memberNames.length
      for eachMember in addedMembers.memberNames
        payload.members.push {user_id: eachMember.id, role_id: addedMembers.role_id, is_active: true}
    payload


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
        @Restangular.one('firms', @currentFirmId).one('teams', payload.id).customPUT(payload).then ((response) =>
          @toaster.pop 'success', '', "Members added successfully", 2000
          @adding_new_members = false
          @$uibModalInstance.close 'success'
          @addedTeamMembers = {}
        ), ((error) =>
          @adding_new_members = false
        )

  fetchEmployees: =>
    firmId = @Utils.getCurrentFirm().id
    @Restangular.one('firms', @currentFirmId).all('users').getList().then (response) =>
      @team_members = _(response).filter (user)=>
        user.firmwide_role_name.toLowerCase() != @USER_ROLES.SECURITYADMIN
      @copy_of_team_members = angular.copy @team_members
      if @idsOfExistingMembers.length
        @team_members = _(@copy_of_team_members).filter((member) =>
              @idsOfExistingMembers.indexOf(member.id) == -1
            )
      @$timeout =>
        @sortMembers()


  setRoleText: (role_id) =>
    role = _(@roles).findWhere({id: role_id})
    if role
      @roleText = role.description

  filterUsers: (query) =>
    return @team_members unless query
    regex = new RegExp(query, 'i')
    _(@team_members).filter((member) -> regex.test(member.fullName))


  confirmTeamDeletion: (user, idx) ->
    title = 'Are you sure you want to remove this team?'
    text = ""
    @SweetAlert.confirm({
      title: title
      confirmButtonText: 'Yes, Please!'
      showLoaderOnConfirm: true
      preConfirm: =>
        @removeExisting(user, idx)
    })

  userAdded: (user) =>
    # remove key from unassigned if exist
    if @dict.unassigned.hasOwnProperty(user.id)
      delete @dict.unassigned[user.id]

    # remove key from new assigned if exist
    if @dict.newAssigned.hasOwnProperty(user.id)
      delete @dict.newAssigned[user.id]

    if !@dict.newAssigned.hasOwnProperty(user.id) and !@dict.unassigned.hasOwnProperty(user.id) and !@dict.originalAssigned.hasOwnProperty(user.id)
      @dict.newAssigned[user.id] = user.id

  removeExisting: (user, idx) =>
    teamCopy = angular.copy @teamData
    payload =
      name: teamCopy.team.name
      id: teamCopy.team.id
      members: []
    payload.members.push {user_id: user.user_id, role_id: user.role_id, is_active: false}
    @Restangular.one('firms', @currentFirmId).one('teams', @team.id).customPUT(payload).then ((response) =>
      @copy_of_existing_members.splice(idx, 1)
      @toaster.pop 'success', '', 'User removed successfully' , 2000
      newUser = _(@copy_of_team_members).findWhere({id: user.user_id})
      if newUser
        @userRemoved(newUser)
      ), ((error) =>
        avoid_error_logging_statuses = @BaseDataService.getAvoidErrorLoggingStatusList()
        @saving_team = false
        if !(error.status in avoid_error_logging_statuses)
          @Utils.logError('Edit team failed', error)
      )

  userRemoved: (user) =>
    if user
      swal.close()
      if @dict.originalAssigned.hasOwnProperty(user.id)
        @dict.unassigned[user.id] = user.id
        return

      if @dict.newAssigned.hasOwnProperty(user.id)
        delete @dict.newAssigned[user.id]


  submit: =>
    @saving_team = true
    payload = angular.copy @teamData
    payload.id = @teamData.team.id
    payload.name =  @teamData.team.name
    payload.members = []
    @Restangular.one('firms', @currentFirmId).one('teams', @team.id).customPUT(payload).then ((response) =>
      @saving_team = false
      @toaster.pop 'success', '', 'Team updated successfully' , 2000
      @$uibModalInstance.close 'success'
    ), ((error) =>
      avoid_error_logging_statuses = @BaseDataService.getAvoidErrorLoggingStatusList()
      @saving_team = false
      if !(error.status in avoid_error_logging_statuses)
        @Utils.logError('Edit team failed', error)
    )

  getTeams: =>
    @Restangular.one('firms', @currentFirmId).all('teams').getList().then (response) =>
      @teams = response
