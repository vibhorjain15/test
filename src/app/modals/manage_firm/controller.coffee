class ManageFirmController extends ModalController
  @register 'ManageFirmController'

  @inject 'Restangular', 'Utils', 'firm', 'BaseDataService', 'toaster', '$state', '$timeout', 'source', 'SweetAlert', '$q','firm_name','keywordConstants','ModalFactory'

  initialize: ->
    @edit_mode = false
    @existingFirm = ""
    @functionUsers = []
    @usersObj = {}
    @allRecentAddedFirms = []
    @FundIdType = 1219
    @functions = []
    @FirmIdType = 1220
    @ownerList = []
    @showAddOwners = true
    @primaryOwnersObj = {}
    @secondaryOwnersObj = {}
    @VehicleIdType = 1217
    @ContactsIdType = 1218
    @is_investor = @Utils.isInvestor()
    @current_user = @Utils.getCurrentUser()
    @currentFirmId = @current_user.firmInfo.id
    @currentFirmObj = @Utils.getCurrentFirm()
    @added_fields = [{}]
    @all_fields = []
    @fields = []
    @permissions_enabled = @current_user.firmInfo.hasPermissionEnabled
    @allRecentAddedFirms = []
    @showBackButton = false
    @searchFirmText = ''
    @createFirmTooltip = 'Please start by entering domain or name of the firm. If you don\'t find your firm, you can always add a New Firm.'
    @loadingFirms = 0
    @websiteRegex = /((?:https\:\/\/)|(?:http\:\/\/)|(?:www\.))?([a-zA-Z0-9\-\.]+\.[a-zA-Z]{1,3}(?:\??)[a-zA-Z0-9\-\._\?\,\'\/\\\+&%\$#\=~]+)/i
    @websitePrefixRegex = /((?:https\:\/\/)|(?:http\:\/\/)|(?:www\.)){1}([a-zA-Z0-9\-\.]+\.?[a-zA-Z]{1,3}(?:\??)[a-zA-Z0-9\-\._\?\,\'\/\\\+&%\$#\=~]+)/i
    @selectedTeams = null
    @isDifferentDomainPresentAndUsed = false
    @errorMessageList = []
    @loadCustomFields()
    @getFunctions()
    @getCurrentFirmFunctions()
    if (@firm)
      @params = angular.copy(@firm)
      @edit_mode = true
      @disableSpecificFormControls = !@firm.is_owner
    else
      @params =
        owner_user_id: @Utils.getCurrentUser().id
        contacts: []
        primary_owners: []
        secondary_owners: []
      if @is_investor
        @params.firm_type_id = 7
      else
        @params.firm_type_id = 8

      if @source and (@source == 'InformationRequestFlow')
        @params.search = @firm_name
        @hideAddAnother = true
        @getFirmDetails()

      if @source and (@source == 'NewContact')
        @getFirmDetails()
        @hideAddAnother = true
        @$timeout =>
          @prePopulateFirmForm(@firm_name)

      @addNewContact() unless @params.contacts.length
      @disableSpecificFormControls = false

    @showFirmForm = @edit_mode

    @paramsCopy = angular.copy(_(@params).pick('contacts', 'owner_user_id'))

    @Restangular.all('tags').getList(type: 'Status').then (response) =>
      @statuses = response

    @Restangular.all('firm_types').getList().then (response) =>
      @firm_types = response

    @Restangular.all('PermissionLevels').customGET().then (response) =>
      @visibilityList = response

    @Restangular.one('firms', @currentFirmObj.id).all('teams').getList().then (response) =>
      @teams = response

    @BaseDataService.getTeamMembers().then (teamMembers) =>
      @team_members = _(teamMembers).map (teamMember) =>
        teamMember.fullname = _([teamMember.firstName, teamMember.lastName]).compact().join(' ')
        teamMember

  sortMembers: () =>
    @team_members = _(@team_members).sortBy((member) =>
      member.fullName.toLowerCase()
    )

  getCurrentFirmFunctions: =>
    @Restangular.all('function_assignments').customGET('',{entity_id: @currentFirmId, entity_type: 'Firm'}).then (response) =>
      @active_functions = response.plain()

  filterMembers: (query) ->
    return @team_members unless query
    regex = new RegExp(query, 'i')
    _(@team_members).filter((member) -> regex.test(member.fullName))


  cancel: () ->
    if @source == 'InformationRequestFlow'
      @close @allRecentAddedFirms
    else
      @$uibModalInstance.dismiss @currentFirm

  addNewContact: ->
    @params.contacts.push({})

  removeLastContact: ->
    @params.contacts.pop()

  linkHasValue: (field)=>
    fieldsWithValue = _(field).filter (item)=>
      item.value_url
    fieldsWithValue.length > 0

  getFunctions: =>
    @BaseDataService.getFunctions().then (response) =>
      @functions = response
      @primaryOwnersObj = _(@functions).findWhere({function_name: "Primary Owner"})
      @secondaryOwnersObj = _(@functions).findWhere({function_name: "Secondary Owner"})
      @functions = _(response).filter (selected_function) => selected_function.function_id != @primaryOwnersObj.function_id and selected_function.function_id != @secondaryOwnersObj.function_id

  fieldHasValue: (field)=>
    fieldsWithValue = _(field).filter (item)=>
      item.value
    fieldsWithValue.length > 0

  postFieldsData:  (firmResponse) =>
    params =
      'entity_id': firmResponse.id
      'owner_user_id': @current_user.id
      'entity_type': @FirmIdType
      'schema_type': @keywordConstants.Firm.toLowerCase()
      'custom_fields': []
    cFields = angular.copy @fields
    for selectedField in cFields
      switch selectedField.type
        when 'link'
          if @linkHasValue(selectedField.value)
            params.custom_fields.push selectedField
          else
            selectedField.value = []
            params.custom_fields.push selectedField
        when "checkbox"
          if @fieldHasValue(selectedField.value)
            if selectedField.otherOption
              otherOptionIndex = _(selectedField.value).findIndex (item)=>
                item.id == selectedField.otherOption.id
              if otherOptionIndex > -1
                otherOption = angular.copy selectedField.value[otherOptionIndex]
                otherOption.value = selectedField.textExplanation
                selectedField.value[otherOptionIndex] = otherOption
            params.custom_fields.push selectedField
          else
            selectedField.value = []
            params.custom_fields.push selectedField
        when "dropdown"
          if selectedField.value and selectedField.value.id
            field = angular.copy selectedField
            if field.otherOption and field.value.id == field.otherOption.id
              otherOption = angular.copy field.value
              otherOption.value = field.textExplanation
              field.value = otherOption
            field.value = [field.value]
            params.custom_fields.push field
          else
            selectedField.value = []
            params.custom_fields.push selectedField
        when "dynamic"
          delete selectedField.dynamicSource
          if selectedField.has_multiple
            if @fieldHasValue(selectedField.value)
              params.custom_fields.push selectedField
            else
              selectedField.value = []
              params.custom_fields.push selectedField
          else
            if selectedField.value and selectedField.value.id
              field = angular.copy selectedField
              field.value = [field.value]
              params.custom_fields.push field
            else
              selectedField.value = []
              params.custom_fields.push selectedField
        when "numeric", "int"
          if selectedField.value.length > 0
            values = []
            _(selectedField.value).each (field)=>
              if !_(parseFloat(field.value)).isNaN()
                field.value = Number(field.value)
                values.push field
            selectedField.value = values
            params.custom_fields.push selectedField
        else
          if selectedField.value.length > 0
            values = []
            _(selectedField.value).each (field)=>
              if field.value
                values.push field
            selectedField.value = values
            params.custom_fields.push selectedField
    if params.custom_fields.length > 0
      @Restangular.all('service/dvapi_service/post_custom_fields_data').post(params).then (response) =>
        @handleSuccess(firmResponse)
      ,(error)=>
        @allSaveLoaderStop()
    else
      @handleSuccess(firmResponse)

  handleSuccess: (response)=>
    @allSaveLoaderStop()
    @toaster.pop 'success', '', 'Firm successfully added'

    if @addAnotherFirm
      @resetForm()
      @filteredFirmList = []
      @showFirmForm = false
    else
      if @source and @source == 'InformationRequestFlow'
        @close(@allRecentAddedFirms)
      else
        if @source and @source == 'NewContact'
          @close(response)
        else
          @close(response)
          @redirectToFirmDetail(response.id)

  save: (addAnotherFirm) ->
    @addAnotherFirm = addAnotherFirm
    @teamselectionForm.$setSubmitted true if @teamselectionForm
    @fieldselectionForm.$setSubmitted true if @fieldselectionForm
    return unless @firm_form.$valid

    @errorMessageList = []
    if !@checkContactsDomain()
      @errorMessageList.push "One or more contact(s) domain do not match firm\'s."

    if @addAnotherFirm
      @savingAnother = true
    else
      @saving = true
    promises = []
    hasNoNameDomainChanges = @firm?.name == @params.name and @firm?.website == @params.website
    if !(@params.id and (@disableSpecificFormControls or hasNoNameDomainChanges))
      promises.push @Restangular.all('v2/firms').customGET('', {website: @params.website, name: @params.name}).then (response) =>
        if response.length > 0
          @duplicateFirms = []
          _(response).each (firm)=>
            if !(@edit_mode && firm.id == @params.id)
              firm.websiteUrl = if firm.website and firm.website.startsWith('http') then firm.website else 'https://'+firm.website
              @duplicateFirms.push firm
          @errorMessageList.push "#{@Utils.convert_number(@duplicateFirms.length)} possible matching firms found, click <a data-ng-click='vm.openDuplicateFirmsModal()'>here</a> to view." if @duplicateFirms.length > 0

    @$q.all(promises).then (response)=>
      if @errorMessageList.length == 0
        @saveFirmDetails()
      else
        @saving = false
        @savingAnother = false

  openDuplicateFirmsModal: =>
    @ModalFactory.invokeModal 'view_duplicate_firms',
      resolve:
        duplicateFirms: => @duplicateFirms
        source: => 'manage_firm'
      success: (response)=>
        @errorMessageList = []
        @edit_mode = false
        @prePopulateFirmForm(response)

  saveNewFirm: ->
    @teamselectionForm.$setSubmitted true if @teamselectionForm
    @fieldselectionForm.$setSubmitted true if @fieldselectionForm
    return unless @firm_form.$valid

    @saving = true
    @saveFirmDetails()

  addNewField: =>
    @added_fields.push {}

  loadCustomFields: ->
    params = {}
    params.schema_type = "firm"
    @Restangular.all('service/dvapi_service/get_custom_fields').post(params).then (response) =>
      @fields = response.custom_fields.firm
      @customFieldsCopy = angular.copy @fields

  saveFirmDetails: () =>
    params_temp_copy = angular.copy @params
    params_temp_copy.functions = @BaseDataService.getFunctionParams(@ownerList, params_temp_copy, @primaryOwnersObj.function_id, @secondaryOwnersObj.function_id)
    params_temp_copy = _(params_temp_copy).pick 'id', 'name', 'alternate_name', 'website', 'key', 'relationship_status_id', 'firm_type_id', 'owner_user_id', 'contacts', 'functions'
    params_temp_copy.display_duplicate_warning = true if @errorMessageList.length > 0 and @duplicateFirms and @duplicateFirms.length > 0
    params_temp_copy.alternate_name = params_temp_copy.name if !params_temp_copy.alternate_name
#    if 'search' of params_temp_copy
#      delete params_temp_copy.search

    if @edit_mode
      @Restangular
        .one('firms', params_temp_copy.id).customPUT(params_temp_copy)
        .then (response) =>
          if (parseInt @$state.params.firmId) == response.id
            @currentFirm = response
          if @addAnotherFirm
            @showAddOwners = false
            @resetForm()
            @edit_mode = false
            @params.contacts = [{}]
            @showFirmForm = false
            @disableSpecificFormControls = false
            @filteredFirmList = []
          else
            @toaster.pop 'success', '', 'Firm successfully updated'
            @close(response)
          @allSaveLoaderStop()
        ,(error)=>
          @allSaveLoaderStop()
    else
      return if (@teamselectionForm and @teamselectionForm.$invalid) or (@fieldselectionForm and @fieldselectionForm.$invalid)
      params_temp_copy.permissions = []
      _(@selectedTeams?.permissions).each (team)=>
        if (@selectedTeams.disableAssignmentDetails && team.access) || (!@selectedTeams.disableAssignmentDetails && team.team and team.access)
          permission = {
            permission_type: @selectedTeams.permissionType
            assigned_to_entity_type: 'Team'
            assigned_to_entity_id: team.team
            access_level: team.access
            entity_type: @keywordConstants.Firm
          }
          if @selectedTeams.disableAssignmentDetails
            permission.role_id = team.access;
            permission.access_level = 'All';
            permission.assigned_to_entity_id = null;
            permission.assigned_to_entity_type = null;

          params_temp_copy.permissions.push permission
      @Restangular
        .all('firms').post(params_temp_copy)
        .then (response) =>
          @allRecentAddedFirms.push(response)
          if @fieldselectionForm and @fieldselectionForm.$dirty and @fieldselectionForm.$valid
            @postFieldsData(response)
          else
            @handleSuccess(response)
        ,(error)=>
          @allSaveLoaderStop()

  addAnotherNewFirm: ->
    @firm_form.$setSubmitted()
    @save true

  allSaveLoaderStop: () ->
    @saving = false
    @savingAnother = false

  resetForm: =>
    @firm_form.$setPristine();
    @firm_form.$setUntouched();
    @firm = null
    @params = angular.copy @paramsCopy
    @params.primary_owners = []
    @params.secondary_owners = []
    @ownerList = []
    @fields = angular.copy @customFieldsCopy
    @addAnotherFirm = false
    @errorMessageList = []
    @$timeout =>
      @showAddOwners = true
      $('#diligencevault-owner').trigger('chosen:updated')
      $('#relationship-status').trigger('chosen:updated')
      $('#firm-status').trigger('chosen:updated')

  clearSearchInput: (field) =>
    @params.search = null

    if (@params.search == null or @params.search == undefined or @params.search == '')
      @filteredFirmList = []

  getFirmDetails: ->
    if !@params.search
      @createFirmTooltip = 'Please start by entering domain or name of the firm. If you don\'t find your firm, you can always add a New Firm.'
      @filteredFirmList = []
      return

    @loadingFirms++
    @createFirmTooltip = 'Loading Firms ...'
    params = {}
    if @websiteRegex.test(@params.search) or @websitePrefixRegex.test(@params.search)
      params.website = @params.search
    else
      params.name = @params.search
    @Restangular.all('v2/firms').customGET('', params).then((response) =>
      @filteredFirmList = _(response).map (firm)=>
        firm.websiteUrl = if firm.website and firm.website.startsWith('http') then firm.website else 'https://'+firm.website
        firm
      if @filteredFirmList.length
        @createFirmTooltip = 'Create a New Firm'
      else
        @searchFirmText = @params.search
        @showFirmForm = true
        @showBackButton = true
        @params.name = ''
        @params.website = ''
        @params.contacts = [{}]
        @preFillFirmNameOrWebsite()
        @createFirmTooltip = 'No related firms found. Create a New Firm'
    ).finally(=>
      @loadingFirms--
    )

  preFillFirmNameOrWebsite: () =>
    if @websiteRegex.test(@params.search) or @websitePrefixRegex.test(@params.search)
      @params.website = @params.search
    else
      @params.name = @params.search

  checkUserFirmAssociation: (email) =>
    @gettingUserDetails = true
    @Restangular.all('contacts').customGET('', {'email': email}).then (response) =>
      @gettingUserDetails = false
      if !response.id and (response.firmInfo?.id == @params.id)
        @checkContactsDomain(email)
      else
        @toaster.pop 'error', '', 'This contact is associated with another firm, please enter a new email.'

  checkContactsDomain: () ->
    if !@params.website
      return true

    atSymbol = '@'
    firmDomain = @extractDomainFromWebsite(@params.website)

    differentDomain = false

    _(@params.contacts).forEach (contact) ->
      userEmailDomain = contact.username.substring(_(contact.username).lastIndexOf(atSymbol) + 1)
      if (firmDomain.toLowerCase() != userEmailDomain.toLowerCase())
        differentDomain = true
        return

    if differentDomain
      return false        #since the new sweetalert uses promises, returning the promise value will proceed with save instead of waiting for confirmation
    else
      return true

  openDifferentDomainConfirmation: () =>
    @SweetAlert.confirm({
      title: 'One or more contacts domain do not match firm\'s. Are you sure you want to proceed?'
      confirmButtonText: 'Yes, Please Create the Firm'
      focusCancel: true
    }).then (isConfirm) =>
      if isConfirm.value and isConfirm.value == true
        @saveFirmDetails()

  createFirm: () =>
    @searchFirmText = @params.search
    @disableSpecificFormControls = false
    @showFirmForm = true
    @showBackButton = true
    @resetForm()
    if @params.contacts == null or @params.contacts == undefined
      @params.contacts = [{}]
    if @is_investor
      @params.firm_type_id = 7
    else
      @params.firm_type_id = 8

    @params.owner_user_id = @Utils.getCurrentUser().id
    @params.search = @searchFirmText
    @preFillFirmNameOrWebsite()

  prePopulateFirmForm: (firm) =>
    @searchFirmText = @params.search
    @params = angular.copy(firm)
    @params.primary_owners = []
    @params.secondary_owners = []
    @showFirmForm = true
    @showBackButton = true
    @disableSpecificFormControls = true
    if @params.contacts == null
      @params.contacts = [{}]
    @params.owner_user_id = @Utils.getCurrentUser().id

  backToSearch: () =>
    @params.search = @searchFirmText
    @disableSpecificFormControls = false
    @showFirmForm = false
    @errorMessageList = []

  disableCreateFirmButton: () =>
    return !(@firm_form.firm_search?.$valid and @loadingFirms == 0 and @checkSameOldFirm())

  checkSameOldFirm: () =>
    !(_(@filteredFirmList).filter (firm) =>
      if @params.search and @params.search.toLowerCase() == firm.name?.toLowerCase()
        return true

      if @params.search and @params.search.toLowerCase() == firm.website?.toLowerCase()
        return true

      return false).length

  redirectToFirmDetail: (id) ->
    @$state.go 'app.firms.profile.monitor', firmId: id

  extractDomainFromWebsite: (website) =>
    website.toLowerCase().replace('http://','').replace('https://','').replace('www.','').split(/[/?#]/)[0]
