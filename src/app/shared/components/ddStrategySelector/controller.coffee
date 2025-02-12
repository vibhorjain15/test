class ddStrategySelectorController extends BaseController
    @register 'ddStrategySelectorController'

    @inject '$attrs', '$scope', 'Restangular','$timeout', '$injector','Utils','$state','$rootScope','$parse','$log','ModalFactory','keywordConstants','$http', 'FILTER_TERNARY_OPERATORS', 'hierarchyConstants'

    initialize: ->
        @entity_type = 'Strategy'
        @is_admin = @Utils.isAdmin()
        @getFiltersModalData()

        @filters_data_loaded = false
        @filterApplied = false
        @global_hierarchy_option = @hierarchyConstants.Strategy

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

        unless @$attrs.selectedStrategies?
            @$log.error "Please provide a selection attribute!"
            return

        @selection_list = @$scope.$parent.$eval(@$attrs.selectedStrategies)

        unless @selection_list?
            @selection_list = []
            @$parse(@$attrs.selectedStrategies).assign(@$scope.$parent, @selection_list)

    watchForContactTagSelection: ->
      @$scope.$watch 'vm.selected_list_filters_section.contact_id', (value) =>
        if value?
          for item in @selection_list
            if item?
              for fund_contact in item.notification_contacts
                if (fund_contact.tag_ids?) && (value not in fund_contact.tag_ids)
                  fund_contact.is_removed = true
                else
                  fund_contact.is_removed = false
              item.total_recipients_count = @getRecipientsCount(item)
        else
          if @selection_list?
              for item in @selection_list
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

    addToSelection: (strategy) ->
        ids = _(@selection_list).pluck('id')

        unless _(ids).contains(strategy.id)
            strategy.is_selected = true
            @selection_list.push(strategy)

    removeFromSelection: (strategy) ->
        @handleDeselection([strategy])
        @selection_list.splice(@selection_list.indexOf(strategy), 1)

    clearSelection: ->
        @handleDeselection(@selection_list)
        @selection_list.length = 0
        @disable_select_all = false

    handleDeselection: (strategies) ->
        _(strategies).each (strategy) =>
            strategy_from_main_list = _(@strategies).findWhere(id: strategy.id)

            strategy_from_main_list.is_selected = false if strategy_from_main_list?

            @select_all_entities = false
            @display_selection_warning = false

    selectAll: ->
        _(@strategies).each (strategy) =>
            @addToSelection(strategy)

            @select_all_entities = false
            @display_selection_warning = true
            @disable_select_all = true

    openNewStrategyDialog: =>
        @ModalFactory.invokeModal 'manage_master_fund',
          resolve:
            source: -> 'InformationRequestFlow'
          success: (multipleStrategies) =>
            _(multipleStrategies).forEach (strategy) =>
              @strategies.push strategy
              @addToSelection(strategy)

    markStrategySelection: (strategies) ->
        ids = _(@selection_list).pluck('id')

        _(strategies).filter (strategy) ->
            strategy.is_selected = _(ids).contains(strategy.id)

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

    addNewContact:(strategy)=>
        strategy =
            id: strategy.id
            name: strategy.name
            firm_id: strategy.firm_id
            firm_name: strategy.firm_name
            notification_contacts: strategy.notification_contacts
        @ModalFactory.invokeModal 'manage_contact',
            resolve:
                entity_details : => strategy
                entity_type : => 'strategy'
                source: =>'InformationRequestFlow'
            success: (contacts) =>
              if contacts.length > 0
                _(contacts).each (contact)=>
                  if contact.associated_funds.length > 0
                    _(contact.associated_funds).each (association)=>
                      notifContact =
                          email: contact.userName
                          entity_id: association
                          id: contact.id
                          name: contact.fullName
                          relationship_status_id: contact.relationship_status_id
                          relationship_status_name: contact.relationship_status
                          tag_ids: _(contact.contact_types).pluck('id')
                      strategyIndex = _(@strategies).findIndex (strategyItem)=>
                          strategyItem.fund_id == association
                      @strategies[strategyIndex].notification_contacts.push notifContact if strategyIndex > -1
                  else if contact.associated_strategies.length > 0
                    _(contact.associated_strategies).each (association)=>
                      notifContact =
                          email: contact.userName
                          entity_id: association
                          id: contact.id
                          name: contact.fullName
                          relationship_status_id: contact.relationship_status_id
                          relationship_status_name: contact.relationship_status
                          tag_ids: _(contact.contact_types).pluck('id')
                      strategyIndex = _(@strategies).findIndex (strategyItem)=>
                          strategyItem.id == association
                      @strategies[strategyIndex].notification_contacts.push notifContact if strategyIndex > -1


    getFiltersModalData: () =>
      @Restangular.all('service/dvapi_service/search_filters').post(entity_type:@keywordConstants.Strategy.toLowerCase()).then (response) =>
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
      filter_params.search_for = @global_hierarchy_option
      if filter_params.filters[@global_ternary_operator].length == 0
        filter_params.filters = {}
        filter_params.search_for = @global_hierarchy_option
      @loading_entities = true
      @Restangular.all('service/dvapi_service/product_search').post(filter_params).then (response) =>
        @disable_select_all = false
        @strategies = angular.copy response.data
        @markStrategySelection(@strategies)
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
        include_custom_fields: false,
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
