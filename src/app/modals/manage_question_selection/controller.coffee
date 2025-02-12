class ManageQuestionSelectionController extends ModalController

  @register 'ManageQuestionSelectionController'

  @inject '$uibModalInstance', 'toaster', 'Restangular', 'Utils', '$state', '$timeout', '$scope', 'ModalFactory', 'SweetAlert',  '$filter', 'selectedQuestions', 'FILTER_TERNARY_OPERATORS', 'FILTER_TYPES', 'TemplatesDataService'

  initialize: =>
    # initialize empty params
    @activeTab = "Question"
    @searchText = ""
    @global_ternary_operator = @FILTER_TERNARY_OPERATORS.AND
    @selectAll = false
    @allFilterOptions = []
    @allSearchFilterOptions = []
    @allSortFilterOptions = []
    @search_criterias = []
    @selection_list = []
    @filters_data_loaded = false
    @showFilters = false
    @showAddNewQuestion = false
    @filterApplied = false
    @processing_data = true
    @filters = {'name': ''}
    @frequestlyUsedFilterValue = 'not-selected'
    @mostAnsweredFilterValue = false
    @currentSortFilterSelected = 'ma-false'
    @TemplatesDataService.getResponseTypes().then (responseTypes) =>
      @responseTypes = responseTypes
    @getAllFilterOptions()


  getAllFilterOptions: ->
    params =
      filters: {"type": "excel"}
    @Restangular.all('service/es_service/question_filters').post(params).then (response) =>
      if response.status == 200
        @allFilterOptions = response.data
        for option in response.data
          if option.filter_function == 'search'
            @allSearchFilterOptions.push(option)
        for option in response.data
          if option.filter_function == 'sort'
            @allSortFilterOptions.push(option)
        @filters_data_loaded = true
        newCriteria = {}
        newCriteria = {criteria_obj:@allSearchFilterOptions[0]}
        @search_criterias.push(newCriteria)
        @searchByFilters()
      else
        @allFilterOptions = response.data
        @filters_data_loaded = true
        @searchByFilters()
        # @toaster.pop 'error','Unexpected error occurred'


  getResponseTypeById:(id) =>
    response_type = {}
    for response in @responseTypes
      if response.id == id
        response_type = response
    response_type

  formatTemplatesTooltip: (entity) =>
    templatesCopy = angular.copy entity.templates
    templatesNames = _(templatesCopy).pluck "template_name"
    templatesNames = _(templatesNames).join(', ')
    templatesNames


  searchByFilters: ()=>
    searchByFiltersData = []
    for filter,index in @search_criterias
      if filter
        if(filter.hasOwnProperty('condition') && filter.hasOwnProperty('advance_filter_value') && filter.condition != null && filter.advance_filter_value != null && filter.advance_filter_value != "" && filter.advance_filter_value != undefined)
          searchByFiltersData.push(filter)
    params =
      filters: "#{@global_ternary_operator}" : []
    for filter in searchByFiltersData
      filter_params =
        filter_name: filter.criteria_obj.filter_name,
        filter_type: filter.criteria_obj.filter_type,
        search_type: filter.condition,
        filter_value: filter.advance_filter_value
      params.filters[@global_ternary_operator].push(filter_params)
    @applyFiltersSearch(params)

  setSelectedDefaultValue: (criteria, index)=>
    criteria.condition = criteria.criteria_obj.search_type[0].value

  setOptionsDefaultValue: (criteria,index) =>
    if criteria.condition
      criteria.condition = criteria.condition
    else
      criteria.condition = criteria.criteria_obj.search_type[0].value

  applyFiltersSearch: (filter_params) =>
    if (filter_params.filters.hasOwnProperty('and') || filter_params.filters.hasOwnProperty('or')) && filter_params.filters[@global_ternary_operator].length == 0
      @filterApplied = false
    else
      @filterApplied = true
    if @filters.name
      nameFilterParams =
          filter_name: 'question_text',
          filter_type: 'str',
          search_type: 'contains',
          filter_value: @filters.name
      filter_params.filters[@global_ternary_operator].push(nameFilterParams)
    if @mostAnsweredFilterValue != 'not-selected'
      nameFilterParams =
          filter_name: 'response_count_sort',
          filter_type: 'bool',
          search_type: 'exact',
          filter_value: @mostAnsweredFilterValue
      filter_params.filters[@global_ternary_operator].push(nameFilterParams)

    if @frequestlyUsedFilterValue != 'not-selected'
      nameFilterParams =
          filter_name: 'template_count',
          filter_type: 'bool',
          search_type: 'exact',
          filter_value: @frequestlyUsedFilterValue
      filter_params.filters[@global_ternary_operator].push(nameFilterParams)
    @processing_data = true
    @Restangular.all('service/es_service/excel_question_suggestions').post(filter_params).then (response) =>
      @questions = response.data
      if @selectedQuestions.length
        for entry in @questions
          for selectedQues in @selectedQuestions
            if selectedQues.question_group_id == entry.question_group_id
              entry.is_selected = true
      @processing_data = false
      @showFilters = false

  selectCriteria: (criteria, index) =>
    criteria.condition = criteria.criteria_obj.search_type[0].value
    if criteria.advance_filter_value
      criteria.advance_filter_value = ''

  addNewCriteria: ->
    @$timeout =>
      newCriteria = {}
      newCriteria = {criteria_obj: @allSearchFilterOptions[0]}
      @search_criterias.push(newCriteria)
    , 400

  toggleFiltersSection: ->
    @showFilters = !@showFilters

  removeCurrentFilter: (criteria, index) =>
    if index<@search_criterias.length == 1
      # @default_criteria_options.splice(index, 1)
      criteria.advance_filter_value = ''
    else
      @search_criterias.splice(index, 1)

  resetFilters: =>
    @global_ternary_operator = @FILTER_TERNARY_OPERATORS.AND
    @search_criterias = []
    @showFilters = false
    # @custom_search_form.$setPristine()
    # @custom_search_form.$setUntouched()
    @filters.name = ''
    @frequestlyUsedFilterValue = 'not-selected'
    @mostAnsweredFilterValue = 'not-selected'
    @addNewCriteria()
    @searchByFilters()

  selectSortCriteriaFilter: () =>
    if @currentSortFilterSelected == 'ma-true'
      @mostAnsweredFilterValue = true
      @frequestlyUsedFilterValue = 'not-selected'
    else if @currentSortFilterSelected == 'ma-false'
      @mostAnsweredFilterValue = false
      @frequestlyUsedFilterValue = 'not-selected'
    else if @currentSortFilterSelected == 'fu-true'
      @frequestlyUsedFilterValue = true
      @mostAnsweredFilterValue = 'not-selected'
    else if @currentSortFilterSelected == 'fu-false'
      @frequestlyUsedFilterValue = false
      @mostAnsweredFilterValue = 'not-selected'
    else
      @frequestlyUsedFilterValue = 'not-selected'
      @mostAnsweredFilterValue = 'not-selected'
    @searchByFilters()

  setActiveTab: (tabType) =>
    @activeTab = tabType

  toggleSelectAll: (select)=>
    if select
      if @questions and @questions.length
        for question in @questions
          question.is_selected = true
    else
      if @questions and @questions.length
        for question in @questions
          question.is_selected = false

  save: =>
    selected_questions = _(@questions).filter (entry) => entry.is_selected
    @close(selected_questions)
