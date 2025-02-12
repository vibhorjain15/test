class ddVehicleSelectorController extends BaseController
    @register 'ddVehicleSelectorController'

    @inject '$attrs', '$scope', 'Restangular','$timeout', '$injector','Utils','$state','$rootScope','$parse','$log','ModalFactory','keywordConstants','$http', 'FILTER_TERNARY_OPERATORS'

    initialize: ->
        @selectedFunds = @getValidFunds(@selectedFunds)
        @entity_type = 'Vehicle'
        @is_admin = @Utils.isAdmin()
        @getFiltersModalData()

        @filters_data_loaded = false
        @filterApplied = false

        @filters = {
          include_contacts: if @standalone then true else false
          include_custom_fields: true
          include_dates: true
          filters: {}
        }
        @filters_section = {show: false}
        @select_all_entities = false
        @selected_list_filters_section = {show: false}
        @searchByFilters()
        @watchForContactTagSelection()

        unless @$attrs.selectedVehicles?
            @$log.error "Please provide a selection attribute!"
            return

        #@selection_list = @$scope.$parent.$eval(@$attrs.selectedVehicles)

        # unless @selection_list?
        #     @selection_list = []
        #     @$parse(@$attrs.selectedVehicles).assign(@$scope.$parent, @selection_list)

        @filterSelectedList()

    watchForContactTagSelection: ->
      @$scope.$watch 'vm.selected_list_filters_section.contact_id', (value) =>
        if value?
          for item in @selectedVehicles
            if item?
              for fund_contact in item.notification_contacts
                if (fund_contact.tag_ids?) && (value not in fund_contact.tag_ids)
                  fund_contact.is_removed = true
                else
                  fund_contact.is_removed = false
              item.total_recipients_count = @getRecipientsCount(item)
        else
          if @selectedVehicles?
              for item in @selectedVehicles
                if item?
                  for fund_contact in item.notification_contacts
                    fund_contact.is_removed = false
                  item.total_recipients_count = @getRecipientsCount(item)

    getValidFunds: (funds) ->
        valid_funds = []
        _(funds).each (fund) =>
            if fund.total_recipients_count > 0
                valid_funds.push(fund)
        valid_funds

    filterSelectedList: =>
      return if !@selectedVehicles or @selectedVehicles.length == 0  or !@selectedFunds or @selectedFunds.length == 0

      selectedFunds = _(@selectedFunds).pluck('id')
      @selectedVehicles = _(@selectedVehicles).filter (vehicle)=>
        _(selectedFunds).indexOf(vehicle.fund_id) > -1

    addToSelection: (vehicle) ->
        ids = _(@selectedVehicles).pluck('id')
        _(vehicle.notification_contacts).forEach (contact) =>
          contact.is_removed = false
        unless _(ids).contains(vehicle.id)
            vehicle.is_selected = true
            @selectedVehicles.push(vehicle)

    removeFromSelection: (vehicle) ->
        @handleDeselection([vehicle])
        @selectedVehicles.splice(@selectedVehicles.indexOf(vehicle), 1)

    deleteAllBouncedEmails: ->
      _(@selectedVehicles).each (entity) =>
        _(entity.notification_contacts).each (contact) =>
          if contact.has_bounce_history && !contact.is_removed
            contact.is_removed = true

    checkIfAnyBouncedEmail: ->
      bouncedEmailsList = []
      _(@selectedVehicles).each (entity) =>
        _(entity.notification_contacts).each (contact) =>
          if contact.has_bounce_history && !contact.is_removed
            bouncedEmailsList.push contact
      if bouncedEmailsList.length > 0
        return true
      else
        return false

    clearSelection: ->
        @handleDeselection(@selectedVehicles)
        @selectedVehicles.length = 0
        @disable_select_all = false

    handleDeselection: (vehicles) ->
        _(vehicles).each (vehicle) =>
            vehicle_from_main_list = _(@vehicles).findWhere(id: vehicle.id)

            vehicle_from_main_list.is_selected = false if vehicle_from_main_list?

            @select_all_entities = false
            @display_selection_warning = false

    selectAll: ->
        _(@vehicles).each (vehicle) =>
            @addToSelection(vehicle)

            @select_all_entities = false
            @display_selection_warning = true
            @disable_select_all = true

    openNewVehicleDialog: =>
        @ModalFactory.invokeModal 'manage_vehicle',
            success: =>
                @searchByFilters()
            dismiss: =>
                @searchByFilters()

    markVehicleSelection: (vehicles) ->
        ids = _(@selectedVehicles).pluck('id')

        _(vehicles).filter (vehicle) ->
            vehicle.is_selected = _(ids).contains(vehicle.id)

    toggleSelectedListFiltersSection: =>
      @selected_list_filters_section.show = !@selected_list_filters_section.show

      if @selected_list_filters_section.show
        @loadSelectedListFilterOptions()

    resetSelectedListFilters: =>
      @selected_list_filters_section = {show: true}

    loadSelectedListFilterOptions: =>
      if !@contact_tags
        params =
          Type: 'Contact'
        @Restangular.all('tags').customGET('', params).then (response) =>
          @contact_tags = response

    getRecipientsCount: (fund) ->
      selected_contacts = 0
      _(fund.notification_contacts).each (contact) =>
        if !contact.is_removed
          selected_contacts += 1
      selected_contacts

    setContactRemovalState: (fund, contact, state) =>
      contact.is_removed = state
      fund.total_recipients_count = @getRecipientsCount(fund)

    addNewContact:(vehicle)=>
        fund =
            id: vehicle.fund_id
            name: vehicle.fund_name
            firm_id: vehicle.firm_id
            firm_name: vehicle.firm_name
            notification_contacts: vehicle.notification_contacts
        @ModalFactory.invokeModal 'manage_contact',
            resolve:
                entity_details : => fund
                entity_type : => 'fund'
                source: =>'InformationRequestFlow'
            success: (contacts) =>
                if contacts.length > 0
                    _(contacts).each (contact)=>
                        _(contact.associated_funds).each (association)=>
                            notifContact =
                                email: contact.userName
                                entity_id: association
                                id: contact.id
                                name: contact.fullName
                                relationship_status_id: contact.relationship_status_id
                                relationship_status_name: contact.relationship_status
                                tag_ids: _(contact.contact_types).pluck('id')

                            vehicleIndex = _(@vehicles).findIndex (vehicleItem)=>
                                vehicleItem.fund_id == association
                            @vehicles[vehicleIndex].notification_contacts.push notifContact if vehicleIndex > -1

    getFiltersModalData: () =>
      @Restangular.all('service/dvapi_service/search_filters').post(entity_type:@keywordConstants.Vehicle.toLowerCase()).then (response) =>
        @search_filters_response = response
        @filters_data_loaded = true
        for filter,index in  @search_filters_response.default_filters
          if filter.hasOwnProperty('endpoint')
            @getDynamicDefaultFilterOptions(filter,index)
        for filter,index in  @search_filters_response.custom_filters
          if filter.hasOwnProperty('endpoint')
            @getDynamicCustomFilterOptions(filter,index)

    getDynamicCustomFilterOptions:(filter,index) =>
      if filter.method.toLowerCase() == 'get'
        requestPromise = @$http.get(filter.endpoint, filter.request_params)
      else if filter.method.toLowerCase() == 'post'
        requestPromise = @$http.post(filter.endpoint, filter.request_params)
      requestPromise.then (response) =>
        if filter.method.toLowerCase() == 'get'
          @search_filters_response.custom_filters[index].options = response.data
        else if filter.method.toLowerCase() == 'post'
          @search_filters_response.custom_filters[index].options = response.data.data
        for option in @search_filters_response.custom_filters[index].options
          @renameUsenameToValue(option,@search_filters_response.custom_filters[index].display_attribute)

    getDynamicDefaultFilterOptions:(filter,index) =>
      @$http.get(filter.endpoint).then (response) =>
        @search_filters_response.default_filters[index].options = response.data
        for option in @search_filters_response.default_filters[index].options
          @renameUsenameToValue(option,@search_filters_response.default_filters[index].display_attribute)

    renameUsenameToValue: (obj,key) =>
      obj['value'] = obj[key];
      delete obj[key];

    toggleFiltersSection: =>
      @ModalFactory.invokeModal 'manage_custom_search',
        resolve:
          custom_filters_data: =>
            global_ternary_operator: @global_ternary_operator
            search_filters_response : @search_filters_response
            search_criterias:@search_criterias
        success: (response) =>
          @disable_select_all = false
          @search_criterias.length = 0
          @search_criterias.push.apply(@search_criterias,response.search_criterias)
          @global_ternary_operator =  response.global_ternary_operator
          if !_.isEmpty response.searchByFiltersParams
            @filterApplied = true
            @applyFiltersSearch(response.searchByFiltersParams)
          else
            @resetFiltersData()

    applyFiltersSearch: (filter_params) =>
      if @filters.name
        nameFilterParams =
            filter_key: 'name',
            filter_name: 'Name',
            type: 'text',
            operations: 'contains',
            filter_value: @filters.name
        filter_params.filters[@global_ternary_operator].push(nameFilterParams)
      filter_params.include_custom_fields = false
      filter_params.is_active = true
      @loading_entities = true
      selectedFunds = _(@selectedFunds).pluck('id')
      @Restangular.all('service/dvapi_service/vehicle_search').post(filter_params).then (response) =>
        if @selectedFunds.length > 0
          @vehicles = _(response.data).filter (vehicle)=>
              _(selectedFunds).indexOf(vehicle.fund_id) > -1
        else
          @vehicles = angular.copy response.data
        @markVehicleSelection(@vehicles)
        @loading_entities = false

    resetFiltersData: () =>
      @global_ternary_operator = @FILTER_TERNARY_OPERATORS.AND
      @search_criterias.length = 0
      @filterApplied = false
      @searchByFilters()

    removeFilterCriterion: (index) =>
      if index<@search_filters_response.default_filters.length
        @search_criterias[index].advance_filter_value = ''
      else
        @search_criterias.splice index, 1
      @searchByFilters()

    searchByFilters: ()=>
      searchByFiltersData = []
      for filter,index in @search_criterias
        if filter
          if(filter.hasOwnProperty('condition') && filter.hasOwnProperty('advance_filter_value') && filter.condition != null && filter.advance_filter_value != null && filter.advance_filter_value != "" && filter.advance_filter_value != undefined)
            searchByFiltersData.push(filter)
      if searchByFiltersData.length == 0
        @filterApplied = false
      else
        @filterApplied = true
      params =
        include_contacts: true,
        include_custom_fields: true,
        include_dates: true,
        filters: "#{@global_ternary_operator}" : []
      for filter in searchByFiltersData
        filter_params =
          filter_key: filter.criteria_obj.filter_key,
          filter_name: filter.criteria_obj.filter_name,
          type: filter.criteria_obj.type,
          operations: filter.condition,
          filter_value: filter.advance_filter_value
        params.filters[@global_ternary_operator].push(filter_params)
      @applyFiltersSearch(params)

    displayFilter: (criterion) =>
      displayedFilter = ''
      value = ''
      if criterion.criteria_obj.type.toLowerCase() == 'date'
        if criterion.condition == 'between'
          startDate = moment(criterion.advance_filter_value.startDate).format("YYYY-MM-DD")
          endDate = moment(criterion.advance_filter_value.endDate).format("YYYY-MM-DD")
          displayedDate = startDate + ' to '+ endDate
        else
          displayedDate = moment(criterion.advance_filter_value).format("YYYY-MM-DD")
        displayedFilter = "#{criterion.criteria_obj.filter_name} : " + displayedDate
      else
        if criterion.criteria_obj.hasOwnProperty('options')
          for option in criterion.criteria_obj.options
            if(option.id == criterion.advance_filter_value)
              value = option.value
        if value != ''
          displayedFilter = "#{criterion.criteria_obj.filter_name} : " + value
        else
          displayedFilter = "#{criterion.criteria_obj.filter_name} : " + criterion.advance_filter_value
      displayedFilter
