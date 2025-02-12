class ManageFundController extends ModalController

  @register 'ManageFundController'

  @inject '$uibModalInstance', 'entity_id', 'strategies', 'parent_strategy', 'Utils', 'Restangular', 'fund', 'source', 'BaseDataService', 'toaster', '$state', '$timeout','RestangularHeaderService', 'fund_name','keywordConstants', 'hierarchyConstants'

  initialize: ->
    @global_hierarchy_option = @hierarchyConstants.Strategy
    @ownerList = []
    @showAddOwners = true
    @edit_mode = false
    @primaryOwnersObj = {}
    @secondaryOwnersObj = {}
    @allRecentAddedFunds = []
    @FundIdType = 1219
    @is_manager = @Utils.isManager()
    @is_investor = @Utils.isInvestor()
    @is_vendor = @Utils.isVendorSubscription()
    @entity_type = @Utils.getEntityType()
    @entity_sub_type = @Utils.getEntitySubType()
    @hasFirmWideRole = @Utils.hasFirmWideRole()
    @currentFirm = @Utils.getCurrentFirm()
    @current_user = @Utils.getCurrentUser()
    @currentFirmId = @current_user.firmInfo.id
    @permissions_enabled = @current_user.firmInfo.hasPermissionEnabled
    @selectedTeams = null
    @loadCustomFields()
    @getAllParentStrategies()
    @isUserFirmOwner = false
    @getFunctions()

    if (@fund)
      @params = angular.copy(@fund)
      @edit_mode = true
      @isUserFirmOwner = @Utils.isCurrentUserFirmOwner(@fund.owner_firm_id)
      @params.strategyID = null if @params.strategyID == 0
      if @params.parent_id
        @parent_strategy = @params.parent_id
    else
      @initNewFund()

    @params.fund_type = 'fund'

    @paramsCopy = angular.copy(_(@params).pick('firmInfo', 'owner_user_id', 'contacts'))

    @Restangular.all('tags').getList(type: 'Status').then (response) =>
      @statuses = response

    @Restangular.all('PermissionLevels').customGET().then (response) =>
      @visibilityList = response

    @Restangular.one('firms', @currentFirm.id).all('teams').getList().then (response) =>
      @teams = response

    unless @strategies
      if @is_vendor
        @Restangular.all('vendor_types').getList().then (response) =>
          @strategies = response
      else
        @Restangular.all('strategies').getList().then (response) =>
          @strategies = response
          if @params.strategyID
            if !_(response).find((strategy)=>
              strategy.id == @params.strategyID
            )
              response.push
                id: @params.strategyID
                name: @params.strategyName

    @BaseDataService.getTeamMembers().then (response) =>
      @team_members = _(response).map (teamMember) =>
        teamMember.fullname = _([teamMember.firstName, teamMember.lastName]).compact().join(' ')
        teamMember


    if @hasFirmWideRole
      unless @is_manager
        @getFirms()
    else
      unless @is_manager
        @getFundPermissionsFilter()

  getAllStrategiesListByFirmId: (firm) =>
    @getAllStrategiesData = []
    angular.forEach @parentStrategies, (result) =>
      if result.firm_id == firm.id
        @getAllStrategiesData.push(result)

  parentFirmSelected: (firm) =>
    @getAllStrategiesListByFirmId(firm)

  sortMembers: () =>
    @team_members = _(@team_members).sortBy((member) =>
      member.fullName.toLowerCase()
    )

  getAllParentStrategies: () ->
    params =
        include_contacts: false,
        include_custom_fields: false,
        include_dates: true,
        is_active: true,
        filters: {}
        search_for: @global_hierarchy_option
    @Restangular.all('service/dvapi_service/product_search').post(params).then (response) =>
        @parentStrategies = angular.copy response.data
        @getAllStrategiesData = []
        if @parent_strategy
          @params.parent_id = @parent_strategy
        if @edit_mode
          @parentFirmSelected(@params.parentFirm)
        else
          if @is_manager
            @parentFirmSelected(@Utils.getCurrentFirm())
          else if @params.parentFirm
            @parentFirmSelected(@params.parentFirm)

  getFirms: =>
    params=
      skip_pagination: true
    @Restangular.all('firms/monitor').customGET('', params).then (response) =>
      @firms = response


  getFundPermissionsFilter: =>
    @Restangular.all('firms/fund_permissions_filters').customGET().then (response) =>
      @firms = response

  initNewFund: () =>
    @params =
      owner_user_id: @Utils.getCurrentUser().id
      primary_owners: []
      secondary_owners: []
    @params.contacts = []

    if @entity_id
      @entity_id = parseInt(@entity_id)
      @params.parentFirm = {id: @entity_id}

    if @source and @source == 'InformationRequestFlow'
      @params.name = @fund_name
      @hideAddAnother = true

    @addNewContact() unless @params.contacts.length

  cancel: () ->
    if @source == 'InformationRequestFlow'
      @close @allRecentAddedFunds
    else
      @$uibModalInstance.dismiss @currentProduct

  addNewContact: ->
    @params.contacts.push({})

  removeLastContact: ->
    @params.contacts.pop()

  loadCustomFields: ->
    @Restangular.all('service/dvapi_service/get_custom_fields').post({schema_type : "fund"}).then (response) =>
      @fields = response.custom_fields.fund
      @customFieldsCopy = angular.copy @fields

  generatePageUrl: =>
    #For investor, they have to select a parent firm, so use the selected firm id
    if @params.parentFirm
      if @edit_mode
        "app/firms/#{@params.parentFirm.id}/funds/#{@params.id}"
      else
        "app/firms/#{@params.parentFirm.id}/funds"
    #for manager, they dont have to select a parent firm, so use the logged in users firm id
    else
      if @edit_mode
        "app/firms/#{@currentFirm.id}/funds/#{@params.id}"
      else
        "app/firms/#{@currentFirm.id}/funds"

  getFunctions: =>
    @BaseDataService.getFunctions().then (response)=>
      @primaryOwnersObj = _(response).findWhere({function_name: "Primary Owner"})
      @secondaryOwnersObj = _(response).findWhere({function_name: "Secondary Owner"})
      @functions = _(response).filter (selected_function) => selected_function.function_id != @primaryOwnersObj.function_id and selected_function.function_id != @secondaryOwnersObj.function_id

  linkHasValue: (field)=>
    fieldsWithValue = _(field).filter (item)=>
      item.value_url
    fieldsWithValue.length > 0

  fieldHasValue: (field)=>
    fieldsWithValue = _(field).filter (item)=>
      item.value
    fieldsWithValue.length > 0

  postFieldsData:  (fundResponse) =>
    params =
      'entity_id': fundResponse.id
      'owner_user_id': @current_user.id
      'entity_type': @FundIdType
      'schema_type': @keywordConstants.Product.toLowerCase()
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
        @handleSuccess(fundResponse)
      ,(error)=>
        @allSaveLoaderStop()
    else
      @handleSuccess(fundResponse)

  save: (addAnotherProduct) ->
    @teamselectionForm.$setSubmitted true if @teamselectionForm
    @fieldselectionForm.$setSubmitted true if @fieldselectionForm
    if @fund_form.$valid
      if addAnotherProduct
        @savingAnother = true
      else
        @saving = true

      # By default its passing empty object in array for managers which is bad payload
      if @is_manager
        @params.contacts = []

      params_temp_copy = angular.copy(@params)
      params_temp_copy.functions = @BaseDataService.getFunctionParams(@ownerList, @params, @primaryOwnersObj.function_id, @secondaryOwnersObj.function_id)
      delete params_temp_copy.primary_owners
      delete params_temp_copy.secondary_owners
      if @edit_mode
        pageUrl = @generatePageUrl()
        params_temp_copy = Object.fromEntries(Object.entries(params_temp_copy).filter(([_,value]) => value != null));
        @RestangularHeaderService.RestangularWithHeader(pageUrl).one('funds', params_temp_copy.id).customPUT(params_temp_copy)
          .finally => @allSaveLoaderStop()
          .then (response) =>
            if (parseInt @$state.params.fundId) == response.id
              @currentProduct = response

            if addAnotherProduct
              @resetForm()
              @params.contacts = []
              @addNewContact()
              @edit_mode = false
            else
              @toaster.pop 'success', '', 'Product successfully updated'
              @close(response)
          , (error) =>
            message = if error.data and error.data.length > 0 then error.data else 'Something went wrong. Please try again.'
            if error.status != 403
              @toaster.pop 'error', '', message
            avoid_error_logging_statuses = @BaseDataService.getAvoidErrorLoggingStatusList()
            if !(error.status in avoid_error_logging_statuses)
              delete error.config.data.key
              delete error.config.data.parentFirm.key
              delete error.config.data.parentFirm.api_key
              delete error.config.data.parentFirm.admin_user_email
              @Utils.logError('Updating fund failed', error)

      else
        return if (@teamselectionForm and @teamselectionForm.$invalid) or (@fieldselectionForm and @fieldselectionForm.$invalid)
        pageUrl = @generatePageUrl()
        params_temp_copy.permissions = []
        _(@selectedTeams?.permissions).each (team)=>
          if (@selectedTeams.disableAssignmentDetails && team.access) || (!@selectedTeams.disableAssignmentDetails && team.team and team.access)
            permission = {
              permission_type: @selectedTeams.permissionType
              assigned_to_entity_type: 'Team'
              assigned_to_entity_id: team.team
              access_level: team.access
              entity_type: @keywordConstants.Product
            }
            if @selectedTeams.disableAssignmentDetails
              permission.role_id = team.access;
              permission.access_level = 'All';
              permission.assigned_to_entity_id = null;
              permission.assigned_to_entity_type = null;

            params_temp_copy.permissions.push permission
        params_temp_copy = Object.fromEntries(Object.entries(params_temp_copy).filter(([_,value]) => value != null));
        if _.isFunction(params_temp_copy.save)
          promise = params_temp_copy.save().then((response) => _(params_temp_copy).extend response)
        else
          promise = @RestangularHeaderService.RestangularWithHeader(pageUrl).all('funds').post(params_temp_copy)
        promise
          .then (response) =>
            @allRecentAddedFunds.push(response)
            if @fieldselectionForm and @fieldselectionForm.$dirty and @fieldselectionForm.$valid
              @postFieldsData(response)
            else
              @handleSuccess(response)
          , (error) =>
              @allSaveLoaderStop()
              message = if error.data and error.data.length > 0 then error.data else 'Something went wrong. Please try again.'
              if error.status != 403
                @toaster.pop 'error', '', message
              avoid_error_logging_statuses = @BaseDataService.getAvoidErrorLoggingStatusList()
              if !(error.status in avoid_error_logging_statuses)
                delete error.config.data.key
                delete error.config.data.contacts
                @Utils.logError('Adding fund failed', error)

  handleSuccess: (response)=>
    @allSaveLoaderStop()
    @toaster.pop 'success', '', 'Product successfully added'
    if @anotherProduct
      @resetForm()
    else
      if @source == 'InformationRequestFlow'
        @close(@allRecentAddedFunds)
      else
        @close(response)
        @redirectToProductDetail(response.id, response.parentFirm.id)

  addAnotherProduct: ->
    @fund_form.$setSubmitted()
    @anotherProduct = true
    if @edit_mode
      @anotherProduct = false
    @save true

  allSaveLoaderStop: () ->
    @saving = false
    @savingAnother = false

  resetForm: ->
    @ownerList = []
    @showAddOwners = false
    @fund_form.$setPristine()
    @fund_form.$setUntouched()
    @params = angular.copy(@paramsCopy)
    @params.fund_type = 'fund'
    @fields = angular.copy @customFieldsCopy
    @anotherProduct = false
    @$timeout ->
      $('#strategy-type').trigger('chosen:updated')
      $('#parent-firm').trigger('chosen:updated')
      $('#diligencevault-owner').trigger('chosen:updated')
      $('#relationship-status').trigger('chosen:updated')
    @$timeout =>
      @showAddOwners = true

  redirectToProductDetail: (id, firmId) ->
    if @is_manager
      @$state.go 'app.firms.funds.profile.aum_tr', {firmId: firmId, fundId: id}
    else
      @$state.go 'app.firms.funds.profile.monitor', {firmId: firmId, fundId: id}
