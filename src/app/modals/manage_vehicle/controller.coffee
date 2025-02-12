class ManageVehicleController extends ModalController
  @register 'ManageVehicleController'

  @inject 'Restangular', 'Utils', 'BaseDataService', 'toaster', '$state', '$timeout', 'SweetAlert', 'vehicle', 'edit_mode', 'RestangularHeaderService', '$filter', 'source','keywordConstants'

  initialize: ->
    @params = {}
    @minDate = new Date()
    @currentFirm = @Utils.getCurrentFirm()
    @current_user = @Utils.getCurrentUser()
    @currentFirmId = @current_user.firmInfo.id
    @is_investor = @Utils.isInvestor()
    @isFreeSubscription = @Utils.isFreeSubscription()
    @edit_disabled = false
    @VehicleIdType = 1217
    @ownerList = []
    @showAddOwners = true
    @Restangular.all('tags').getList(type: 'Status').then (response) =>
      @statuses = response

    @Restangular.all('currency').getList().then (response) =>
      @currency = response

    @BaseDataService.getTeamMembers().then (teamMembers) =>
      @team_members = _(teamMembers).map (teamMember) =>
        teamMember.fullname = _([teamMember.firstName, teamMember.lastName]).compact().join(' ')
        teamMember

    @getFunds()
    @loadCustomFields()
    @getFunctions()

    if @edit_mode
      @vehicle.inception_at = moment(@vehicle.inception_at).toDate() if @vehicle.inception_at
      @params = @vehicle
      @edit_disabled = true if @vehicle.owner_firm_id != @currentFirm.id
    else if not @edit_mode and @vehicle
      @params = @vehicle
    else
      @params =
        owner_user_id: @Utils.getCurrentUser().id
        primary_owners: []
        secondary_owners: []

  filterMembers: (query) ->
    return @team_members unless query
    regex = new RegExp(query, 'i')
    _(@team_members).filter((member) -> regex.test(member.fullName))

  getFunctions: =>
    @BaseDataService.getFunctions().then (response) =>
      @functions = response
      @primaryOwnersObj = _(@functions).findWhere({function_name: "Primary Owner"})
      @secondaryOwnersObj = _(@functions).findWhere({function_name: "Secondary Owner"})
      @functions = _(response).filter (selected_function) => selected_function.function_id != @primaryOwnersObj.function_id and selected_function.function_id != @secondaryOwnersObj.function_id


  generatePageUrl: =>
    #For investor, they have to select a parent firm, so use the selected firm id
    selectedFund = _(@funds).findWhere({id: @params.fund_id})
    if selectedFund
      selectedFirmId = selectedFund.parentFirm.id

    if @edit_mode
      "app/firms/#{selectedFirmId}/funds/#{@params.fund_id}/vehicles/#{@params.id}"
    else
      "app/firms/#{selectedFirmId}/funds/#{@params.fund_id}/vehicles"

  loadCustomFields: ->
    @Restangular.all('service/dvapi_service/get_custom_fields').post({schema_type : "vehicle"}).then (response) =>
      @fields = response.custom_fields.vehicle
      @customFieldsCopy = angular.copy @fields

  getFunds: (id) ->
    # -------------- start ---------------------------
    # This is for future purpose. In case we cant to get funds
    # based on firm id's, as of now we are fethcing all funds
    # and then filter them on ui on firm selection
    params=
      firmid = if id == null or id == undefined then 0 else id
    # -------- ends -------------------------------
    # params=
    #   skip_pagination: true
    @Restangular.all('funds').customGET('', params).then (response) =>
      @funds = response

  addAnotherNewVehicle: ->
    @vehicle_form.$setSubmitted()
    @addAnotherVehicle = true
    @save true

  resetForm: ->
    @ownerList = []
    @showAddOwners = false
    @vehicle_form.$setPristine()
    @vehicle_form.$setUntouched()
    @params = {
      fund_id: @paramsCopy.fund_id
    }
    @addAnotherVehicle = false
    @fields = angular.copy @customFieldsCopy
    @$timeout =>
      $('#parent-fund').trigger('chosen:updated')
      $('#diligencevault-owner').trigger('chosen:updated')
      $('#relationship-status').trigger('chosen:updated')
    @$timeout =>
      @showAddOwners = true


  linkHasValue: (field)=>
    fieldsWithValue = _(field).filter (item)=>
      item.value_url
    fieldsWithValue.length > 0

  fieldHasValue: (field)=>
    fieldsWithValue = _(field).filter (item)=>
      item.value
    fieldsWithValue.length > 0

  postFieldsData:  (vehicleResponse) =>
    params =
      'entity_id': vehicleResponse.id
      'owner_user_id': @current_user.id
      'entity_type': @VehicleIdType
      'schema_type': @keywordConstants.Vehicle.toLowerCase()
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
        @handleSuccess(vehicleResponse)
      ,(error)=>
        @allSaveLoaderStop()
    else
      @handleSuccess(vehicleResponse)

  save: (addAnotherVehicle) ->
    if @vehicle_form.$valid
      selectedFund = _(@funds).findWhere({id: @params.fund_id})
      if selectedFund
        selectedFirmId = selectedFund.parentFirm.id
      pageUrl = @generatePageUrl()
      @paramsCopy = angular.copy(@params)
      @paramsCopy.functions = @BaseDataService.getFunctionParams(@ownerList, @paramsCopy, @primaryOwnersObj.function_id, @secondaryOwnersObj.function_id)
      if @paramsCopy.inception_at
        @paramsCopy.inception_at = @$filter('date')(@paramsCopy.inception_at, 'MM-dd-yyyy')
      @paramsCopy.is_active = true
      if addAnotherVehicle
        @savingAnother = true
      else
        @saving = true
      if @edit_mode
        promise = @Restangular.one('firms', @params.firm_id).one('funds', @params.fund_id).one('vehicles',@params.id).customPUT(@paramsCopy)
        promise
          .then (response) =>
            @savingAnother = false
            @saving = false
            @toaster.pop 'success', '', 'Vehicle successfully updated'
            if addAnotherVehicle
              @resetForm()
              @edit_mode = false
            else
              @close(response)
          , (error) =>
            @savingAnother = false
            @saving = false
      else
        return if @fieldselectionForm and @fieldselectionForm.$invalid
        promise = @RestangularHeaderService.RestangularWithHeader(pageUrl).one('firms', selectedFirmId).one('funds', @params.fund_id).all('vehicles').post(@paramsCopy)
        promise
          .then (response) =>
            if @fieldselectionForm and @fieldselectionForm.$dirty and @fieldselectionForm.$valid
              @postFieldsData(response)
            else
              @handleSuccess(response)
          , (error) =>
            @savingAnother = false
            @saving = false

  handleSuccess: (response)=>
    @savingAnother = false
    @saving = false
    @toaster.pop 'success', '', 'Vehicle successfully added'
    if @addAnotherVehicle
      @resetForm()
    else
      if @source and (@source.text == 'main_menu_new' or @source.text == 'monitor')
        if @isFreeSubscription
          @$state.go("app.firms.funds.vehicles.profile.aum_tr",{firmId: response.firm_id, fundId: response.fund_id, vehicleId: response.id})
        else
          @$state.go("app.firms.funds.vehicles.profile.monitor",{firmId: response.firm_id, fundId: response.fund_id, vehicleId: response.id})
      @close(response)
