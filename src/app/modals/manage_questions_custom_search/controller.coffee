class ManageQuestionsCustomSearchController extends ModalController

  @register 'ManageQuestionsCustomSearchController'

  @inject 'Restangular', '$timeout', '$scope', '$uibModalInstance','FILTER_TERNARY_OPERATORS', 'FILTER_TYPES', 'Utils', 'toaster', 'custom_filters_data'

  initialize: ->
    @search_filters_response = @custom_filters_data.search_filters_response
    @search_criterias_filters_backup = []
    @custom_criteria_options_preapproved = []
    @search_criterias = []
    @search_criterias_filters_backup = @custom_filters_data.search_criterias
    @default_criteria_options = @search_filters_response.default_filters
    @custom_criteria_options = @search_filters_response.custom_filter
    @global_ternary_operator = @custom_filters_data.global_ternary_operator
    @activeView = @custom_filters_data.active_view
    if @activeView == 'preapproved'
      for option in @custom_criteria_options
        if option.filter_label != 'Project type'
          @custom_criteria_options_preapproved.push option
    if @search_criterias_filters_backup.length == 0
      for filter in @default_criteria_options
        @addNewDefaultFilterCriteria(filter)
    else 
      for filter,index in @search_criterias_filters_backup
        @setSearchCriteriasOptions(filter,index)

  setSearchCriteriasOptions: (filter,index) =>
    @$timeout =>
      newCriteria = {}
      if index < @default_criteria_options.length
        criteria_obj = _(@default_criteria_options).find (criteria)=>
          criteria.filter_name == filter.criteria_obj.filter_name
      else
        criteria_obj = _(@custom_criteria_options).find (criteria)=>
          criteria.filter_name == filter.criteria_obj.filter_name
      newCriteria = {criteria_obj: criteria_obj,condition: filter.condition, advance_filter_value: filter.advance_filter_value}
      @search_criterias.push(newCriteria)
      @custom_search_form.$setPristine()
      @custom_search_form.$setUntouched()
    , 200

  addNewDefaultFilterCriteria: (filter) =>
    @$timeout =>
      newCriteria = {}
      newCriteria = {criteria_obj: filter}
      @search_criterias.push(newCriteria)
      @custom_search_form.$setPristine()
      @custom_search_form.$setUntouched()
    , 200

  addNewCriteria: =>
    newCriteria = {criteria_obj: @custom_criteria_options[0]}
    @search_criterias.push(newCriteria)
    @custom_search_form.$setPristine()
    @custom_search_form.$setUntouched()

  removeCriteria: () =>
    @search_criterias.splice(@search_criterias.length-1, 1)
    @custom_search_form.$setPristine()
    @custom_search_form.$setUntouched()

  removeCurrentFilter: (criteria, index) =>
    if index<@default_criteria_options.length
      # @default_criteria_options.splice(index, 1)
      criteria.advance_filter_value = ''
      criteria.condition = criteria.criteria_obj.default_operation.value
    else
      @search_criterias.splice(index, 1)

  clearAllFilters: () =>
    @search_criterias = []
    for filter in @default_criteria_options
        @addNewDefaultFilterCriteria(filter)

  selectCriteria: (criteria, index) =>
    criteria.condition = criteria.criteria_obj.default_operation.value
    if criteria.advance_filter_value
      criteria.advance_filter_value = ''

  setOptionsDefaultValue: (criteria,index) =>
    if criteria.condition
      criteria.condition = criteria.condition
    else 
      criteria.condition = criteria.criteria_obj.default_operation.value

  resetFilters: ->
    @global_ternary_operator = @FILTER_TERNARY_OPERATORS.AND
    @search_criterias = []
    @custom_search_form.$setPristine()
    @custom_search_form.$setUntouched()
    for filter in @default_criteria_options
        @addNewDefaultFilterCriteria(filter)
    reset_response = 
      global_ternary_operator: @global_ternary_operator
      searchByFiltersParams: {}
      search_criterias: @search_criterias
    @close(reset_response)    

  searchByFilters: ()=>
    searchByFiltersData = []
    for filter,index in @search_criterias
      if filter
        if(filter.hasOwnProperty('condition') && filter.hasOwnProperty('advance_filter_value') && filter.condition != null && filter.advance_filter_value != null && filter.advance_filter_value != "" && filter.advance_filter_value != undefined)
          searchByFiltersData.push(filter)
    if searchByFiltersData.length == 0
      @resetFilters()
    params = 
      filters: "#{@global_ternary_operator}" : []
    for filter in searchByFiltersData
      if filter.criteria_obj.filter_type == @FILTER_TYPES.DATE || filter.criteria_obj.filter_type == @FILTER_TYPES.DATETIME
        filter_params =
          filter_label: filter.criteria_obj.filter_label,
          filter_name: filter.criteria_obj.filter_name,
          filter_type: filter.criteria_obj.filter_type,
          search_type: filter.condition,
          filter_value: @Utils.getLocalDateTime(filter.advance_filter_value)
      else
        filter_params =
          filter_label: filter.criteria_obj.filter_label,
          filter_name: filter.criteria_obj.filter_name,
          filter_type: filter.criteria_obj.filter_type,
          search_type: filter.condition,
          filter_value: filter.advance_filter_value
      params.filters[@global_ternary_operator].push(filter_params)
    response = 
      global_ternary_operator: @global_ternary_operator
      searchByFiltersParams: params
      search_criterias: @search_criterias
    @close(response)

    
  