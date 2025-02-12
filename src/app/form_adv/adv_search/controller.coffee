class FormADVSearchController extends BaseController

  @register 'FormADVSearchController'

  @inject 'AdvSearchManager', 'FundDataservice', 'Restangular', '$timeout', '$state', '$scope','Utils','HistoryDataService','$stateParams', 'ModalFactory', 'toaster','$q','CommonService','$rootScope','DocumentsService', 'FILTER_TERNARY_OPERATORS', 'FILTER_TYPES', 'errorMessageMap','angularEnabled'

  initialize: ->
    @is_freeSubscription = @Utils.isFreeSubscription()
    @initGridSection = false
    @global_ternary_operator = @FILTER_TERNARY_OPERATORS.AND
    @showingSearchResults = false
    @defaultParams = {}
    @advanceAdvSearch = false
    @entity_search_text = null
    @entity_search_text_backup = null
    @search_criterias = []
    @search_criterias_backup = []
    @recordsCount = 0
    @totalRecordsCount = 0
    @isSearchPanelCollapsed = true
    @loading_data = true
    @activeViews = {
      FIRM: 'firm'
      FUND: 'fund'
      SERVICE_PROVIDER: 'service_provider'
    }
    @activeView = @activeViews.FIRM
    promises = []

    promises.push @getCriteriaList()

    @initDefaultFiltersSyntex()
    @$q.all(promises).then =>
      @setDefaultView()
      @loading_data = false
    , (error) =>
      @loading_data = false

    @$rootScope.$on 'grid:loaded', (event, args) =>
      @recordsCount = args.data.count
      @totalRecordsCount = args.data.total_count

  initDefaultFiltersSyntex: =>
    @defaultParams = {}
    @defaultParams.filters = {}
    @defaultParams.filters[@global_ternary_operator] = {}

  applyMethod: (startDate,endDate)=>
    @setModelValidity()

  globalOperatorChanged: (operator) =>
    @initDefaultFiltersSyntex()

  setDefaultView: () =>
    @advanceAdvSearch = false
    @initDefaultFiltersSyntex()
    @defaultParams.filters = {}
    @defaultParams.type = @activeView
    @defaultParams.response_type = @activeView
    delete @FormAdvData
    @$timeout =>
      @FormAdvData = @AdvSearchManager.$new(@defaultParams)
      @selectCriteria(@search_criterias[0], 0)

  loadSelectedView: =>
    @defaultParams.type = @activeView
    @defaultParams.response_type = @activeView
    delete @FormAdvData
    @$timeout =>
      @FormAdvData = @AdvSearchManager.$new(@defaultParams)

  setActiveView: (mode) =>
    #dont not allow them to change active view for free users
    return if @is_freeSubscription
    @activeView = mode
    @search_criterias = [{criteria_obj: @criteria_options[@default_search_criteria_index]}]
    @selectCriteria(@search_criterias[0], 0)
    @search_criterias_backup = angular.copy @search_criterias
    @resetFilters()

  getCriteriaList: () =>
    @Restangular.all('service/es_service/filters').post({filters: {}}).then (response) =>
      @criteria_options = response
      @default_search_criteria_index = @getDefaultSearchCriteria()
      @search_criterias = [{criteria_obj: @criteria_options[@default_search_criteria_index]}]
      @search_criterias_backup = angular.copy @search_criterias

  getDefaultSearchCriteria: =>
    #return the index of the default search criteria
    value = "pf_id"
    _(@criteria_options).findIndex (option)=>
      option.filter_name.toLowerCase() == value

  toggleSearchPanel: () ->
    @isSearchPanelCollapsed = not @isSearchPanelCollapsed

    if @isSearchPanelCollapsed
      #filter the search criteria's by removing all the criteria's with invalid or incomplete selections
      @search_criterias = _(@search_criterias).filter (criteria)=>
        if criteria.criteria_obj and criteria.criteria_obj.filter_type.toLowerCase() == @FILTER_TYPES.DATE
          if criteria.condition == 'between' and @checkIfValidDateRangeObject(criteria.advance_filter_value)
            criteria
          else if criteria.condition != 'between' and _(criteria.advance_filter_value).isDate()
            criteria
        else if criteria.criteria_obj and criteria.advance_filter_value
          criteria
    else if !@search_criterias.length
      @search_criterias = [{criteria_obj: @criteria_options[@default_search_criteria_index]}]
      @selectDefault(@search_criterias[0],0)
    @search_criterias_backup = angular.copy @search_criterias

  removeFilterCriterion: (index) =>
    @search_criterias.splice index, 1

    if !@search_criterias.length
      @resetFiltersData()
    else
      @searchByFilters()

  resetFiltersData: () =>
    @advanceAdvSearch = false
    @global_ternary_operator = @FILTER_TERNARY_OPERATORS.AND
    @search_criterias = [{criteria_obj: @criteria_options[@default_search_criteria_index]}]
    @selectDefault(@search_criterias[0],0)
    @search_criterias_backup = angular.copy @search_criterias
    @search_form.$setPristine()
    @search_form.$setUntouched()
    @getPayload()
    delete @FormAdvData
    @$timeout =>
      @defaultParams.type = @activeView
      @defaultParams.response_type = @activeView
      @FormAdvData = @AdvSearchManager.$new(@defaultParams)

  clearFilters: () =>
    @resetFiltersData()
    @toggleSearchPanel()

  displayFilter: (criterion) =>

    displayedFilter = ''
    switch criterion.criteria_obj.filter_type.toLowerCase()
      when @FILTER_TYPES.STRING
        displayedFilter = "#{criterion.criteria_obj.filter_label} : " + criterion.advance_filter_value
      when @FILTER_TYPES.NUMBER
        displayedFilter = "#{criterion.criteria_obj.filter_label} : " + criterion.advance_filter_value
      when @FILTER_TYPES.RANGE
        displayedFilter = "#{criterion.criteria_obj.filter_label} : " + criterion.advance_filter_value
      when @FILTER_TYPES.DATE
        if criterion.condition == 'between'
          startDate = moment(criterion.advance_filter_value.startDate).format("YYYY-MM-DD")
          endDate = moment(criterion.advance_filter_value.endDate).format("YYYY-MM-DD")
          displayedDate = startDate + ' to '+ endDate
        else
          displayedDate = moment(criterion.advance_filter_value).format("YYYY-MM-DD")
        displayedFilter = "#{criterion.criteria_obj.filter_label} : " + displayedDate

    displayedFilter

  showFilters: () =>
    @search_criterias.length > 0 and @search_criterias[0].advance_filter_value? and @isSearchPanelCollapsed

  showCount: =>
    (@advanceAdvSearch or @showingSearchResults) and @isSearchPanelCollapsed and @recordsCount and @totalRecordsCount

  addNewCriteria: =>
    newCriteria = {criteria_obj: @criteria_options[@default_search_criteria_index]}
    @search_criterias.push(newCriteria)
    @selectDefault(newCriteria, @search_criterias.length - 1)
    @search_form.$setPristine()
    @search_form.$setUntouched()


  removeCriteria: () =>
    @search_criterias.splice(@search_criterias.length-1, 1)
    @search_form.$setPristine()
    @search_form.$setUntouched()

  formatSMETooltip: (smeArray) ->
    if smeArray and smeArray.length > 1
      return  _(smeArray).tail().join(', ')

  selectCriteria: (criteria, index) =>
    if criteria.criteria_obj.filter_type.toLowerCase() == @FILTER_TYPES.DATE
      @search_criterias[index].advance_filter_value = ""
    else
      @search_criterias[index].advance_filter_value = null
    @selectDefault(@search_criterias[index], index)

  selectDefault: (criteria, index) =>
    if criteria.criteria_obj.filter_type.toLowerCase() == @FILTER_TYPES.RANGE
      criteria.condition = 'exact'
    else if criteria.criteria_obj.filter_type.toLowerCase() == @FILTER_TYPES.STRING
      criteria.condition = 'phrase'
    else if criteria.criteria_obj.filter_type.toLowerCase() == @FILTER_TYPES.NUMBER || criteria.criteria_obj.filter_type.toLowerCase() == @FILTER_TYPES.DATE
      criteria.condition = 'gt'


  getInnerObject: (criteria)=>
    innerObject = {}
    if criteria.criteria_obj.filter_type.toLowerCase() == @FILTER_TYPES.DATE
      innerObject.filter_type = criteria.criteria_obj.filter_name
      innerObject.search_type = 'range'
      innerObject.range_type = criteria.condition
      if criteria.condition == 'between'
        innerObject.filter_value_min = @Utils.formatDatetime(criteria.advance_filter_value.startDate)
        innerObject.filter_value_max = @Utils.formatDatetime(criteria.advance_filter_value.endDate)
      else
        innerObject.filter_value_min = @Utils.formatDatetime(criteria.advance_filter_value)
    else if criteria.criteria_obj.filter_type.toLowerCase() == @FILTER_TYPES.NUMBER
      innerObject.filter_type = criteria.criteria_obj.filter_name
      innerObject.filter_value_min = criteria.advance_filter_value
      innerObject.search_type = 'range'
      innerObject.range_type = criteria.condition
    else
      innerObject.filter_type = criteria.criteria_obj.filter_name
      innerObject.filter_value = criteria.advance_filter_value
      innerObject.search_type = criteria.condition
    innerObject

  getPayload: () =>
    @defaultParams.filters = {}
    if @search_criterias_backup.length
      for params in @search_criterias_backup
        @generatePayloadParams(@global_ternary_operator, params) if params.advance_filter_value?

    if @entity_search_text_backup
      @defaultParams.filters[@FILTER_TERNARY_OPERATORS.GENERAL] = {
        filter_type: "general"
        filter_value: @entity_search_text_backup
        search_type: "contains"
      }

  generatePayloadParams: (ternary_operator,params)=>
    innerObject = {}
    if @defaultParams.filters[ternary_operator]
      operatorObject = @defaultParams.filters[ternary_operator]
    else
      @defaultParams.filters[ternary_operator] = {}
      operatorObject = @defaultParams.filters[ternary_operator]

    parent_entity = params.criteria_obj.parent
    innerObject = @getInnerObject(params)
    if operatorObject.hasOwnProperty(parent_entity)
      operatorObject[parent_entity].push innerObject
    else
      operatorObject[parent_entity] = []
      operatorObject[parent_entity].push innerObject

  clearSearchText: =>
    @entity_search_text = null
    @entity_search_text_backup = null

  resetFilters: =>
    @entity_search_text = null
    @entity_search_text_backup = null
    @showingSearchResults = false
    @setDefaultView()

  searchByEntity: =>
    if @entity_search_text and @entity_search_text.length > 2
      @showingSearchResults = true
      @entity_search_text_backup = angular.copy @entity_search_text
      @getSearchResults()
    else
      @toaster.pop 'warning', '', 'Please enter a valid text', 2000

  searchByFilters: =>
    @setModelValidity()
    return unless @search_form.$valid
    @search_criterias_backup = angular.copy @search_criterias
    @advanceAdvSearch = true
    @isSearchPanelCollapsed = true
    @getSearchResults()

  getSearchResults: (searchByEntityName) =>
    return if @is_freeSubscription

    @getPayload()
    delete @FormAdvData
    @$timeout =>
      @defaultParams.type = @activeView
      @defaultParams.response_type = @activeView
      @FormAdvData = @AdvSearchManager.$new(@defaultParams)

  setModelValidity: =>
    if @search_form
      _(@search_form.$$controls).forEach (formGroup) =>
        #Validations for date and date range filters when filter type is date
        if formGroup.$name and formGroup.$name.indexOf('daterangefilter_') > -1
          #if selection is date range and valid date range is not selected, set control to invalid
          index = formGroup.$name.split('_')[1]
          criteria = @search_criterias[index]
          if criteria and criteria.condition == 'between' and not @checkIfValidDateRangeObject(criteria.advance_filter_value)
            formGroup.$setValidity('validDateRange', false)
          else
            formGroup.$setValidity('validDateRange', true)
        else if formGroup.$name and formGroup.$name.indexOf('datefilter_') > -1
          #if selection is datepicker and valid date is not selected, set control to invalid
          index = formGroup.$name.split('_')[1]
          criteria = @search_criterias[index]
          if criteria and criteria.condition != 'between' and not _(criteria.advance_filter_value).isDate()
            formGroup.$setValidity('validDate', false)
          else
            formGroup.$setValidity('validDate', true)

  checkIfValidDateRangeObject: (object)=>
    object and object.selectedRange and object.selectedRange != 'No Filter'

  openRow: (row,col)=>
    if !row.internalRow && col.field != "selectionRowHeaderCol" && col.displayName != "Action"
      data = {
        activeTab: @activeView
        filterCriteria: @search_criterias
        global_ternary_operator: @global_ternary_operator
        global_search_criteria: @global_search_criteria
      }
      @HistoryDataService.setSavedQuestionData(data)
      @saveGridState()
      @$state.go("app.diligence.question.detail",{questionId: row.entity.question_id})

  clearGrouping: (grid,column)=>
    grid.api.grouping.clearGrouping()

  displayGroupedHeaderName: (grid,row,col) ->
    @CommonService.displayOwnerHeaderName(grid, row, col)

  saveGridState: =>
    @HistoryDataService.saveQuestionsGridState(@FormAdvData_grid.saveState.save())

  clearGridState: =>
    @HistoryDataService.clearQuestionsGridState()

  formatTagsTooltip: (tagsList) ->
    @DocumentsService.formatTagsTooltip(tagsList)
