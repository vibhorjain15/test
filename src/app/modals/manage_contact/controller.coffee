class ManageContactController extends ModalController

  @register 'ManageContactController'

  @inject '$uibModalInstance', 'contact', 'toaster', 'Restangular', 'Utils', 'BaseDataService', 'entity_details', 'hierarchyConstants',
    'entity_type', '$state', '$timeout', '$scope', 'RestangularHeaderService', 'source', '$q','keywordConstants', 'ModalFactory','platformLabels'

  initialize: ->
    # initialize empty params
    @isInvestor = @Utils.isInvestor()
    @modalLabel = if @isInvestor then @platformLabels.MANAGER else @platformLabels.INVESTOR
    @global_hierarchy_option = @hierarchyConstants.Strategy
    @params = {}
    @edit_mode = false
    @fundsCopy = []
    @strategiesCopy = []
    @user_check_obj = []
    @is_owner = false
    @current_user = @Utils.getCurrentUser()
    @show_address_details = false
    @hasFirmWideRole = @Utils.hasFirmWideRole()
    @addedContacts = []
    @loading_data = true
    @ContactsIdType = 1218
    @user_exists_in_current_firm = false
    @current_user = @Utils.getCurrentUser()
    @currentFirmId = @current_user.firmInfo.id

    @attributes_to_copy_from_existing_contact = ['conversionDateTime', 'firstName', 'lastName', 'title', 'street_address_1', 'street_address_2', 'city', 'state', 'country_id', 'zipcode']
    @getFunctions()

    if (@contact)
      @edit_mode = true
      if @source and @source == 'Public'
          @edit_mode = false

    promises = []
    promises.push @Restangular.all('country').getList().then (response) =>
      @countries = response

    if @hasFirmWideRole
      promises.push @getFirms()
    else
      promises.push @getFundPermissionsFilter()
    promises.push @getTags()
    promises.push @getFunds()
    promises.push @getAllStrategies()
    promises.push @getTeamMembers()
    promises.push @loadCustomFields()
    @$q.all(promises).then =>
      # set edit or add mode
      @loading_data = false
      if (@contact)
        @params = JSON.parse(JSON.stringify(@contact))
        @is_owner = @params.is_owner
        if @source and @source == 'Public'
          @edit_mode = false
          contactFirmId = @params.firm_id
          if contactFirmId
            @funds = @fundsCopy.filter (fund) =>  fund.firm_id == contactFirmId
            @disableParentFirm = true
          if (@entity_type.toLowerCase() == @keywordConstants.Strategy.toLowerCase() or @entity_type.toLowerCase() == @keywordConstants.Firm.toLowerCase() or @entity_type.toLowerCase() == @keywordConstants.Product.toLowerCase())
            @params.firmInfo =
              id: contactFirmId
            @params.owner_user_id = @entity_details.owner_user_id
            @params.firstName = @contact.firstName
            @params.lastName = @contact.lastName
            @hideInviteContact = true
            if @entity_type.toLowerCase() == @keywordConstants.Product.toLowerCase()
              @params.associated_funds = []
              associated_funds = _(@funds).findWhere {id: @entity_details.id}
              if associated_funds
                @params.associated_funds.push associated_funds
            else if @entity_type.toLowerCase() == @keywordConstants.Strategy.toLowerCase()
              @params.associated_strategies = []
              associated_strategies = _(@strategies).findWhere {id: @entity_details.id}
              if associated_strategies
                @params.associated_strategies.push associated_strategies
        else
          if @contact.associated_strategies.length > 0
            @setAssociatedStrategies()
          @setAssociatedFunds()
          @funds = @fundsCopy.filter (fund) =>  fund.firm_id == @params.firmInfo.id

      else
        if @entity_type.toLowerCase() == @keywordConstants.Product.toLowerCase()
          @params =
            associated_funds: [@entity_details],
            owner_user_id: @Utils.getCurrentUser().id
            firmInfo:
              id: @entity_details.firm_id
          @funds = @fundsCopy.filter (fund) =>  fund.firm_id == @params.firmInfo.id

        if @entity_type.toLowerCase() == @keywordConstants.Strategy.toLowerCase()
          @params =
            associated_strategies: [@entity_details],
            owner_user_id: @Utils.getCurrentUser().id
            firmInfo:
              id: @entity_details.firm_id
          @funds = @fundsCopy.filter (fund) =>  fund.firm_id == @params.firmInfo.id

        if @entity_type.toLowerCase() == @keywordConstants.Firm.toLowerCase()
          @params =
            firmInfo: {id: @entity_details.id},
            owner_user_id: @Utils.getCurrentUser().id
          @funds = @fundsCopy.filter (fund) => fund.firm_id == @params.firmInfo.id

      if !@disableParentFirm
        @initUserCheckChanges()

  loadCustomFields: ->
    @Restangular.all('service/dvapi_service/get_custom_fields').post({schema_type : "contact"}).then (response) =>
      @fields = response.custom_fields.contact
      @customFieldsCopy = angular.copy @fields

  checkUserExistence: () ->
    @initUserCheckChanges()
    @checking_user_existence = true
    @user_exists_in_current_firm = false
    params =
      email: @params.userName
    if @params.userName
      @Restangular.all('v2/contacts').customGET('', params).then (response) =>
        @user_check_obj = []
        @checking_user_existence = false
        for firm in response
          if firm.firmInfo.is_tracking && firm.firmInfo.id != @currentFirmId
            @user_check_obj.push firm

        if @user_check_obj.length
          @user_exists_in_current_firm = true

  goToFirmCreation: (firm) =>
    @ModalFactory.invokeModal 'manage_firm',
      resolve:
        source: => 'NewContact'
        firm_name: => firm.firmInfo
      success: (contact) =>
        @getFundPermissionsFilter()
        @checkUserExistence()

  getFunctions: =>
    @BaseDataService.getFunctions().then (response)=>
      @functions = response

  populateNewContact: =>
    @checking_user_existence = false
    @user_exists_in_current_firm = false
    @user_check_obj = []

  cancel: () ->
    if @edit_mode
      @close @contact
    else
      @close @addedContacts

  prePopulateFirmForm: (firm) ->
    @params = angular.copy firm
    @checking_user_existence = false
    @user_exists_in_current_firm = false
    @user_check_obj = []

  getFundPermissionsFilter: =>
    @Restangular.all('firms/fund_permissions_filters').customGET().then (response) =>
      @firms = response

  setAssociatedFunds: =>
    if (@funds and @funds.length) and (@contact.associated_funds and @contact.associated_funds.length)
      associatedFundsWithObjects = []
      _(@contact.associated_funds).each (id) =>
        fundObject = _(@funds).findWhere {id: id}
        if fundObject
          associatedFundsWithObjects.push fundObject
      @params.associated_funds = associatedFundsWithObjects

  setAssociatedStrategies: =>
    if (@strategies and @strategies.length) and (@contact.associated_strategies and @contact.associated_strategies.length)
      associatedstrategiesWithObjects = []
      _(@contact.associated_strategies).each (id) =>
        strategyObject = _(@strategies).findWhere {id: id}
        if strategyObject
          associatedstrategiesWithObjects.push strategyObject
      @params.associated_strategies = associatedstrategiesWithObjects

  initUserCheckChanges: =>
    @user_exists_in_current_firm = false
    @user_exists_in_dv = false
    @user_check_obj = []
    if @params
      @params.send_invitation = false
      if !@edit_mode
        _(@attributes_to_copy_from_existing_contact).each (attr, i) =>
          @params[attr] = undefined

  getAllStrategies: () ->
    params =
      include_contacts: false,
      include_custom_fields: false,
      include_dates: true,
      is_active: true,
      filters: {}
      search_for: @global_hierarchy_option
    @Restangular.all('service/dvapi_service/product_search').post(params).then (response) =>
        @strategies = angular.copy response.data
        if @strategies.length
          @strategiesCopy = JSON.parse(JSON.stringify(@strategies))

  getFirms: () =>
    params=
      skip_pagination: true
    # get firms, initialy we are calling for 500 records
    @Restangular.all('firms/monitor').customGET('', params).then (response) =>
      @firms = response

  getFunds: (id) ->
    # -------------- start ---------------------------
    # This is for future purpose. In case we cant to get funds
    # based on firm id's, as of now we are fethcing all funds
    # and then filter them on ui on firm selection
    # params=
    #   firmid = if id == null or id == undefined then 0 else id
    # -------- ends -------------------------------
    # params=
    #   skip_pagination: true
    params =
        include_contacts: false,
        include_custom_fields: false,
        include_dates: false,
        is_active: true,
        filters: {}
    @Restangular.all('service/dvapi_service/fund_search').post(params).then (response) =>
      @funds = response.data
      if @funds.length
        @fundsCopy = JSON.parse(JSON.stringify(@funds))


  filterAssociatedFunds: (parent_firm) ->
    if @fundsCopy.length
      @params.associated_funds = []
      @funds = @fundsCopy.filter (fund) ->  fund.firm_id ==  parent_firm
    if @strategiesCopy.length
      @params.associated_strategies = []
      @strategies = @strategiesCopy.filter (strategy) ->  strategy.firm_id ==  parent_firm

  getTeamMembers: () =>
    @BaseDataService.getTeamMembers().then (teamMembers) =>
      @teamMembers = _(teamMembers).map (teamMember) =>
        teamMember.fullname = _([teamMember.firstName, teamMember.lastName]).compact().join(' ')
        teamMember

  getTags: () =>
    params=
      Type: 'Contact'
    @Restangular.all('tags').customGET('', params).then (response) =>
      @tags = response

  filterTags: (query) ->
    return @tags unless query
    regex = new RegExp(query, 'i')
    _(@tags).filter((tag) -> regex.test(tag.name))

  filterProducts: (query) ->
    return @funds unless query
    regex = new RegExp(query, 'i')
    _(@funds).filter((fund) -> regex.test(fund.display_name))

  filterStrategies: (query) ->
    return @strategies unless query
    regex = new RegExp(query, 'i')
    _(@strategies).filter((strategy) -> regex.test(strategy.display_name))

  generatePageUrl:(firmId,fundId)=>
    if fundId
      return "app/firms/#{firmId}/funds/#{fundId}/contacts"
    else
      return "app/firms/#{firmId}/contacts"

  linkHasValue: (field)=>
    fieldsWithValue = _(field).filter (item)=>
      item.value_url
    fieldsWithValue.length > 0

  fieldHasValue: (field)=>
    fieldsWithValue = _(field).filter (item)=>
      item.value
    fieldsWithValue.length > 0

  postFieldsData:  (contactResponse) =>
    params =
      'entity_id': contactResponse.id
      'owner_user_id': @current_user.id
      'entity_type': @ContactsIdType
      'schema_type': @keywordConstants.Contact.toLowerCase()
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
        @handleSuccess(contactResponse)
      ,(error)=>
        @allSaveLoaderStop()
    else
      @handleSuccess(contactResponse)


  save: (saveAnother) ->
    if @contact_form.$valid
      if saveAnother
        @savingAnother = true
      else
        @saving = true
      copyOfParams = JSON.parse(JSON.stringify(@params))
      copyOfParams.contact_type_ids = _(@params.contact_types).pluck('id')
      copyOfParams.associated_funds = _(@params.associated_funds).pluck('id')
      copyOfParams.associated_strategies = _(@params.associated_strategies).pluck('id')

      #code to generate page url to be sent in the header
      if copyOfParams.associated_funds.length > 0
        pageUrl = ""
        _(copyOfParams.associated_funds).each (fund,index)=>
          pageUrl += @generatePageUrl(copyOfParams.firmInfo.id, fund)
          pageUrl += "," if index != copyOfParams.associated_funds.length - 1
      else if copyOfParams.associated_strategies.length > 0
        pageUrl = ""
        _(copyOfParams.associated_strategies).each (fund,index)=>
          pageUrl += @generatePageUrl(copyOfParams.firmInfo.id, fund)
          pageUrl += "," if index != copyOfParams.associated_strategies.length - 1
      else
        pageUrl = @generatePageUrl(copyOfParams.firmInfo.id)
      if @edit_mode
        @RestangularHeaderService.RestangularWithHeader(pageUrl)
          .one('contacts', copyOfParams.id).customPUT(copyOfParams)
          .finally => @allSaveLoaderStop()
          .then (response) =>
            if (parseInt @$state.params.Id) == response.id
              @currentContact = response

            if saveAnother
              @edit_mode = false
              @addedContacts.push response
              @resetForm()
            else
              @toaster.pop 'success', '', 'Contact successfully updated'
              @close(response)
      else
        return if @fieldselectionForm and @fieldselectionForm.$invalid
        delete @params.conversionDateTime
        if @source and @source == "Public"
          copyOfParams = _(@params).pick('firstName','lastName','userName','firmInfo')
          copyOfParams.contact_type_ids = _(@params.contact_types).pluck('id')
          copyOfParams.associated_funds = _(@params.associated_funds).pluck('id')
          copyOfParams.send_invitation = false
        @RestangularHeaderService.RestangularWithHeader(pageUrl)
          .all('contacts').post(copyOfParams)
          .then (response) =>
            @addedContacts.push response
            if @fieldselectionForm and @fieldselectionForm.$dirty and @fieldselectionForm.$valid
              @postFieldsData(response)
            else
              @handleSuccess(response)
          , (error) =>
              @allSaveLoaderStop()

  handleSuccess: (response)=>
    @allSaveLoaderStop()
    if @saveAnother
      @resetForm()
    else
      @close(@addedContacts)
      unless @source and @source == 'InformationRequestFlow'
        @redirectToContactDetail(response.id)

  addAnotherContact: ->
    @contact_form.$setSubmitted()
    @saveAnother = true
    @save true

  allSaveLoaderStop: () ->
    @saving = false
    @savingAnother = false

  resetForm: ->
    @contact_form.$setPristine()
    @contact_form.$setUntouched()
    @params = {}
    @params =
      firmInfo: {id: @entity_id},
      owner_user_id: @Utils.getCurrentUser().id
    @fields = angular.copy @customFieldsCopy
    @show_address_details = false
    @saveAnother = false
    @initUserCheckChanges()
    @$timeout ->
      $('#parent-firm').trigger('chosen:updated')
      $('#parent-fund').trigger('chosen:updated')
      $('#diligencevault-owner').trigger('chosen:updated')
      $('#country').trigger('chosen:updated')

  redirectToContactDetail: (id) ->
    @$state.go 'app.contacts', Id: id

  toggleAddressView: ->
    @show_address_details = !@show_address_details

  redirectToContactTags: ->
    @$state.go 'app.firm.settings.contact_tags'
    @$uibModalInstance.dismiss @currentContact

  goToContactPage: (contact) ->
    @redirectToContactDetail(contact.id)
    @$uibModalInstance.dismiss contact
