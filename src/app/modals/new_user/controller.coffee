class AddNewUserController extends ModalController

  @register 'AddNewUserController'

  @inject '$uibModalInstance', 'Restangular', 'Utils', '$state', 'fund', 'Utils', 'BaseDataService', 'toaster', '$rootScope', '$timeout', 'existing_user','USER_ROLES' , 'source' , 'userservice', 'angularEnabled'

  initialize: ->
    @is_investor = @Utils.isInvestor()
    @is_manager = @Utils.isManager()
    @formData = {}
    @isSpecialUser = true
    @restrictedExist = false
    @firm_has_super_admin = false
    @current_user = @Utils.getCurrentUser()
    @currentFirmId = @current_user.firmInfo.id
    @permissions_enabled = @current_user.firmInfo.hasPermissionEnabled
    @new_user = {}
    @functions = []
    @user_type = 'Standard'
    @showBody = true
    @defaultAccessLabel = 'Read-write'
    @getRoles()
    @getTeams()
    @getTeamRoles()
    @getFunctions()
    @selectedTeams = []
    if @existing_user
      @edit_mode  = true
      @getCurrentUser()
    if !@edit_mode and @is_manager
      @new_user.is_public = true
    @superViewerID = 4
    if @fund
      @new_user.fundId = @fund.id

    @firm_name = @Utils.getCurrentFirm().name

  setUserType: (type) =>
    @user_type = type

  getCurrentUser: =>
    @Restangular.one('users', @existing_user.id).get().then (response) =>
      @selectedUser = response
      @new_user.firstName = @selectedUser.firstname
      @new_user.lastName = @selectedUser.lastname
      @new_user.userName = @selectedUser.userName
      @new_user.functions = @selectedUser.functions
      @new_user.is_public = @selectedUser.is_public
      @new_user.is_key_person = @selectedUser.is_key_person

  getTeams: =>
    @Restangular.one('firms', @currentFirmId).all('teams').getList().then (response) =>
      @teams = response

  getTeamRoles: =>
    @Restangular.one('firms', @currentFirmId).all('roles').getList(is_firmwide: false).then (response) =>
      @accessList = response

  getRoles: =>
    @Restangular.one('firms', @currentFirmId).all('roles').getList(is_firmwide: true).then (response) =>
      @roles = response
      @copyOfRoles = angular.copy @roles
      for role in @roles
        if role.name.toLowerCase() == @USER_ROLES.RESTRICTED
          @restrictedExist = true
          break
      if @restrictedExist
        @isSpecialUser = false
      else
        @new_user.firmwide_role = _(@roles).find((role)=>
          role.name.toLowerCase() == @USER_ROLES.READONLY
        ).id
        @setRoleText(@new_user.firmwide_role)

  getFunctions: =>
    @BaseDataService.getFunctions().then (response)=>
      @primaryOwnersObj = _(response).findWhere({function_name: "Primary Owner"})
      @secondaryOwnersObj = _(response).findWhere({function_name: "Secondary Owner"})
      @functions = _(response).filter (selected_function) => selected_function.function_id != @primaryOwnersObj.function_id and selected_function.function_id != @secondaryOwnersObj.function_id

  filterFunctions: (query) ->
    return @functions unless query
    regex = new RegExp(query, 'i')
    _(@functions).filter((fn) -> regex.test(fn.function_name))

  specialRolesClicked: (role) =>
    if role
      @roles = @copyOfRoles.filter (role) => role.name.toLowerCase() != @USER_ROLES.RESTRICTED
      @new_user.firmwide_role =  _(@roles).find((role)=>
        role.name.toLowerCase() == @USER_ROLES.READONLY
      ).id
      @setRoleText(@new_user.firmwide_role)
    else
      @roles = angular.copy @copyOfRoles

  setRoleText: (role_id) =>
    role = _(@roles).findWhere({id: role_id})
    if role
      @roleText = role.description

  submit: (addAnother) ->
    @teamselectionForm.$setSubmitted true if @teamselectionForm
    if @new_user_form.$valid
      if addAnother
        @saving_user_add_another = true
      else
        @saving_user = true

      @new_user.type = if @is_investor then 'investor' else 'manager'
      if !@isSpecialUser
        delete @new_user.firmwide_role
      functionsArr = []
      if @new_user.functions and @new_user.functions.length
        for selectedFunction in @new_user.functions
          functionsArr.push {function_id: selectedFunction.function_id}
      if @edit_mode
        params = @selectedUser
        params.firstName = @new_user.firstName
        params.lastName = @new_user.lastName
        params.is_key_person = @new_user.is_key_person
        params.is_public = @new_user.is_public
        params.functions = functionsArr
        request = @Restangular.one('users', @existing_user.id).customPUT(params)
      else
        params = angular.copy @new_user
        params.teamMemberships = []
        return if @teamselectionForm and @teamselectionForm.$invalid
        _(@selectedTeams).each (team)=>
          if team.team and team.access
            params.teamMemberships.push {
              team_id: team.team
              role_id: team.access
            }
        params.functions = functionsArr
        request = @Restangular.all('users').post(params)

      request.then((response) =>
        if @edit_mode
          @toaster.pop 'success', '', "#{@new_user.firstName + " " + @new_user.lastName} has been updated successfully", 3000
        else
          @toaster.pop 'success', '', "#{@new_user.firstName + " " + @new_user.lastName} has been added to team", 3000
        if addAnother
          @resetForm()
          # @new_user.accessLevel = @defaultAccessId
          @$rootScope.$emit 'teamMember:newAdded', response
        else
          # unless @fund
            # if !@edit_mode
              # console.log "inside unless"
              # @$state.go 'app.firm.settings.employees'
          if @source and !@edit_mode and !@fund
            @$uibModalInstance.close(response)
            @close()
            @userservice.saveUserId(response.id)
            @$state.go 'app.firm.settings.employees', {} , {reload: true}
          else
            @$uibModalInstance.close response
      , (error) =>
        avoid_error_logging_statuses = @BaseDataService.getAvoidErrorLoggingStatusList()
        if !(error.status in avoid_error_logging_statuses)
          delete error.config.data.userName
          @Utils.logError('Adding new user failed', error)
      )
      .finally(=>
        @saving_user_add_another = false
        @saving_user = false
      )

  cancel: (-> @$uibModalInstance.dismiss 'cancel')

  invite_and_add_another: ->
    @new_user_form.$setSubmitted()
    @submit true

  resetForm: ->
    @new_user = {}
    if @restrictedExist
      @isSpecialUser = false
    @new_user.is_public = @selectedUser.is_public
    @new_user.is_key_person = @selectedUser.is_key_person
    @new_user_form.$setPristine()
    @new_user_form.$setUntouched()
    @showBody = false
    @$timeout =>
      @showBody = true
