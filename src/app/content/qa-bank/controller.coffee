class DiligenceQuestionAnswersBankController extends BaseController

  @register 'DiligenceQuestionAnswersBankController'

  @inject '$http', '$q', 'baseUrl', '$parse', '$log', 'FILTER_TERNARY_OPERATORS', '$stateParams','toaster', 'Restangular', '$state', 'DueDiligenceDataservice', 'Utils', 'MentionsFactory', '$scope',
    'SweetAlert', '$rootScope', '$timeout', '$tinymceMentionsPlaceholderText','HistoryDataService','ModalFactory','RestangularHeaderService','keywordConstants','responseStatus', '$window' , 'angularEnabled'

  initialize: ->
    @is_freeSubscription = @Utils.isFreeSubscription()
    @datesFilterSelectedDates = {startDate: null, endDate: null}
    @currentPageNumber = 1
    promise = []
    @selectedDateRange = ""
    @expiryFilterExist = false
    @pageLoadingStarted = false
    @showPreapprovedDefault = false
    promise.push @Restangular.all('firm_preferences').customGET().then (response) =>
      @pageLoadingStarted = true
      @showPreapprovedDefault = response.set_preapproved_default

    @$q.all(promise).then =>

        @viewSimilarQuestionsVisible = false

        @canceler = @$q.defer()

        @allQuestionsListData = []
        @start_point = 0
        @end_point = 50

        @tinymceOptions =
          init_instance_callback: (editor) =>
            @tinymceEditor = editor
            editor.on 'paste', (e) =>
              @tinymceEditor.insertContent('')
          skin_url: '/assets/stylesheets/tinymce/skins/tinymce-dv'
          browser_spellcheck: true
          placeholder: @$tinymceMentionsPlaceholderText
          toolbar: false
          menubar: false
          statusbar: false
          content_css : 'assets/stylesheets/tiny_mce_custom.css'
          forced_root_block : ""

        @questionsTotalCount = 0
        @questionsCurrentCount = 0
        @questionsOffset = 0
        @enableGetDataFromServerForQA = false
        @loadingMoreData = false

        @questionInitialCount = 1
        @selectedQuestionsId =  []
        @questionsList = []
        @searchByKeyValue = 'Question'

        @search_filters_response =
          default_filters:[]
          custom_filter: []

        if @showPreapprovedDefault
          @activeView = 'preapproved'
        else
          @activeView = 'all'

        @loadingData = true
        @filterSummary = {}
        @showingSearchResults = false
        @showAnswers = true
        @showAllAnswers = true

        @global_ternary_operator = @FILTER_TERNARY_OPERATORS.AND

        @getFiltersModalData()
        @filters_data_loaded = false
        @filterApplied = false
        @global_ternary_operator = @FILTER_TERNARY_OPERATORS.AND

        @search_criterias = []
        @filters = {}

        @respnseDateFilterValue = false
        @expiryDateFilterValue = 'not-selected'
        @currentSortFilterSelected = 'response_date_sort'
        @currentSortFilterOptionSelected = 'Descending'

        @searchByFilters()

        @pageUrl = ""

        @$scope.$on 'delete:notes', (event, note) =>
          @removeNote(note)

    @isInvestor = @Utils.isInvestor()
    if @isInvestor
      @$window.history.back()
      return

  setActiveView: (mode) =>
      @activeView = mode
      @currentSortFilterSelected = 'response_date_sort'
      @expiryDateFilterValue = 'not-selected'
      @respnseDateFilterValue = false
      if mode == 'preapproved'
        @currentSortFilterOptionSelected = 'Descending'
        for search_criteria,index in @search_criterias
          if search_criteria.criteria_obj.filter_label == "Project type"
            @search_criterias.splice index, 1
        @searchByFilters()
      else
        @currentSortFilterOptionSelected = 'Descending'
        @searchByFilters()

  getQuestionaireBank: (type) =>
    @searchByFilters()

  removeDatesFilter: =>
    @dateFilterApplied = false
    @selectedDateRange = ""
    @filterByExpiryDate("clear")

  filterByExpiryDate: (type) =>
    searchByFiltersData = []
    @datesFilterSelectedDates = {startDate: null, endDate: null}
    todayDate = moment().format()
    if type == "five"
      endDate = moment().add(5, 'days').format()
      @selectedDateRange = "Expiring in 5 Days"
    else if type == "ten"
      endDate = moment().add(10, 'days').format()
      @selectedDateRange = "Expiring in 10 Days"
    else if type == "thirty"
      endDate = moment().add(30, 'days').format()
      @selectedDateRange = "Expiring in 30 Days"
    else if type == "all"
      endDate = moment().subtract(1, 'days').format()
      @selectedDateRange = "All Expired"
    for filter,index in @search_criterias
      if filter
        if(filter.hasOwnProperty('condition') && filter.hasOwnProperty('advance_filter_value') && filter.condition != null && filter.advance_filter_value != null && filter.advance_filter_value != "" && filter.advance_filter_value != undefined)
          searchByFiltersData.push(filter)
    params =
      filters: {}
    params.filters[@global_ternary_operator] = []
    if type == "clear"
      @dateFilterApplied = false
    else
      @dateFilterApplied = true
      if type != "all"
        startDateObj = {
          filter_label: "Expiry date"
          filter_name: "expiry_date"
          filter_type: "datetime"
          filter_value: todayDate
          search_type: "gte"
        }
        params.filters[@global_ternary_operator].push(startDateObj)
        @datesFilterSelectedDates.startDate = startDateObj
      endDateObj = {
        filter_label: "Expiry date"
        filter_name: "expiry_date"
        filter_type: "datetime"
        filter_value: endDate
        search_type: "lte"
      }
      params.filters[@global_ternary_operator].push(endDateObj)
      @datesFilterSelectedDates.endDate = endDateObj
    for filter in searchByFiltersData
      if filter.criteria_obj.filter_name == "response_type"
        @responseTypeFilterExists = true
      if filter.criteria_obj.filter_name != "expiry_date"
        filter_params =
          filter_label: filter.criteria_obj.filter_label,
          filter_name: filter.criteria_obj.filter_name,
          filter_type: filter.criteria_obj.filter_type,
          search_type: filter.condition,
          filter_value: filter.advance_filter_value
        params.filters[@global_ternary_operator].push(filter_params)
    params.offset = 1
    @applyFiltersSearch(params)



  getContainerClass: (question) =>
    styleClass = ""
    dateIsSame = moment(question.expiry_date).isSame(moment());
    dateIsBefore = moment(question.expiry_date).isBefore(moment());
    if dateIsBefore || dateIsSame
      styleClass = "expiredContent"
    styleClass

  addNewQuestion: =>
    if not @is_freeSubscription
      @ModalFactory.invokeModal 'add_pre_approved',
        resolve:
          source: => 'questions'
        success: (response) =>
          if response
            @getQuestionaireBank(@activeView)
        dismiss: =>
          @getQuestionaireBank(@activeView)

