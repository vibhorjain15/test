class ManageMasterFundController extends ModalController

  @register 'ManageMasterFundController'

  @inject '$uibModalInstance', 'entity_id', 'strategies', 'Utils', 'Restangular', 'strategy', 'source', 'BaseDataService', 'toaster', '$state', '$timeout','RestangularHeaderService', 'fund_name','keywordConstants', 'hierarchyConstants'

  initialize: ->
    @edit_mode = false
    @allRecentAddedFunds = []
    @FundIdType = 5004
    @is_manager = @Utils.isManager()
    @is_investor = @Utils.isInvestor()
    @ownerList = []
    @showAddOwners = true
    @is_vendor = @Utils.isVendorSubscription()
    @entity_sub_type = @Utils.getEntitySubType()
    @hasFirmWideRole = @Utils.hasFirmWideRole()
    @currentFirm = @Utils.getCurrentFirm()
    @current_user = @Utils.getCurrentUser()
    @currentFirmId = @current_user.firmInfo.id
    @permissions_enabled = @current_user.firmInfo.hasPermissionEnabled
    @selectedTeams = []

    @getAllProductsList()
    @loadCustomFields()
    @getFunctions()
    @productSearchAPIData = []

    @removedFunds = []

    @isUserFirmOwner = false
    @productSearchAPIDataLoaded = false

    if (@strategy)
      @params = angular.copy(@strategy)
      @edit_mode = true
      @isUserFirmOwner = @Utils.isCurrentUserFirmOwner(@strategy.owner_firm_id)
    else
      @initNewFund()

    @params.fund_type = 'strategy'

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

    @BaseDataService.getTeamMembers().then (teamMembers) =>
      @team_members = _(teamMembers).map (teamMember) =>
        teamMember.fullname = _([teamMember.firstName, teamMember.lastName]).compact().join(' ')
        teamMember

    if @hasFirmWideRole
      unless @is_manager
        @getFirms()
    else
      unless @is_manager
        @getFundPermissionsFilter()

  getFirms: =>
    params=
      skip_pagination: true
    @Restangular.all('firms/monitor').customGET('', params).then (response) =>
      @firms = response

  getFundPermissionsFilter: =>
    @Restangular.all('firms/fund_permissions_filters').customGET().then (response) =>
      @firms = response

  getFunctions: =>
    @BaseDataService.getFunctions().then (response) =>
      @functions = response
      @primaryOwnersObj = _(@functions).findWhere({function_name: "Primary Owner"})
      @secondaryOwnersObj = _(@functions).findWhere({function_name: "Secondary Owner"})
      @functions = _(response).filter (selected_function) => selected_function.function_id != @primaryOwnersObj.function_id and selected_function.function_id != @secondaryOwnersObj.function_id

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
    @Restangular.all('service/dvapi_service/get_custom_fields').post({schema_type : "strategy"}).then (response) =>
      @fields = response.custom_fields.strategy
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
      'schema_type': "strategy"
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
      angular.forEach @removedFunds, (fund)=>
        params_temp_copy.associated_products.push fund
      if @edit_mode
        pageUrl = @generatePageUrl()
        @RestangularHeaderService.RestangularWithHeader(pageUrl).one('/funds', params_temp_copy.id).customPUT(params_temp_copy)
          .finally => @allSaveLoaderStop()
          .then (response) =>
            if (parseInt @$state.params.fundId) == response.id
              @currentProduct = response

            if addAnotherProduct
              @resetForm()
              @addNewContact()
              @edit_mode = false
            else
              @toaster.pop 'success', '', 'Strategy successfully updated'
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
              @Utils.logError('Updating strategy failed', error)

      else
        return if (@teamselectionForm and @teamselectionForm.$invalid) or (@fieldselectionForm and @fieldselectionForm.$invalid)
        pageUrl = @generatePageUrl()
        params_temp_copy.permissions = []
        _(@selectedTeams).each (team)=>
          if team.team and team.access
            params_temp_copy.permissions.push {
              assigned_to_entity_type: 'Team'
              assigned_to_entity_id: team.team
              access_level: team.access
              entity_type: @keywordConstants.Product
            }
        if _.isFunction(params_temp_copy.save)
          promise = params_temp_copy.save().then((response) => _(params_temp_copy).extend response)
        else
          promise = @RestangularHeaderService.RestangularWithHeader(pageUrl).all('/funds').post(params_temp_copy)
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
                @Utils.logError('Adding strategy failed', error)

  handleSuccess: (response)=>
    @allSaveLoaderStop()
    @toaster.pop 'success', '', 'Strategy successfully added'
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
    @params.fund_type = 'strategy'
    @params.contacts = []
    @fields = angular.copy @customFieldsCopy
    @strategy = null
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
      @$state.go 'app.firms.strategies.profile.aum_tr', {firmId: firmId, strategyId: id}
    else
      @$state.go 'app.firms.strategies.profile.monitor', {firmId: firmId, strategyId: id}

  getAllProductsList: () =>
    @Restangular.all('service/dvapi_service/fund_search').post({"include_contacts":false,"include_custom_fields":false,"include_dates":false,"is_active":true,"filters":{}}).then (response) =>
      @productSearchAPIData = response.data
      @getAllProductsListData = []
      @productSearchAPIDataLoaded = true
      if @strategy && @edit_mode
        @parentFirmSelected(@strategy.parentFirm)
      else
        if @is_manager
          @parentFirmSelected(@Utils.getCurrentFirm())

  getAllProductsListByFirmId: (firm) =>
    @getAllProductsListData = []
    @params.associated_products = []
    angular.forEach @productSearchAPIData, (result) =>
      if @strategy
        if result.firm_id == firm.id && (!result.parent_id || result.parent_id == @strategy.id)
          product =
            id : result.id
            type : 'fund'
            description : result.name
            is_active: 1
          @getAllProductsListData.push(product)
      else
        if result.firm_id == firm.id && !result.parent_id
          product =
            id : result.id
            type : 'fund'
            description : result.name
            is_active: 1
          @getAllProductsListData.push(product)
    if @strategy && @strategy.parentFirm.id == firm.id
      angular.forEach @getAllProductsListData, (product)=>
        angular.forEach @strategy.associated_products, (result)=>
          if product.id == result.id
            @params.associated_products.push product

  parentFirmSelected: (firm) =>
    @getAllProductsListByFirmId(firm)

  associatedProductsSelected: ->
    selectedIds = _(@params.associated_products).pluck('id')
    @removedFunds = []
    angular.forEach @params.associated_products, (product)=>
      product.is_active = 1
    if @strategy
      angular.forEach @strategy.associated_products, (result)=>
        unless _(selectedIds).contains(result.id)
          fund =
            id : result.id
            type : 'fund'
            description : result.name
            is_active: 0
          @removedFunds.push fund
