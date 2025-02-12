class MonitorMasterFundsController extends BaseController

  @register 'MonitorMasterFundsController'

  @inject 'MasterFundsResource', 'Restangular', '$http', 'FundDataservice', '$timeout', 'DueDiligenceDataservice', 'ModalFactory', 'Utils', '$state', 'total_entity_records', 'CommonService', 'FILTER_TERNARY_OPERATORS', 'keywordConstants', 'hierarchyConstants','angularEnabled'

  initialize: ->
    @dynamicGridColumns = []
    @loadCustomFields()
    @entity_type = 'Strategy'
    @isFreeInvestor = @Utils.isFreeInvestor()


    @getFiltersModalData()
    @filters_data_loaded = false
    @filterApplied = false
    @global_ternary_operator = @FILTER_TERNARY_OPERATORS.AND
    @global_hierarchy_option = @hierarchyConstants.Strategy

  addFund: ->
    unless @isFreeInvestor
      @ModalFactory.invokeModal 'manage_master_fund'  

  openRow: (row,col)=>
    if !row.internalRow && col.field != "selectionRowHeaderCol"
      @$state.go("app.firms.strategies.profile.monitor",{firmId: row.entity.firm_id, strategyId: row.entity.id})

  clearGrouping: (grid,column)=>
    grid.api.grouping.clearGrouping()

  displayOwnerHeaderName: (grid,row,col) ->
    @CommonService.displayOwnerHeaderName(grid, row, col)

  getFiltersModalData: () =>
    @Restangular.all('service/dvapi_service/search_filters').post(entity_type:@keywordConstants.Strategy.toLowerCase()).then (response) =>
      @search_filters_response = response
      @search_criterias = []
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
        @search_criterias = response.search_criterias
        @global_ternary_operator =  response.global_ternary_operator
        if !_.isEmpty response.searchByFiltersParams
          @filterApplied = true
          @applyFiltersSearch(response.searchByFiltersParams)
        else
          @filterApplied = false
          @searchByFilters()
  
  applyFiltersSearch: (filter_params) =>
    filter_params.include_contacts = false
    filter_params.search_for = @global_hierarchy_option
    resource_params = 
      options: filter_params,
      dynamic_grids_options: @dynamicGridColumns
    @initGridSection = false
    @investments = @MasterFundsResource.$new(resource_params)
    @$timeout (=>
      @initGridSection = true
    ), 

  resetFiltersData: () =>
    @global_ternary_operator = @FILTER_TERNARY_OPERATORS.AND
    @search_criterias = []
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
    params = 
      include_contacts: false,
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
        for filter in @search_filters_response.custom_filters
          if(filter.filter_key == criterion.criteria_obj.filter_key && filter.hasOwnProperty('options'))
            for option in filter.options
              if(option.id == criterion.advance_filter_value)
                value = option.value
        if value != ''
          displayedFilter = "#{criterion.criteria_obj.filter_name} : " + value
        else
          displayedFilter = "#{criterion.criteria_obj.filter_name} : " + criterion.advance_filter_value
    displayedFilter
    
  loadCustomFields: ->
    @Restangular.all('service/dvapi_service/get_custom_fields').post({schema_type : "strategy"}).then (response) =>
      @dynamicGridColumns = response.custom_fields.strategy
      @investments = @MasterFundsResource.$new({
        options:{ include_contacts: false, include_custom_fields: true, include_dates: true,filters: {}, search_for: @global_hierarchy_option },
        dynamic_grids_options: @dynamicGridColumns
      })
      @initGridSection = true