# FIlter Search
  applyFilters: ->
    @searchByFilters()

  uploadQaFile: =>
    @ModalFactory.invokeModal 'upload_qa_file'

  getFiltersModalData: () =>
    @sortFilterOptins = []
    @Restangular.all('service/es_service/qa_filters_v1').post(filters:{}).then (response) =>
      for customFilter in response.custom_filter
        if customFilter.filter_function == 'sort'
          @sortFilterOptins.push customFilter
        else
          @search_filters_response.custom_filter.push customFilter
      @search_filters_response.default_filters = response.default_filters
      @filters_data_loaded = true
      for filter,index in  @search_filters_response.default_filters
        if filter.hasOwnProperty('endpoint')
          @getDynamicDefaultFilterOptions(filter,index)
      for filter,index in  @search_filters_response.custom_filter
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
      for option in @search_filters_response.custom_filter[index].options
        @renameUsenameToValue(option,@search_filters_response.custom_filter[index].display_attribute)

  getDynamicDefaultFilterOptions:(filter,index) =>
    @$http.get(filter.endpoint).then (response) =>
      @search_filters_response.default_filters[index].options = response.data
      for option in @search_filters_response.default_filters[index].options
        @renameUsenameToValue(option,@search_filters_response.default_filters[index].display_attribute)

  renameUsenameToValue: (obj,key) =>
    obj['value'] = obj[key];
    delete obj[key];

  toggleFiltersSection: =>
    @ModalFactory.invokeModal 'manage_questions_custom_search',
      resolve:
        custom_filters_data: =>
          global_ternary_operator: @global_ternary_operator
          search_filters_response : @search_filters_response
          search_criterias:@search_criterias
          active_view: @activeView
      success: (response) =>
        @search_criterias = response.search_criterias
        @global_ternary_operator =  response.global_ternary_operator
        console.log @search_criterias
        console.log response.searchByFiltersParams
        if !_.isEmpty response.searchByFiltersParams
          @filterApplied = true
          selectedParams = _(response.searchByFiltersParams.filters[@global_ternary_operator]).pluck('filter_name')
          @dateFilterApplied = false
          if selectedParams.indexOf("response_type") > -1
            @responseTypeFilterExists = true
          if selectedParams.indexOf("expiry_date") > -1
            @expiryFilterExist = true
            @datesFilterSelectedDates = {startDate: null, endDate: null}
          if @datesFilterSelectedDates.startDate
            response.searchByFiltersParams.filters[@global_ternary_operator].push @datesFilterSelectedDates.startDate
            @dateFilterApplied = true
          if @datesFilterSelectedDates.endDate
            response.searchByFiltersParams.filters[@global_ternary_operator].push @datesFilterSelectedDates.endDate
            @dateFilterApplied = true

          @applyFiltersSearch(response.searchByFiltersParams)
        else
          @resetFiltersData()

  goToPrevious: =>
    @currentPageNumber = @currentPageNumber - 1
    @loadingData = true
    @start_point = @start_point - 50
    @end_point = @end_point - 50
    @questionsList = @allQuestionsListData.slice(@start_point,@end_point)
    @loadingData = false

  goToNext: =>
    @currentPageNumber = @currentPageNumber + 1
    @loadingData = true
    @start_point = @start_point + 50
    @end_point = @end_point + 50
    if @questionsOffset >= 3 && @allQuestionsListData.slice(@start_point,@end_point).length == 0
      @enableGetDataFromServerForQA = true
      @searchByFilters(@questionsOffset)
    else
      @questionsList = @allQuestionsListData.slice(@start_point,@end_point)
      @loadingData = false

  getMoreDataFromServerForQA: (filter_params) =>
    @loadingMoreData = true
    @enableGetDataFromServerForQA = false
    if @filters.name
      if @searchByKeyValue == 'Question'
        nameFilterParams =
            filter_label: 'Question',
            filter_name: 'question_text',
            filter_type: 'str',
            search_type: 'contains',
            filter_value: @filters.name
      else if @searchByKeyValue == 'Answer'
        nameFilterParams =
            filter_label: 'Response',
            filter_name: 'response_text',
            filter_type: 'str',
            search_type: 'contains',
            filter_value: @filters.name
      if !filter_params.filters[@global_ternary_operator]
        filter_params.filters[@global_ternary_operator] = []
      filter_params.filters[@global_ternary_operator].push(nameFilterParams)

    if @expiryDateFilterValue != 'not-selected'
      nameFilterParams =
          filter_name: 'expiry_date_sort',
          filter_type: 'bool',
          search_type: 'exact',
          filter_value: @expiryDateFilterValue
      if !filter_params.filters[@global_ternary_operator]
        filter_params.filters[@global_ternary_operator] = []
      filter_params.filters[@global_ternary_operator].push(nameFilterParams)

    if @respnseDateFilterValue != 'not-selected'
      nameFilterParams =
          filter_name: 'response_date_sort',
          filter_type: 'bool',
          search_type: 'exact',
          filter_value: @respnseDateFilterValue
      if !filter_params.filters[@global_ternary_operator]
        filter_params.filters[@global_ternary_operator] = []
      filter_params.filters[@global_ternary_operator].push(nameFilterParams)

    if @activeView == 'all'
      nameFilterParams =
          filter_name: 'diligence_type',
          filter_type: 'dropdown',
          search_type: 'exact',
          filter_value: [1243,1242,1241,2,-1,0,3]
      if !filter_params.filters[@global_ternary_operator]
        filter_params.filters[@global_ternary_operator] = []
      filter_params.filters[@global_ternary_operator].push(nameFilterParams)

    if @activeView == 'preapproved'
      nameFilterParams =
          filter_name: 'diligence_type',
          filter_type: 'dropdown',
          search_type: 'exact',
          filter_value: [-1]
      if !filter_params.filters[@global_ternary_operator]
        filter_params.filters[@global_ternary_operator] = []
      filter_params.filters[@global_ternary_operator].push(nameFilterParams)

    if !@responseTypeFilterExists
      response_filter = 
        filter_name: "response_type"
        filter_type: "dropdown"
        search_type: "exact",
        filter_value: [1,2,3,4,5,6,7,8,9,10,11,13,14,15,16,17,19,20]
      if @global_ternary_operator == 'and'
        filter_params.filters[@global_ternary_operator].push response_filter
      else
        filter_params.filters['and'] = [response_filter]

    if @viewSimilarQuestionsVisible
      viewSimilarFilterParams =
            filter_label: 'question id',
            filter_name: 'question_id',
            filter_type: 'id',
            search_type: 'exact',
            filter_value: @similarQuestionFilterValue.question_id
      if !filter_params.filters[@global_ternary_operator]
        filter_params.filters[@global_ternary_operator] = []
      filter_params.filters[@global_ternary_operator].push(viewSimilarFilterParams)
      nameFilterParams =
          filter_label: 'Question',
          filter_name: 'question_text',
          filter_type: 'str',
          search_type: 'contains',
          filter_value: @similarQuestionFilterValue.question_text
      if !filter_params.filters[@global_ternary_operator]
        filter_params.filters[@global_ternary_operator] = []
      filter_params.filters[@global_ternary_operator].push(nameFilterParams)
      filter_params['similar_qna'] = 1

    @Restangular.all('service/es_service/qa_search_v1').withHttpConfig({timeout: @canceler.promise}).post(filter_params).then (response) =>
      for data in response.data
        @allQuestionsListData.push data
      @questionsList = @allQuestionsListData.slice(@start_point,@end_point)
      @questionsTotalCount = response.filtered_count
      @questionsCurrentCount = @questionsCurrentCount + response.highlighted_count
      @questionsOffset = response.offset
      @loadingMoreData = false
      @loadingData = false
      if @questionsCurrentCount < @questionsTotalCount && @questionsOffset < 3
        @enableGetDataFromServerForQA = true
        @searchByFilters(@questionsOffset)

  applyFiltersSearch: (filter_params) =>
    @start_point = 0
    @end_point = 50
    @canceler.resolve()
    @loadingData = true
    @loadingMoreData = false
    @canceler = @$q.defer()
    if @filters.name
      if @searchByKeyValue == 'Question'
        nameFilterParams =
            filter_label: 'Question',
            filter_name: 'question_text',
            filter_type: 'str',
            search_type: 'contains',
            filter_value: @filters.name
      else if @searchByKeyValue == 'Answer'
        nameFilterParams =
            filter_label: 'Response',
            filter_name: 'response_text',
            filter_type: 'str',
            search_type: 'contains',
            filter_value: @filters.name
      if !filter_params.filters[@global_ternary_operator]
        filter_params.filters[@global_ternary_operator] = []
      filter_params.filters[@global_ternary_operator].push(nameFilterParams)

    if @expiryDateFilterValue != 'not-selected'
      nameFilterParams =
          filter_name: 'expiry_date_sort',
          filter_type: 'bool',
          search_type: 'exact',
          filter_value: @expiryDateFilterValue
      if !filter_params.filters[@global_ternary_operator]
        filter_params.filters[@global_ternary_operator] = []
      filter_params.filters[@global_ternary_operator].push(nameFilterParams)

    if @respnseDateFilterValue != 'not-selected'
      nameFilterParams =
          filter_name: 'response_date_sort',
          filter_type: 'bool',
          search_type: 'exact',
          filter_value: @respnseDateFilterValue
      if !filter_params.filters[@global_ternary_operator]
        filter_params.filters[@global_ternary_operator] = []
      filter_params.filters[@global_ternary_operator].push(nameFilterParams)

    if @activeView == 'all'
      nameFilterParams =
          filter_name: 'diligence_type',
          filter_type: 'dropdown',
          search_type: 'exact',
          filter_value: [1243,1242,1241,2,-1,0,3]
      if !filter_params.filters[@global_ternary_operator]
        filter_params.filters[@global_ternary_operator] = []
      filter_params.filters[@global_ternary_operator].push(nameFilterParams)

    if @activeView == 'preapproved'
      nameFilterParams =
          filter_name: 'diligence_type',
          filter_type: 'dropdown',
          search_type: 'exact',
          filter_value: [-1]
      if !filter_params.filters[@global_ternary_operator]
        filter_params.filters[@global_ternary_operator] = []
      filter_params.filters[@global_ternary_operator].push(nameFilterParams)

    if !@responseTypeFilterExists
      response_filter = 
        filter_name: "response_type"
        filter_type: "dropdown"
        search_type: "exact",
        filter_value: [1,2,3,4,5,6,7,8,9,10,11,13,14,15,16,17,19,20]
      if @global_ternary_operator == 'and'
        filter_params.filters[@global_ternary_operator].push response_filter
      else
        filter_params.filters['and'] = [response_filter]

    if @viewSimilarQuestionsVisible
      viewSimilarFilterParams =
            filter_label: 'question id',
            filter_name: 'question_id',
            filter_type: 'id',
            search_type: 'exact',
            filter_value: @similarQuestionFilterValue.question_id
      if !filter_params.filters[@global_ternary_operator]
        filter_params.filters[@global_ternary_operator] = []
      filter_params.filters[@global_ternary_operator].push(viewSimilarFilterParams)
      nameFilterParams =
          filter_label: 'Question',
          filter_name: 'question_text',
          filter_type: 'str',
          search_type: 'contains',
          filter_value: @similarQuestionFilterValue.question_text
      if !filter_params.filters[@global_ternary_operator]
        filter_params.filters[@global_ternary_operator] = []
      filter_params.filters[@global_ternary_operator].push(nameFilterParams)
      filter_params['similar_qna'] = 1
    @Restangular.all('service/es_service/qa_search_v1').withHttpConfig({timeout: @canceler.promise}).post(filter_params).then (response) =>
      @getLastRefreshedData()
      @loadingData = false
      @currentPageNumber = 1
      @responseTypeFilterExists = false
      @allQuestionsListData = response.data
      @questionsList = @allQuestionsListData.slice(@start_point,@end_point)
      @questionsTotalCount = response.filtered_count
      @questionsCurrentCount = response.highlighted_count
      @questionsOffset = response.offset
      if @questionsCurrentCount < @questionsTotalCount && !response.search_status
        @enableGetDataFromServerForQA = true
        @searchByFilters(@questionsOffset)

  resetFiltersData: (hardReset = false) ->
    if hardReset
      @viewSimilarQuestionsVisible = false
      @similarQuestionFilterValue = null
    @respnseDateFilterValue = false
    @expiryDateFilterValue = 'not-selected'
    @currentSortFilterSelected = 'response_date_sort'
    @currentSortFilterOptionSelected = 'Descending'
    @datesFilterSelectedDates = {startDate: null, endDate: null}
    @global_ternary_operator = @FILTER_TERNARY_OPERATORS.AND
    @search_criterias = []
    @filterApplied = false
    @searchByKeyValue = 'Question'
    @filters.name = ''
    @searchByFilters()

  removeFilterCriterion: (index) =>
    if index<@search_filters_response.default_filters.length
      @search_criterias[index].advance_filter_value = ''
    else
      @search_criterias.splice index, 1
    @searchByFilters()

  searchByFilters: (offset = 1)=>
    searchByFiltersData = []
    @dateFilterApplied = false
    for filter,index in @search_criterias
      if filter
        if(filter.hasOwnProperty('condition') && filter.hasOwnProperty('advance_filter_value') && filter.condition != null && filter.advance_filter_value != null && filter.advance_filter_value != "" && filter.advance_filter_value != undefined)
          searchByFiltersData.push(filter)
    if searchByFiltersData.length == 0
      @filterApplied = false
    params =
      filters: {}
    params.filters[@global_ternary_operator] = []
    @expiryFilterExist = false
    for filter in searchByFiltersData
      if filter.criteria_obj.filter_name == "expiry_date"
        @expiryFilterExist = true
      if filter.criteria_obj.filter_name == "response_type"
        @responseTypeFilterExists = true

      filter_params =
        filter_label: filter.criteria_obj.filter_label,
        filter_name: filter.criteria_obj.filter_name,
        filter_type: filter.criteria_obj.filter_type,
        search_type: filter.condition,
        filter_value: filter.advance_filter_value
      params.filters[@global_ternary_operator].push(filter_params)
    params.offset = offset

    if @datesFilterSelectedDates.startDate
      params.filters[@global_ternary_operator].push @datesFilterSelectedDates.startDate
      @dateFilterApplied = true
    if @datesFilterSelectedDates.endDate
      params.filters[@global_ternary_operator].push @datesFilterSelectedDates.endDate
      @dateFilterApplied = true
    @questionInitialCount = 1
    if @enableGetDataFromServerForQA
      @getMoreDataFromServerForQA(params)
    else
      @applyFiltersSearch(params)

  displayFilter: (criterion) =>
    displayedFilter = ''
    value = ''
    if criterion.criteria_obj.filter_type.toLowerCase() == 'date' || criterion.criteria_obj.filter_type.toLowerCase() == 'datetime'
      if criterion.condition == 'between'
        startDate = moment(criterion.advance_filter_value.startDate).format("YYYY-MM-DD")
        endDate = moment(criterion.advance_filter_value.endDate).format("YYYY-MM-DD")
        displayedDate = startDate + ' to '+ endDate
      else
        displayedDate = moment(criterion.advance_filter_value).format("YYYY-MM-DD")
      displayedFilter = "#{criterion.criteria_obj.filter_label} : " + displayedDate
    else
        for filter in @search_filters_response.custom_filter
          if(filter.filter_label == criterion.criteria_obj.filter_label && filter.hasOwnProperty('options'))
            for option in filter.options
              if(option.id == criterion.advance_filter_value)
                value = option.value
        if criterion.criteria_obj.filter_type == 'bool'
          if criterion.advance_filter_value
            value = 'Yes'
          else
            value = 'No'
        if value != ''
          displayedFilter = "#{criterion.criteria_obj.filter_label} : " + value
        else
          displayedFilter = "#{criterion.criteria_obj.filter_label} : " + criterion.advance_filter_value
    displayedFilter

  selectSortCriteriaFilter: () =>
    if @currentSortFilterSelected == 'expiry_date_sort' && @currentSortFilterOptionSelected == 'Ascending'
      @expiryDateFilterValue = true
      @respnseDateFilterValue = 'not-selected'
    else if @currentSortFilterSelected == 'expiry_date_sort' && @currentSortFilterOptionSelected == 'Descending'
      @expiryDateFilterValue = false
      @respnseDateFilterValue = 'not-selected'
    else if @currentSortFilterSelected == 'response_date_sort' && @currentSortFilterOptionSelected == 'Ascending'
      @respnseDateFilterValue = true
      @expiryDateFilterValue = 'not-selected'
    else if @currentSortFilterSelected == 'response_date_sort' && @currentSortFilterOptionSelected == 'Descending'
      @respnseDateFilterValue = false
      @expiryDateFilterValue = 'not-selected'
    else
      @respnseDateFilterValue = 'not-selected'
      @expiryDateFilterValue = 'not-selected'
    @searchByFilters()

  expiryDateFilterSelected: ->
    if @expiryDateFilterValue == true
      @expiryDateFilterValue = false
    else if @expiryDateFilterValue == false
      @expiryDateFilterValue = 'not-selected'
    else
      @expiryDateFilterValue = true
    @searchByFilters()

  respnseDateFilterSelected: ->
    if @respnseDateFilterValue == true
      @respnseDateFilterValue = false
    else if @respnseDateFilterValue == false
      @respnseDateFilterValue = 'not-selected'
    else
      @respnseDateFilterValue = true
    @searchByFilters()

  clickedSelectAllQuestions: ->
    for question in @questionsList
      if question.is_active
        question.isSelected = true;

  clickedUnSelectAllQuestions: ->
    for question in @questionsList
      question.isSelected = false;

  checkIfAllSelected: ->
    count = 0
    validQuestionsList = []
    for question in @questionsList
      if question.is_active
        validQuestionsList.push question
      if question.isSelected
        count = count + 1
    if count == validQuestionsList.length && validQuestionsList.length > 0
      'all-selected'
    else if count > 0 && validQuestionsList.length > 0
      'few-selected'
    else
      'none-selected'

  getSelectedQuestionsCount: ->
    count = 0
    for question in @questionsList
      if question.isSelected
        count = count + 1
    count

  clearSearchByKeyWord: () ->
    @filters.name = ''
    @searchByFilters()

  addRemoveTagsBulk: () ->
    selectedQuestions = []
    for question in @questionsList
      if question.isSelected
        selectedQuestions.push question
    @ModalFactory.invokeModal 'assign_new_tags_bulk',
      resolve:
        questionsList: => selectedQuestions
      success: (response) =>
        @searchByFilters()
        # updateQuestionsListForTag used to updated Tags from UI without waiting for ES sync
        # @updateQuestionsListForTag(response)


  assignSMEBulk: () ->
    selectedQuestions = []
    for question in @questionsList
      if question.isSelected && question.diligence_type == -1
        selectedQuestions.push question
    @ModalFactory.invokeModal 'assign_sme_bulk',
      resolve:
        questionsList: => selectedQuestions
      success: (response) =>
        @searchByFilters()
        # updateQuestionsListForSme used to update SMEs from UI without waiting for ES sync
        # @updateQuestionsListForSme(response)


  changeExpiryDateBulk: () ->
    selectedQuestions = []
    for question in @questionsList
      if question.isSelected && question.diligence_type == -1
        selectedQuestions.push question
    @ModalFactory.invokeModal 'assign_expiry_date_bulk',
      resolve:
        questionsList: => selectedQuestions
      success: (response) =>
        @searchByFilters()

  updateQuestionsListForTag: (response) ->
    @loadingData = true
    allQuestionsUpdatedIds = _(response.allQuestionsUpdated).pluck('question_id')
    # To Remove All Tags From All Questions
    if response.isRemovedAll
      _(@questionsList).forEach (question) =>
        if question.hasOwnProperty('tags') && _(allQuestionsUpdatedIds).contains(question.question_id)
          question.tags = []

    # To Remove Tags
    for tagRemoveData in response.tagsRemoved
      _(@questionsList).forEach (question,index) =>
        for question_data in tagRemoveData.question
          if question.question_id == question_data.question_id && _(allQuestionsUpdatedIds).contains(question.question_id)
            i=0
            while i < question.tags.length
              if question.tags[i].id == tagRemoveData.tag.id
                question.tags.splice(i,1)
                break;
              i++

    # To Add Tags In All Selected Questions
    for tag in response.tempAssignedTagsBulk
      _(@questionsList).forEach (question) =>
        if question.hasOwnProperty('tags') && _(allQuestionsUpdatedIds).contains(question.question_id)
          tagParam =
            id: tag.id
            value: tag.name
          question.tags.push tagParam
        else
          if _(allQuestionsUpdatedIds).contains(question.question_id)
            question.tags = []
            tagParam =
              id: tag.id
              value: tag.name
            question.tags.push tagParam
        question.tags = _.uniq(question.tags, 'id')

    # To Add Tags
    _(@questionsList).forEach (question) =>
      if _(allQuestionsUpdatedIds).contains(question.question_id)
        indexOfAddedTag = allQuestionsUpdatedIds.indexOf(question.question_id)
        if response.allQuestionsUpdated[indexOfAddedTag].hasOwnProperty('temp_assigned_tags') && response.allQuestionsUpdated[indexOfAddedTag].temp_assigned_tags.length > 0
          for tag in response.allQuestionsUpdated[indexOfAddedTag].temp_assigned_tags
            if question.hasOwnProperty('tags')
              tagParam =
                id: tag.id
                value: tag.name
              question.tags.push tagParam
            else
              question.tags = []
              tagParam =
                id: tag.id
                value: tag.name
              question.tags.push tagParam
      question.tags = _.uniq(question.tags, 'id')

    # Remove Selected Tags From All Selected Questions
    for tagData in response.tagsRemovedBulk
      removedQuestionIds =  _(tagData.questions_list).pluck('question_id')
      _(@questionsList).forEach (question) =>
        if question.hasOwnProperty('tags') && _(allQuestionsUpdatedIds).contains(question.question_id) && _(removedQuestionIds).contains(question.question_id)
          i=0
          while i < question.tags.length
            if question.tags[i].id == tagData.tag.id
              question.tags.splice(i,1)
              break;
            i++
    @$timeout =>
      @loadingData = false
    , 500


  updateQuestionsListForSme: (response) ->
    @loadingData = true
    allQuestionsUpdatedIds = _(response.allQuestionsUpdated).pluck('question_id')
    # To Remove All SMEs From All Questions
    if response.isRemovedAll
      _(@questionsList).forEach (question) =>
        if question.hasOwnProperty('question_sme') && _(allQuestionsUpdatedIds).contains(question.question_id)
          question.question_sme = []

    # To Remove SME
    for smeRemoveData in response.smesRemoved
      _(@questionsList).forEach (question,index) =>
        for question_data in smeRemoveData.question
          if question.question_id == question_data.question_id && _(allQuestionsUpdatedIds).contains(question.question_id)
            i=0
            while i < question.question_sme.length
              if question.question_sme[i].id == smeRemoveData.sme.id
                question.question_sme.splice(i,1)
                break;
              i++

    # To Add SME In All Selected Questions
    for sme in response.tempAssignedSmesBulk
      _(@questionsList).forEach (question) =>
        if question.hasOwnProperty('question_sme') && _(allQuestionsUpdatedIds).contains(question.question_id)
          smeParam =
            id: sme.id
            value: sme.fullName
          question.question_sme.push smeParam
        else
          if _(allQuestionsUpdatedIds).contains(question.question_id)
            question.question_sme = []
            smeParam =
              id: sme.id
              value: sme.fullName
            question.question_sme.push smeParam
        question.question_sme = _.uniq(question.question_sme, 'id')

    # To Add SMEs
    _(@questionsList).forEach (question) =>
      if _(allQuestionsUpdatedIds).contains(question.question_id)
        indexOfAddedSme = allQuestionsUpdatedIds.indexOf(question.question_id)
        if response.allQuestionsUpdated[indexOfAddedSme].hasOwnProperty('smeIds') && response.allQuestionsUpdated[indexOfAddedSme].smeIds.length > 0
          for sme in response.allQuestionsUpdated[indexOfAddedSme].smeIds
            if question.hasOwnProperty('question_sme')
              smeParam =
                id: sme.id
                value: sme.fullName
              question.question_sme.push smeParam
            else
              question.question_sme = []
              smeParam =
                id: sme.id
                value: sme.fullName
              question.question_sme.push smeParam
        question.question_sme = _.uniq(question.question_sme, 'id')

    # Remove Selected SMEs From All Selected Questions
    for smeData in response.smesRemovedBulk
      removedQuestionIds =  _(smeData.questions_list).pluck('question_id')
      _(@questionsList).forEach (question) =>
        if question.hasOwnProperty('question_sme') && _(allQuestionsUpdatedIds).contains(question.question_id) && _(removedQuestionIds).contains(question.question_id)
          i=0
          while i < question.question_sme.length
            if question.question_sme[i].id == smeData.sme.id
              question.question_sme.splice(i,1)
              break;
            i++
    @$timeout =>
      @loadingData = false
    , 500

  copyResponse: =>
    @toaster.pop 'success', '', 'Answer copied to clipboard',

  extractCopyResponse: (text) =>
    span = document.createElement('span')
    span.innerHTML = text
    return span.textContent or span.innerText

  selectSortCriteriaFilterOption:(type) =>
    @currentSortFilterOptionSelected = type
    @selectSortCriteriaFilter()

  editPreapprovedQuestion: (question_edit)=>
    @ModalFactory.invokeModal 'add_qa_bank_question',
      resolve:
        response: => question_edit
        source: => 'question_detail'
      success: (response) =>
        @loadingData = true
        @searchByFilters()

  generateEntityUrl: (entity)=>
    if entity.associated_entity_type.toLowerCase() == @keywordConstants.Firm.toLowerCase()
      "app/firms/#{entity.entity_id}/question_detail"
    else if entity.associated_entity_type.toLowerCase() == @keywordConstants.Product.toLowerCase()
      "app/funds/#{entity.entity_id}/question_detail"

  generatePageUrl: (questions)=>
    pageUrl = ""
    _(questions).each (question,index)=>
      pageUrl += @generateEntityUrl(question)
      pageUrl += "," if index != questions.length - 1
    pageUrl


  deactivateResponse: (question, index) ->
    @SweetAlert.confirm({
      title: 'Are you sure you want to deactivate this response.'
      confirmButtonText: 'Yes'
      focusCancel: true
    }).then (isConfirm) =>
      if isConfirm.value and isConfirm.value == true
        @loadingData = true
        response_ids = []
        response_ids.push(question.response_id)
        params =
          response_ids: response_ids
          action_type: 'deactivate'
        @Restangular.all('response_actions').post(params).then (response) =>
          @toaster.pop 'success', '', 'This response has been deactivated', 3000
          question.is_active = false
          question.isSelected = false
          @loadingData = false
          @searchByFilters()
        ,(error) => 
          @loadingData = false

  deactivateBulkResponse: () ->
    @SweetAlert.confirm({
      title: 'Are you sure you want to deactivate all selected responses.'
      confirmButtonText: 'Yes'
      focusCancel: true
    }).then (isConfirm) =>
      if isConfirm.value and isConfirm.value == true
        @loadingData = true
        selectedQuestions = []
        for question in @questionsList
          if question.isSelected
            selectedQuestions.push question
        response_ids = _(selectedQuestions).pluck('response_id')
        params =
          response_ids: response_ids
          action_type: 'deactivate'
        @Restangular.all('response_actions').post(params).then (response) =>
          @toaster.pop 'success', '', 'This response has been deactivated', 3000
          for question in selectedQuestions
            question.is_active = false
            question.isSelected = false
            @loadingData = false

  getNotes: (dueDiligenceId, questionId,pageUrl) ->
    @loadingNotes = true
    @DueDiligenceDataservice.getNotes(dueDiligenceId, questionId, 'Question', pageUrl)
      .finally => @loadingNotes = false
      .then (response) =>
        @questionNotes = response

  saveNotes: =>
    return unless @add_notes_form.$valid

    @saving_notes = true
    id = @response.id

    if @new_note.text.length > 0
      mentioned_members_ids = @MentionsFactory.getMentionedIds(@new_note.text, true)
      if mentioned_members_ids.length > 0
        @new_note.mentions = mentioned_members_ids
    pageUrl = @generateEntityUrl(@response)

    notesParams =
      entity_type: 'Duediligence'
      type: 'General'
      entity_id: @response.duediligence_id
      child_entity_id:  @response.question_id
      child_entity_type: 'Question'
      text: @new_note.text
      mentions: @new_note.mentions
    @DueDiligenceDataservice.saveNotes(notesParams,pageUrl).then((response) =>
      message = 'Your notes are added!'
      @questionNotes.unshift response
      @toaster.pop 'success', '', message
      @resetForm()
    )
    .finally(=> @saving_notes = false)

  displayNotesController: (response, parentIdx, idx) ->
    @sidebarTemplate = 'diligence/question/detail/add_notes.html'
    @sidebarTitle = 'Add Notes'
    @sidebarContent = 'notes'
    @displaySidebarPanel = true
    @groupIdx = parentIdx
    @questionIdx = idx

    @new_note = {}
    @target_response = response
    @resetForm()

    dueDiligenceId = response.duediligence_id
    questionId = response.question_id
    pageUrl = @generateEntityUrl(response)

    @getNotes(dueDiligenceId, questionId,pageUrl)
    @response = response

  closeSidebarPanel: =>
    if @$scope.hasOwnProperty('has_unsaved_changes')
      scope_has_unsaved_changes = false
      for key of @$scope.has_unsaved_changes
        if @$scope.has_unsaved_changes.hasOwnProperty(key)
          if @$scope.has_unsaved_changes[key]
            scope_has_unsaved_changes = true
            break
      if scope_has_unsaved_changes
        @SweetAlert.confirm({
          title: "You have unsaved changes on this page"
          text: "All your unsaved changes will be lost if you leave this page"
          cancelButtonText: 'Do Not Save'
          confirmButtonText: 'Save & Exit'
          showLoaderOnConfirm: true
          showCloseButton: true
          reverseButtons: false
          customClass: 'danger-on-cancel'
          preConfirm: =>
            @$rootScope.$broadcast('dv_input_alert:save_changes')
            @$timeout =>
              @displaySidebarPanel = false
            , 1000
        }).then (isConfirm) =>
          if isConfirm.dismiss and isConfirm.dismiss == 'cancel'
            @$rootScope.$broadcast('dv_input_alert:leave_page')
            @$timeout =>
              @displaySidebarPanel = false
              swal.close()

      else
        @displaySidebarPanel = false
    else
      @displaySidebarPanel = false

  resetForm: ->
    @new_note = {}
    @add_notes_form?.$setPristine()
    @add_notes_form?.$setUntouched()

  canEditNote: (note) ->
    note.created_by is @Utils.getCurrentUser().id

  removeNote: (deletedNote) ->
    noteIndex = _(@questionNotes).findIndex (note) ->
      note.id == deletedNote.id
    @questionNotes.splice noteIndex, 1

  filterTeamMembers: (term) =>
    @filteredTeamMembers = @MentionsFactory.getFilteredMembers(term)

  getDisplayName: (user) =>
    @$timeout =>
      if @tinymceEditor
        @tinymceEditor.insertContent('')
    , 300
    return @MentionsFactory.getDisplayName(user, true)

  getViewSimilarQuestionsData: (question) ->
    @viewSimilarQuestionsVisible = true
    @similarQuestionFilterValue = question
    @searchByFilters()

  removeViewSimilarQuestionFilter: () ->
    @similarQuestionFilterValue = null
    @viewSimilarQuestionsVisible = false
    @searchByFilters()


  getLastRefreshedData: () ->
    @Restangular.all('service/es_service/firm_last_updation').post(filters:{}).then (response) =>
      if response.status == 502 || !response.data
        @lastRefreshedAt = null
      else
        @lastRefreshedAt = @Utils.getLocalDateTime(response.data)

  checkIfQADataUpdated: () ->
    @loadingData = true
    @Restangular.all('service/es_service/update_qna').post(filters:{}).then (response) =>
      if response.data
        @toaster.pop 'success', '', "Update Successful"
        @searchByFilters()
        @filters_data_loaded = false
        @search_filters_response.default_filters.length = 0
        @search_filters_response.custom_filter.length = 0
        @getFiltersModalData()
      else
        @toaster.pop 'error', '', 'Update Failed'
        @loadingData = false

  changeSearchByKeyValue: (type)=>
    @searchByKeyValue = type
    if @filters.name
      @applyFilters()

  clearNameFilter: () ->
    @filters.name = ''
    @applyFilters()

  toggleShowAnswers: () ->
    if !@showAnswers
      for question in @questionsList
        question.showAnswer = false
    else
      for question in @questionsList
        question.showAnswer = true

  toggleAnswerForQuestion: (question) ->
    question.showAnswer = !question.showAnswer
