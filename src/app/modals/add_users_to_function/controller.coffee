class AddUsersToFunctionController extends ModalController
  @register 'AddUsersToFunctionController'

  @inject '$uibModalInstance', 'toaster', 'Restangular', '$state', '$timeout', 'BaseDataService', 'Utils', 'functionsList', '$q', 'existingFunctions'

  initialize: ->
    @false = true
    @loading = true
    @existingStrategies = []
    @is_investor = @Utils.isInvestor()
    @current_user = @Utils.getCurrentUser()
    @currentFirmId = @current_user.firmInfo.id
    @ownerList = []
    @edit_mode = false
    if @functionsList
      @edit_mode = true

    promises = []
    promises.push @getFunctions()
    promises.push @fetchEmployees()
    # promises.push @getCurrentFirmFunctions()
    @$q.all(promises).then =>
      if @existingFunctions and @existingFunctions.length
        @functions = _(@functions).filter (fn) => @existingFunctions.indexOf(fn.function_id) == -1
      if @functionsList
        @ownerList = []
        for entry in @functionsList
          ownerObj = {}
          ownerObj.functions = angular.copy @functions
          ownerObj.selectedFunction = entry.function_id
          ownerObj.users = []
          if entry.user_assigments and entry.user_assigments.length
            for assigned_user in entry.user_assigments
              for team_member in @team_members
                if assigned_user.user_id == team_member.id
                  ownerObj.users.push team_member
          @ownerList.push ownerObj
      else
        @addMoreOwners()
      @loading = false

  getFunctions: =>
    @BaseDataService.getFunctions().then (response)=>
      @primaryOwnersObj = _(response).findWhere({function_name: "Primary Owner"})
      @secondaryOwnersObj = _(response).findWhere({function_name: "Secondary Owner"})
      @functions = _(response).filter (selected_function) => selected_function.function_id != @primaryOwnersObj.function_id and selected_function.function_id != @secondaryOwnersObj.function_id
      @functions = _(@functions).sortBy((fn) ->
        fn.function_name
      )

  fetchEmployees: =>
    @BaseDataService.getTeamMembers().then (response) =>
      @team_members = _(response).map (teamMember) =>
        teamMember.fullname = _([teamMember.firstName, teamMember.lastName]).compact().join(' ')
        teamMember

  filterMembers: (query) ->
    return @team_members unless query
    regex = new RegExp(query, 'i')
    _(@team_members).filter((member) -> regex.test(member.fullName))

  filterFunctionUsers: =>
    selectedFunctionList = _(@ownerList).pluck('selectedFunction')
    _(@ownerList).each (entry)=>
      for fn in entry.functions
        if fn.function_id == entry.selectedFunction or _(selectedFunctionList).indexOf(fn.function_id) == -1
          fn.disabled = false
        else
          fn.disabled = true

  getCurrentFirmFunctions: =>
    @Restangular.all('function_assignments').customGET('',{entity_id: @currentFirmId, entity_type: 'Firm'}).then (response) =>
      @active_functions = response.plain()

  addMoreOwners: =>
    ownerObj = {
      functionUsers: []
      users: []
    }
    selectedFunctionList = _(@ownerList).pluck('selectedFunction')
    ownerObj.functions = _(@functions).map (fn)=>
      newFn = angular.copy fn
      if selectedFunctionList.length > 0 and _(selectedFunctionList).indexOf(newFn.function_id) > -1
        newFn.disabled = true
        @disabledAdd = true
      else
        newFn.disabled = false
        @disabledAdd = false
      newFn
    @ownerList.push ownerObj
    _(@ownerList).each (entry, index)=>
      entry.id = index + 1

  getButtonText: =>
    text = "Add User Role(s)"
    if @edit_mode
      if @functionsList.length == 1
        text = "Update User Role"
      else
        text = "Update User Roles"
    text

  getModalTitle: =>
    title = "Manage User Role(s)"
    if @edit_mode
      if @functionsList.length == 1
        title = "Manage User Role"
      else
        title = "Manage User Roles"
    title

  onFunctionChange: (entry)=>
    entry.users = []
    entry.functionUsers = []
    @filterFunctionUsers()

  removeOwnerList: (row) =>
    index = _(@ownerList).findIndex (owner)=>
        owner.id == row.id
    @ownerList.splice (index), 1
    selectedFunctionList = _(@ownerList).pluck('selectedFunction')
    _(@ownerList).each (entry, index)=>
      entry.id = index + 1
      for fn in entry.functions
        if fn.function_id == entry.selectedFunction or _(selectedFunctionList).indexOf(fn.function_id) == -1
          fn.disabled = false
          @disabledAdd = false
        else
          fn.disabled = true
          @disabledAdd = true

  save: ->
    if @ownerList.length and !@ownerList[0].users.length
      @toaster.pop 'error','','Please select user(s)';
      return
    if @strategy_form.$valid
      @saving = true
      params = []
      for entry in @ownerList
        innerObj = {}
        innerObj.user_ids = []
        innerObj.function_id = entry.selectedFunction
        if entry.users and entry.users.length
          innerObj.user_ids = _(entry.users).pluck "id"
          params.push innerObj
      @Restangular.all('functions').customPUT(params).then ((response) =>
        @saving = false
        @close()
      ),(error) =>
        @saving = false
