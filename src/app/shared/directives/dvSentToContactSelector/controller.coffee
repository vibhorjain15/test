class DvSentToContactSelectorController extends BaseController
  @register 'DvSentToContactSelectorController'

  @inject 'FirmDataservice', '$attrs', '$scope', 'Restangular', 'toaster'

  initialize: ->
    @saving_contact = false 
    deregisterer = @$scope.$parent.$watchGroup [@$attrs.diligence,@$attrs.sentToContactsList], (values) =>
      if values[0] && values[1]
        @diligence = values[0]
        @sentToContactsList = values[1]
        @contactLoaded = false
        @getTeamMembers()
        deregisterer()

    @$scope.$parent.$watch @$attrs.sentToContactsList, (newValue) =>
      if newValue && @contactLoaded 
        @sentToContactsList =  newValue
        allMembers = @all_team_members
        @team_members = allMembers.filter (f)=>
          !@sentToContactsList.some (d) => 
            d.user_id == f.id
        @team_members = _(@team_members).each (member) ->
          member.joinedName = member.firstName + " " + member.lastName

    @templateUrl = 'sentToContacts/add-contacts.html'
    @isPopoverOpen = false


    clear_selection_allowed = @$attrs.clearSelectionAllowed

    if clear_selection_allowed?
      @clear_selection_allowed = angular.fromJson(@$attrs.clearSelectionAllowed)
    else
      @clear_selection_allowed = true

  getTeamMembers: =>
    @FirmDataservice.getRelatedContacts(@diligence.tofirm_id, true).then (response) =>
      @all_team_members = response
      allMembers = response
      @contactLoaded = true
      @team_members = allMembers.filter (f)=>
        !@sentToContactsList.some (d) => 
          d.user_id == f.id
      @team_members = _(@team_members).each (member) ->
        member.joinedName = member.firstName + " " + member.lastName

  showMember: (member) ->
    user = _(@selection).findWhere(id: member.id)
    return !user?

  select: (user, trigger=true) =>
    @is_open = false
    @textFilter = ''
    user.is_removed = false

    @triggerOnChange(user) if trigger

  clearSelection: ($event, user) ->
    $event.stopPropagation()
    @is_open = false

    user.is_removed = true
    @triggerOnChange(user)

  formatTooltip: (list) =>
    list_of_names = _(list).map((user) -> user.fullName)
    return list_of_names.join(', ')

  triggerOnChange: (member) ->
    onChange = @$attrs.onChange

    if onChange?
      @$scope.$parent.$eval onChange, {user: member}
      @isPopoverOpen = false

  initiateTagAddition: ->
    @isPopoverOpen = true

  closePopOver: ->
    @isPopoverOpen = false
    
  addNewContactEmail: ->
    return unless @add_new_contact_form.$valid
    @saving_contact = true
    params =
      firmInfo: {id : @diligence.tofirm_id}
      send_invitation: true
      userName: @newContactEmail
    @Restangular.all('contacts?skip_name_validation=true').post(params).then (response) =>
        message = 'Contact added Successfully'
        @toaster.pop 'success', message
        @triggerOnChange(response)
    .finally =>
      @saving_contact = false
      @newContactEmail = ''
      @getTeamMembers()
      