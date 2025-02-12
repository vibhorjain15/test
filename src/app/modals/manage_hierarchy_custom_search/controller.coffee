class ManageHierarchyCustomSearchController extends ModalController

  @register 'ManageHierarchyCustomSearchController'

  @inject 'Restangular', '$timeout', '$scope', '$uibModalInstance','FILTER_TERNARY_OPERATORS', 'FILTER_TYPES', 'Utils', 'toaster', 'custom_filters_data'

  initialize: ->
    @global_hierarchy_option = @custom_filters_data.global_hierarchy_option
    @search_filters_response = @custom_filters_data.search_filters_response
    @search_criterias_filters_backup = []
    @search_criterias = []
    @search_criterias_filters_backup = @custom_filters_data.search_criterias
    @default_criteria_options = @search_filters_response[@global_hierarchy_option.toLowerCase()].default_filters
    @custom_criteria_options = @search_filters_response[@global_hierarchy_option.toLowerCase()].custom_filters
    @entityType = @Utils.getDisplayEntityType(@search_filters_response[@global_hierarchy_option.toLowerCase()].response_type)
    @global_ternary_operator = @custom_filters_data.global_ternary_operator
    if @search_criterias_filters_backup.length == 0
      for filter in @default_criteria_options
        @addNewDefaultFilterCriteria(filter)
    else 
      for filter in @search_criterias_filters_backup
        @setSearchCriteriasOptions(filter)

  globalhierarchyptionChanged:  ->
    @search_filters_response = @custom_filters_data.search_filters_response
    @search_criterias_filters_backup = []
    @search_criterias = []
    @search_criterias_filters_backup = @custom_filters_data.search_criterias
    @default_criteria_options = @search_filters_response[@global_hierarchy_option.toLowerCase()].default_filters
    @custom_criteria_options = @search_filters_response[@global_hierarchy_option.toLowerCase()].custom_filters
    @entityType = @Utils.getDisplayEntityType(@search_filters_response[@global_hierarchy_option.toLowerCase()].response_type)
    @global_ternary_operator = @custom_filters_data.global_ternary_operator
    if @search_criterias_filters_backup.length == 0
      for filter in @default_criteria_options
        @addNewDefaultFilterCriteria(filter)
    else 
      for filter in @search_criterias_filters_backup
        @setSearchCriteriasOptions(filter)


  setSearchCriteriasOptions: (filter) =>
    @$timeout =>
      newCriteria = {}
      newCriteria = {criteria_obj: filter.criteria_obj,condition: filter.condition, advance_filter_value: filter.advance_filter_value}
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
      global_hierarchy_option: @global_hierarchy_option
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
      include_contacts: true,
      include_custom_fields: true,
      include_dates: true,
      filters: "#{@global_ternary_operator}" : []
    for filter in searchByFiltersData
      if filter.criteria_obj.type == @FILTER_TYPES.DATE
        filter_params =
          filter_key: filter.criteria_obj.filter_key,
          filter_name: filter.criteria_obj.filter_name,
          type: filter.criteria_obj.type,
          operations: filter.condition,
          filter_value: @Utils.getLocalDateTime(filter.advance_filter_value)
      else
        filter_params =
          filter_key: filter.criteria_obj.filter_key,
          filter_name: filter.criteria_obj.filter_name,
          type: filter.criteria_obj.type,
          operations: filter.condition,
          filter_value: filter.advance_filter_value
      params.filters[@global_ternary_operator].push(filter_params)
    response = 
      global_hierarchy_option: @global_hierarchy_option
      global_ternary_operator: @global_ternary_operator
      searchByFiltersParams: params
      search_criterias: @search_criterias
    @close(response)

    
  