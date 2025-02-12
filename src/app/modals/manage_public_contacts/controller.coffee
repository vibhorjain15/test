class ManagePublicContactController extends ModalController

  @register 'ManagePublicContactController'

  @inject '$uibModalInstance', 'contact', 'toaster', 'Restangular', 'Utils', 'BaseDataService', 'entity_details',
    'entity_type', '$state', '$timeout', '$scope', 'RestangularHeaderService', '$q','keywordConstants', 'ModalFactory', 'existing_contacts', 'USER_ROLES'

  initialize: ->
    # initialize empty params
    @params = {}
    @loading_data = true
    @idsOfExistingMembers = []
    @edit_mode = if @contact then true else false
    @departments = []
    if @existing_contacts
      @idsOfExistingMembers = _(@existing_contacts).pluck 'id'

    @is_primary = false
    @membersObject = {
      "memberNames": []
    }
    @teamSelectorDisplayParams ={
      id: 'id'
      name: 'fullName'
    }
    @params.departments = []
    @current_user = @Utils.getCurrentUser()
    @hasFirmWideRole = @Utils.hasFirmWideRole()
    @current_user = @Utils.getCurrentUser()
    @currentFirmId = @current_user.firmInfo.id

    promises = []
    promises.push @getTeamMembers()
    promises.push @getDepartments()
    @$q.all(promises).then =>
      # set edit or add mode
      @copy_of_team_members = angular.copy @team_members
      if @idsOfExistingMembers.length
        @team_members = _(@copy_of_team_members).filter((member) =>
              @idsOfExistingMembers.indexOf(member.id) == -1
            )
      if (@contact)
        if @contact.is_primary
          @is_primary = true

        for department in @departments
          if @contact.internal_tags.indexOf(department.text) > -1
            @params.departments.push department

      @loading_data = false

  filterDepartments: (query) ->
    return @departments unless query
    regex = new RegExp(query, 'i')
    _(@departments).filter((department) -> regex.test(department.description))

  getDepartments: =>
    @Restangular.all('internalContactTypes').getList().then (response) =>
      @departments = response

  getTeamMembers: () =>
    @Restangular.one('firms', @currentFirmId).all('users').getList().then (response) =>
      @team_members = response.filter (user) =>
        user.firmwide_role_name.toLowerCase() != @USER_ROLES.SECURITYADMIN

  save: =>
    if !@params.departments.length
      @toaster.pop 'error', '', "Please select a user role"
      return
    if !@membersObject.memberNames.length and !@edit_mode
      @toaster.pop 'error', '', "Please select users"
      return
    @saving = true
    params =
      entity_ids: [@entity_details.id]
      entity_type: @entity_type
      user_ids: _(@membersObject.memberNames).pluck 'id'
      is_primary: @is_primary
      internal_tags: _(@params.departments).pluck 'text'
    if @edit_mode
      delete params.user_ids
      params.user_id = @contact.id
      delete params.entity_ids
      params.entity_id = @entity_details.id
      @Restangular.all('entityUserAssignments').customPUT(params).then ((response) =>
        @saving = false
        @close()
      ), (error) =>
        @saving = false
    else
      @Restangular.all('entityUserAssignments/bulk_assignment').post(params).then ((response) =>
        @saving = false
        @close()
      ), (error) =>
        @saving = false
