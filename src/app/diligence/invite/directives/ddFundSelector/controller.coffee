class DDFundSelectorController extends BaseController

  @register 'DDFundSelectorController'

  @inject '$http', 'baseUrl', 'Restangular', '$attrs', '$scope', '$parse', '$log', 'Utils', 'ModalFactory', 'FILTER_TERNARY_OPERATORS', 'keywordConstants'

  initialize: ->
    attrs = @$attrs
    @is_read_only = @Utils.isReadOnly()
    @entity_type = @Utils.getEntityType()
    @entity_sub_type = @Utils.getEntitySubType()
    @is_investor = @Utils.isInvestor()
    @is_admin = @Utils.isAdmin()

    @getFiltersModalData()
    @filters_data_loaded = false
    @filterApplied = false
    @global_ternary_operator = @$scope.$parent.$eval(attrs.globalTernaryOperator)

    @search_criterias = @$scope.$parent.$eval(attrs.searchCriterias)

    unless attrs.selection?
      @$log.error "Please provide a selection attribute!"
      return

    @selection_list = @$scope.$parent.$eval(attrs.selection)

    unless @selection_list?
      @selection_list = []
      @$parse(attrs.selection).assign(@$scope.$parent, @selection_list)

    if @$scope.$parent.$eval(attrs.selectedStrategies) && @$scope.$parent.$eval(attrs.selectedStrategies).length > 0
      @selectedStrategiesList = @$scope.$parent.$eval(attrs.selectedStrategies)
    else
      @selectedStrategiesList = []

    @filterSelectedList()
    @current_page = 0
    @filters = {
      recordsPerPage : 9999999
      include_contacts: true
    }
    @dropdown = {open: false}
    @funds = []
    @filters_section = {show: false}
    @selected_list_filters_section = {show: false}

    @is_loading_funds = true
    @searchByFilters()

    @watchForSelectAllEntitiesFlag()
    @watchForContactTagSelection()

  filterSelectedList: =>
    return if !@selection_list or @selection_list.length == 0 or !@selectedStrategiesList or @selectedStrategiesList.length == 0

    ids = _(@selectedStrategiesList).pluck('id')

    @selection_list = _(@selection_list).filter (fund) =>
      _(ids).contains(fund.parent_id)
    @$parse(@$attrs.selection).assign(@$scope.$parent, @selection_list)

  watchForSelectAllEntitiesFlag: ->
    if @$attrs.selectAllEntities?
      @select_all_entities = @$scope.$parent.$eval(@$attrs.selectAllEntities)

      @$scope.$watch 'vm.select_all_entities', (value) =>
        if value?
          @$parse(@$attrs.selectAllEntities).assign(@$scope.$parent, value)

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


  addToSelection: (fund) ->
    ids = _(@selection_list).pluck('id')
    if !fund.hasOwnProperty('notification_contacts')
      fund['notification_contacts'] = []
    _(fund.notification_contacts).forEach (contact) =>
      contact.is_removed = false
    unless _(ids).contains(fund.id)
      fund.is_selected = true
      @selection_list.push(fund)

  removeFromSelection: (fund) ->
    @handleDeselection([fund])
    @selection_list.splice(@selection_list.indexOf(fund), 1)

  deleteAllBouncedEmails: ->
    _(@selection_list).each (entity) =>
      _(entity.notification_contacts).each (contact) =>
        if contact.has_bounce_history && !contact.is_removed
          contact.is_removed = true

  checkIfAnyBouncedEmail: ->
    bouncedEmailsList = []
    _(@selection_list).each (entity) =>
      _(entity.notification_contacts).each (contact) =>
        if contact.has_bounce_history && !contact.is_removed
          bouncedEmailsList.push contact
    if bouncedEmailsList.length > 0
      return true
    else
      return false

  clearSelection: ->
    @handleDeselection(@selection_list)
    @selection_list.length = 0
    @disable_select_all = false

  handleDeselection: (funds) ->
    _(funds).each (fund) =>
      fund_from_main_list = _(@funds).findWhere(id: fund.id)

      fund_from_main_list.is_selected = false if fund_from_main_list?

    @select_all_entities = false
    @display_selection_warning = false

  selectAll: ->
    _(@funds).each (fund) =>
      @addToSelection(fund)

    @select_all_entities = false
    @display_selection_warning = true
    @disable_select_all = true

  getFilters: ->
    _(@filters).each (val, key) =>
      delete @filters[key] unless val

    angular.extend({}, @filters, {pageNumber: @current_page})

  loadFilterOptions: =>
    if !@strategies
      @Restangular.all('strategies/tagged').getList().then (response) =>
        @strategies = response
    if !@tags
      @Restangular.all('tags').getList(in_use: true).then (response) =>
        @tags = response
    if !@statusTags
      @Restangular.all('tags').getList(type: 'Status').then (response) =>
        @statusTags = response

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

  applyFilters: ->
    @searchByFilters()

  markFundSelection: (funds) ->
    ids = _(@selection_list).pluck('id')

    _(funds).filter (fund) ->
      fund.is_selected = _(ids).contains(fund.id)

  openNewFundDialog: ->
    @ModalFactory.invokeModal 'manage_fund',
      resolve:
        strategies: ->
        fund: ->
        source: -> 'InformationRequestFlow'

      success: (multipleFunds) =>
        _(multipleFunds).forEach (fund) =>
          @funds.push fund
          @addToSelection(fund)

  getRecipientsCount: (fund) ->
    selected_contacts = 0
    _(fund.notification_contacts).each (contact) =>
      if !contact.is_removed
        selected_contacts += 1
    selected_contacts

  setContactRemovalState: (fund, contact, state) =>
    contact.is_removed = state
    fund.total_recipients_count = @getRecipientsCount(fund)

  addNewContact:(fund)=>
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

              fundIndex = _(@funds).findIndex (fundItem)=>
                fundItem.id == association
              @funds[fundIndex].notification_contacts.push notifContact if fundIndex > -1

  getFiltersModalData: () =>
    @Restangular.all('service/dvapi_service/search_filters').post(entity_type:@keywordConstants.Product.toLowerCase()).then (response) =>
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
        @$parse(@$attrs.globalTernaryOperator).assign(@$scope.$parent, @global_ternary_operator)
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
    filter_params['fund_like_entities_id'] = []
    if @selectedStrategiesList.length > 0
      for strategy in @selectedStrategiesList
        filter_params.fund_like_entities_id.push(strategy.id)
    else
      filter_params.fund_like_entities_id = []
    @is_loading_funds = true
    @Restangular.all('service/dvapi_service/fund_search').post(filter_params).then (response) =>
      @disable_select_all = false
      @funds = response.data
      @processing_data = false
      @data_length = response.count
      @is_loading_funds = false
      @markFundSelection(@funds)

  resetFiltersData: () =>
    @global_ternary_operator = @FILTER_TERNARY_OPERATORS.AND
    @$parse(@$attrs.globalTernaryOperator).assign(@$scope.$parent, @global_ternary_operator)
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
      is_active: true,
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
