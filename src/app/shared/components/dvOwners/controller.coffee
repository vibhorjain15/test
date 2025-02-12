class DvOwnersController extends BaseController
  @register 'DvOwnersController'

  @inject 'BaseDataService', '$attrs', '$scope', 'Restangular', 'ModalFactory', 'toaster','MentionsFactory', 'Utils', 'SweetAlert', '$timeout','$q'

  initialize: ->
    @due_date = new Date()
    @already_selected = []
    @current_user = @Utils.getCurrentUser()
    @currentFirmId = @current_user.firmInfo.id
    @BaseDataService.getTeamMembers().then (response) =>
      @team_members = _(response).map (teamMember) =>
        teamMember.fullname = _([teamMember.firstName, teamMember.lastName]).compact().join(' ')
        teamMember
    @loading_data = true
    promises = []
    promises.push @getFunctions()
    promises.push @getCurrentFirmFunctions()
    promises.push @getEntityFunctions(@entity.id) if @entity and @entity.id

    @$q.all(promises).then =>
      @active_functions = _(@active_functions).filter (selected_function) => selected_function.function_id != @primaryOwnersObj.function_id and selected_function.function_id != @secondaryOwnersObj.function_id
      if @entity and @entity.id
        @setFunctionsMapping()
      else
        @addMoreOwners(true)
      @loading_data = false
    ,=>
      @loading_data = false

  getCurrentFirmFunctions: =>
    @Restangular.all('function_assignments').customGET('',{entity_id: @currentFirmId, entity_type: 'Firm'}).then (response) =>
      @active_functions = response.plain()

  getEntityFunctions: (id) =>
    @Restangular.all('function_assignments').customGET('',{entity_id: id, entity_type: @entityType}).then (response) =>
      @assignedFunctions = response.plain()

  setFunctionsMapping: =>
    @params.primary_owners = []
    @params.secondary_owners = []
    @combinedArray = []
    @owners = []
    for assigned_function in @assignedFunctions
      if @primaryOwnersObj.function_id != assigned_function.function_id and @secondaryOwnersObj.function_id != assigned_function.function_id
        ownerObj = {
          functions: angular.copy @active_functions
        }
        ownerObj.selectedFunction = angular.copy assigned_function.function_id
        if assigned_function.assigned_to_function
          ownerObj.autoAssign = true
        else
          ownerObj.selected_function_users = assigned_function.user_assigments
        @owners.push ownerObj
      else
        user_ids = _(assigned_function.user_assigments).pluck "user_id"
        for user in @team_members
          userId = parseInt user.id
          if user_ids.indexOf(userId) > -1
            if @primaryOwnersObj.function_id == assigned_function.function_id
              @params.primary_owners.push user
            if @secondaryOwnersObj.function_id == assigned_function.function_id
              @params.secondary_owners.push user
    if @owners.length and @owners[0].selectedFunction
      @filterFunctionUsers()
    else
      @addMoreOwners(true)

  getFunctions: =>
    @BaseDataService.getFunctions().then (response)=>
      @primaryOwnersObj = _(response).findWhere({function_name: "Primary Owner"})
      @secondaryOwnersObj = _(response).findWhere({function_name: "Secondary Owner"})
      @functions = _(response).filter (selected_function) => selected_function.function_id != @primaryOwnersObj.function_id and selected_function.function_id != @secondaryOwnersObj.function_id
      @functions = _(@functions).sortBy((fn) ->
        fn.function_name
      )

  filterMembers: (query) ->
    return @team_members unless query
    regex = new RegExp(query, 'i')
    _(@team_members).filter((member) -> regex.test(member.fullName))

  filterMembersInFunction: (query, selected_function_id) =>
    ownersObj = _(@owners).findWhere({selectedFunction: selected_function_id})
    if ownersObj
      return ownersObj.functionUsers unless query
      regex = new RegExp(query, 'i')
      _(ownersObj.functionUsers).filter((member) -> regex.test(member.user_name))

  onFunctionChange: (entry)=>
    entry.selected_function_users = []
    entry.functionUsers = []
    @filterFunctionUsers()

  filterFunctionUsers:  =>
    selectedFunctionList = _(@owners).pluck('selectedFunction')
    _(@owners).each (entry)=>
      for fn in entry.functions
        if fn.function_id == entry.selectedFunction or _(selectedFunctionList).indexOf(fn.function_id) == -1
          fn.disabled = false
        else
          fn.disabled = true
      for active_function in @active_functions
        if entry.selectedFunction == active_function.function_id
          entry.functionUsers = active_function.user_assigments

  addMoreOwners: (init) =>
    ownerObj = {
      functionUsers: []
      selected_function_users: []
    }
    selectedFunctionList = _(@owners).pluck('selectedFunction')
    ownerObj.functions = _(@active_functions).map (fn)=>
      newFn = angular.copy fn
      if selectedFunctionList.length > 0 and _(selectedFunctionList).indexOf(newFn.function_id) > -1
        newFn.disabled = true
        @disabledAdd = true
      else
        newFn.disabled = false
        @disabledAdd = false
      newFn
    @owners.push ownerObj
    _(@owners).each (entry, index)=>
      entry.id = index + 1

  removeOwnerList: (entry) =>
    index = _(@owners).findIndex (owner)=>
        owner.id == entry.id
    @owners.splice (index), 1
    selectedFunctionList = _(@owners).pluck('selectedFunction')
    _(@owners).each (entry, index)=>
      entry.id = index + 1
      for fn in entry.functions
        if fn.function_id == entry.selectedFunction or _(selectedFunctionList).indexOf(fn.function_id) == -1
          fn.disabled = false
          @disabledAdd = false
        else
          fn.disabled = true
          @disabledAdd = true
