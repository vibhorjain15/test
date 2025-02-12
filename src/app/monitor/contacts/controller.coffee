class MonitorContactsController extends BaseController

  @register 'MonitorContactsController'

  @inject 'ContactsResource', 'Restangular', '$http', '$scope', 'FundDataservice', '$timeout', 'DueDiligenceDataservice', 'ModalFactory', 'Utils', '$state','ContactSearchService', '$rootScope','CommonService', 'BaseDataService', 'FILTER_TERNARY_OPERATORS', 'keywordConstants','angularEnabled','platformLabels'

  initialize: ->
    @isInvestor = @Utils.isInvestor()
    @contactLabel = if @isInvestor then @platformLabels.MANAGER else @platformLabels.INVESTOR
    @isFreeSubscription = @Utils.isFreeSubscription()
    @isFreeManager = @Utils.isFreeManager()
    @dynamicGridColumns = []
    @loadCustomFields()

    @getFiltersModalData()
    @filters_data_loaded = false
    @filterApplied = false
    @global_ternary_operator = @FILTER_TERNARY_OPERATORS.AND


    @$rootScope.$on 'grid:loaded', (event, args) =>
      if args?.data.route == 'contacts'
        if @initializeSearchDetails
          @initializeSearchDetails = false

          if !@contactSearch
            options =
              contacts: @contacts.data
              contactTypes: @getTagsList()
              countries: @getCountryList()
            @contactSearch = @ContactSearchService.$new(options)
            # When query search is made, then we need to update the contacts present in ContactSearch service
          else
            @contactSearch.setContacts(@contacts.data)

          @performFilteringAndUpdateGrid()

  addContact: ->
    if !@isFreeSubscription
      @ModalFactory.invokeModal 'manage_contact'

  generatePageUrl: (entity)=>
    pageUrl = ""
    if entity.associated_funds.length == 0
      pageUrl = "app/firms/#{entity.firmId}/contacts/#{entity.id}"
    else if entity.associated_funds.length >= 0
      _(entity.associated_funds).each (fund,index)=>
        pageUrl += "app/firms/#{entity.firmId}/funds/#{fund}/contacts/#{entity.id}"
        pageUrl += "," if index != entity.associated_funds.length - 1
    pageUrl

  openRow: (row,col)=>
    entity_id = null
    entity_type = null
    pageUrl = @generatePageUrl(row.entity)
    @BaseDataService.setContactPageUrl(pageUrl)
    if !row.internalRow && col.field != "selectionRowHeaderCol"
      @$state.go("app.contacts",{Id: row.entity.id})

  clearGrouping: (grid,column)=>
    grid.api.grouping.clearGrouping()

  displayOwnerHeaderName: (grid,row,col) ->
    @CommonService.displayOwnerHeaderName(grid, row, col)

  getFiltersModalData: () =>
    @Restangular.all('service/dvapi_service/search_filters').post(entity_type:@keywordConstants.Contact.toLowerCase()).then (response) =>
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
    resource_params =
      options: filter_params,
      dynamic_grids_options: @dynamicGridColumns
    @$scope.vm.DvGridController.fetchRecords(filter_params)

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
    @Restangular.all('service/dvapi_service/get_custom_fields').post({schema_type : "contact"}).then (response) =>
      @dynamicGridColumns = response.custom_fields.contact
      params = { include_contacts: false, include_custom_fields: true, include_dates: true,filters: {} }
      @contacts = @ContactsResource.$new({
        options: params,
        dynamic_grids_options: @dynamicGridColumns
      })
      @initGridSection = true
