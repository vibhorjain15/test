class DvTeamMemberSelectorController extends BaseController
  @register 'DvTeamMemberSelectorController'

  @inject 'BaseDataService', '$attrs', '$scope','Restangular'

  # This directive is a common directive for team member assignments
  # If you want to include assigned / selected team memvers, please pass @selection attribute
  # If you want to allow this directive to unassign users, set clearSelectionAllowed attribute to true
  # To use this directive, here's an example:
  # <dv-team-member-selector selection="vm.assignedUsers"
  #                          on-change="vm.updateAssignMember(user)"
  #                          clear-selection-allowed="true">
  # </dv-team-member-selector>

  initialize: ->
    clear_selection_allowed = @$attrs.clearSelectionAllowed

    if clear_selection_allowed?
      @clear_selection_allowed = angular.fromJson(@$attrs.clearSelectionAllowed)
    else
      @clear_selection_allowed = true

    @getTeamMembers()

  getFunctions: =>
    @BaseDataService.getFunctions().then (response)=>
      @functions = response

  getTeamMembers: =>
    @BaseDataService.getTeamMembers().then (response) =>
      @team_members = response
      @team_members = _(@team_members).each (member) ->
        member.joinedName = member.firstName + " " + member.lastName

  showMember: (member) ->
    user = _(@selection).findWhere(id: member.id)

    return !user?

  showFunction: (member) ->
    func = _(@functionSelection).findWhere(function_id: member.function_id)

    return !func?

  select: (user, type, trigger=true) =>
    @is_open = false
    @textFilter = ''
    user.is_removed = false

    @triggerOnChange(user, type) if trigger

  clearSelection: ($event, user, type) ->
    $event.stopPropagation()
    @is_open = false

    user.is_removed = true
    @triggerOnChange(user, type)

  formatTooltip: (list, list2) =>
    list_of_names = _(list).map((user) -> user.fullName)
    list_of_functions = _(list2).map((func) -> func.function_name)
    return list_of_names.concat(list_of_functions).join(', ')

  triggerOnChange: (member, type) ->
    onChange = @$attrs.onChange

    if onChange?
      @$scope.$parent.$eval onChange, {user: member, type: type}
