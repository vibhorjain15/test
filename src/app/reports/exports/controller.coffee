class ExportsController extends BaseController
  @register 'ExportsController'
  @inject 'ExportDataservice', '$stateParams', 'toaster', '$state',  'Utils','baseUrl','$http','Restangular','$window', 'FILTER_TERNARY_OPERATORS', 'ReportTypes', 'ModalFactory', 'TemplatesDataService', 'FirmDataservice', '$q', 'angularEnabled'

  initialize: ->
    @current_user = @Utils.getCurrentUser()
    @isManager = @Utils.isManager()
    @currentFirmId = @current_user.firmInfo.id
    @firm_name = @Utils.getCurrentUser().firmInfo.name
    @selected_type = @ReportTypes.TEMPLATE
    @selectedQuestions = []
    @searchText = ""
    @manager_ids = []
    @entities = [
      {name: "Firm"}
      {name: "Product"}
      {name: "Strategy"}
      {name: "Vehicle"}
    ]
    # @searchByKeyValue = @entities[0]
    @selected_entity_type = @entities[0]
    @global_ternary_operator = @FILTER_TERNARY_OPERATORS.AND

    # @minDate = moment().subtract(15,'months').toDate()
    # @maxDate = new Date()

    # @quarterStartDate = moment().subtract(6,'months').toDate()
    # @endDate = new Date()
    @getFirmPref()
    @selectedOnly = false
    @selected_entities_combined = []
    @selected_entities = []
    @completedDiligences = []
    @current_page = 0
    @filterBy = ""
    @selection_list = []
    @showAdvanceOptions = false



    @filter = {
      selected_template: ""
    }

    @include_responses_excel_export = false
    @include_comments_excel_export = false
    @include_ratings_excel_export = false
    @include_scores_excel_export = false
    @split_comments = false
    @include_internal_key = false
    @transpose_excel_columns = false
    @include_flags_excel_export = false
    @TemplatesDataService.getResponseTypes().then (responseTypes) =>
      @responseTypes = responseTypes

    @getTemplates()
    promises = []
    promises.push @getFirms()
    @$q.all(promises).then(=> @loading = false)
    if @isManager
      @$window.history.back()
      return
      
  onTypeChange: (type) =>
    @selected_type = type

  applyMethod: (startDate,endDate)=>
    @onFilterChange()

  getFirms: =>
    params =
      include_contacts: false,
      include_custom_fields: false,
      include_dates: true,
      is_active: true,
      filters: {}
    @loading = true
    @Restangular.all('service/dvapi_service/firm_search').post(params).then (response) =>
      @firms = response.data

  getStrategies: =>
    params =
      filters: {}
      include_contacts: false
      include_custom_fields: true
      include_dates: true
      search_for: "strategy"
    @Restangular.all('service/dvapi_service/product_search').post(params).then (response) =>
      @strategies = response.data

  changeEntityType: (type)=>
    if @selected_entities.length
      combined_ids = _(@selected_entities_combined).pluck "id"
      for entity in @selected_entities
        entity.type = @selected_entity_type.name
        if combined_ids.indexOf(parseInt entity.id) == -1 and @selectedQuestions.length
          @selected_entities_combined.push entity
      @selected_entities = []
    @selected_entity_type = type


  removeSelectedEntity: (entry) =>
    index = _(@selected_entities_combined).findIndex (entity)=>
      entity.id == entry.id
    @selected_entities_combined.splice index, 1

  clearEntityFilters: =>
    @selected_entities_combined = []

  formatTemplatesTooltip: (entity) =>
    templatesCopy = angular.copy entity.templates
    templatesNames = _(templatesCopy).pluck "template_name"
    templatesNames = _(templatesNames).join(', ')
    templatesNames

  addEntities: =>
    if @selected_entities.length and @selectedQuestions.length
      combined_ids = _(@selected_entities_combined).pluck "id"
      for entity in @selected_entities
        entity.type = @selected_entity_type.name
        if combined_ids.indexOf(parseInt entity.id) == -1
          @selected_entities_combined.push entity
      @selected_entities = []

  getFirmPref: =>
    @loading_prefs = true
    @Restangular.all('firm_preferences').customGET().then (response) =>
      @customDateFilter = @Utils.getPredefinedDateRanges(response.default_daterange_months)
      @customDateFilter.selectedRange = @Utils.getDateRanges()[response.default_daterange_months].label
      @defaultRange = angular.copy @customDateFilter
      @loading_prefs = false
      @include_responses_excel_export = response.include_responses_excel_export
      @include_comments_excel_export = response.include_comments_excel_export
      @include_ratings_excel_export = response.include_ratings_excel_export
      @include_scores_excel_export = response.include_scores_excel_export
      @split_comments = response.split_comments
      @include_internal_key = response.include_internal_key
      @transpose_excel_columns = response.transpose_excel_columns
      @include_flags_excel_export = response.include_flags_excel_export

  getTemplates: ->
    @ExportDataservice.getTemplates().then (response) =>
      @templates = response

  composeOptions: =>
    @options =
      template_id: @selected_template.id

  validateFilters: =>
    validity = true
    if !@filter.selected_template
      @toaster.pop 'error', 'Error', 'Please select a Template'
      validity = false

    validity

  openQuestionSelectionModal: =>
    @ModalFactory.invokeModal 'manage_question_selection',
      resolve:
        selectedQuestions : => angular.copy @selectedQuestions
      success: (questions) =>
        @selectedQuestions = questions



  validateProjects: =>
    validity = true
    if @selectedOnly && @selection_list.length < 1
      @toaster.pop 'error', 'Error', 'Please select projects'
      validity = false
    validity

  generateReport: =>
    if @selected_type == @ReportTypes.TEMPLATE
      if(@validateFilters() && @validateProjects())
        params =
          template_id: @filter.selected_template.id
          template_name: @filter.selected_template.name
          firm_name: @firm_name
          include_responses_excel_export: @include_responses_excel_export
          include_comments_excel_export: @include_comments_excel_export
          include_ratings_excel_export: @include_ratings_excel_export
          include_scores_excel_export: @include_scores_excel_export
          split_comments: @split_comments
          include_internal_key: @include_internal_key
          transpose_excel_columns: @transpose_excel_columns
          include_flags_excel_export: @include_flags_excel_export

        if @customDateFilter.selectedRange == 'No Filter'
          params.start_date = null
          params.end_date   = null
        else
          params.start_date = @Utils.formatDatetime(@customDateFilter.startDate)
          params.end_date = @Utils.formatDatetime(@customDateFilter.endDate)

        if @selectedOnly
          params.diligence_ids = _(@selection_list).pluck('id').toString()

        @toaster.pop 'info', 'Wait', 'Request being processed. You will receive an email with the excel report'

        @ExportDataservice.createReport(params).then((response) =>
          @toaster.clear()
          @toaster.pop 'success', 'Success', 'Request processed successfully. Please check your email for the report', 3000
        ).finally(=>
          # @toaster.clear()
        )
    else
      if !@selectedQuestions.length
        @toaster.pop 'error', 'error', 'Please select atleast one question'
        return
      selectedQuestionGroup = _(@selectedQuestions).filter (entry) => entry.is_selected
      if !selectedQuestionGroup.length
        @toaster.pop 'error', 'error', 'Please select atleast one question'
        return
      selected_question_ids = []
      for quesGroup in selectedQuestionGroup
        for quesId in quesGroup.questions_ids
          selected_question_ids.push quesId
      @firm_ids = []
      @vehicle_ids = []
      @product_ids = []
      @strategy_ids = []
      if @selected_entities_combined.length
        for entity in @selected_entities_combined
          if entity.type == "Firm"
            @firm_ids.push entity
          else if entity.type == "Product"
            @product_ids.push entity
          else if entity.type == "Vehicle"
            @vehicle_ids.push entity
          else if entity.type == "Strategy"
            @strategy_ids.push entity

      params =
        firm_name: @firm_name
        firm_id: @currentFirmId
        recipients: @current_user.userName
        question_ids: selected_question_ids
        manager_ids: if @manager_ids.length then _(@manager_ids).pluck "id" else []
        # Below code will  be used in future
        # firm_ids: if @firm_ids.length then _(@firm_ids).pluck "id" else []
        # product_ids: if @product_ids.length then _(@product_ids).pluck "id" else []
        # vehicle_ids: if @vehicle_ids.length then _(@vehicle_ids).pluck "id" else []
        # strategy_ids: if @strategy_ids.length then _(@strategy_ids).pluck "id" else []
      if @customDateFilter.selectedRange == 'No Filter'
        params.start_date = null
        params.end_date   = null
      else
        params.start_date = @Utils.formatDatetime(@customDateFilter.startDate)
        params.end_date = @Utils.formatDatetime(@customDateFilter.endDate)
      @toaster.pop 'info', 'Wait', 'Request being processed. You will receive an email with the excel report' , 3000
      @Restangular.all("service/excel_services/diligence_question_report").post(params).then =>
        @toaster.pop 'success', 'Success', 'Request processed successfully. Please check your email for the report', 3000

  onFilterChange: ()->
    if @selectedOnly
      @getAllCompletedDiligences()
      @clearSelection()
      @filterBy = ""

  getResponseTypeById:(id) =>
    response_type = {}
    for response in @responseTypes
      if response.id == id
        response_type = response
    response_type

  getAllCompletedDiligences: () =>
    if @validateFilters()
      @is_loading = true
      params = {
        template_id: @filter.selected_template.id
      }

      if @customDateFilter.selectedRange == 'No Filter'
        params.start_date = null
        params.end_date   = null
      else
        params.start_date = @Utils.formatDatetime(@customDateFilter.startDate)
        params.end_date = @Utils.formatDatetime(@customDateFilter.endDate)

      @Restangular.all('Excel_report_diligences').customGET('', params).then (response) =>
        @completedDiligences = response
        @is_loading = false
        @markSelection(@completedDiligences)

  onSelectionChange: (selection) ->
    if selection
      @getAllCompletedDiligences()
    else
      @clearSelection()
      @filterBy = ""

  markSelection: (diligences) ->
    ids = _(@selection_list).pluck('id')

    _(diligences).filter (diligence) ->
      diligence.is_selected = _(ids).contains(diligence.id)

  selectAll: ->
    _(@completedDiligences).each (diligence) =>
      @addToSelection(diligence)

    @select_all_entities = false
    @disable_select_all = true

  addToSelection: (diligence) ->
    ids = _(@selection_list).pluck('id')
    unless _(ids).contains(diligence.id)
      diligence.is_selected = true
      @selection_list.push(diligence)

  removeFromSelection: (diligence) ->
    @handleDeselection([diligence])
    @selection_list.splice(@selection_list.indexOf(diligence), 1)

  clearSelection: ->
    @handleDeselection(@selection_list)
    @selection_list.length = 0
    @disable_select_all = false

  handleDeselection: (diligences) ->
    _(diligences).each (diligence) =>
      diligence_from_main_list = _(@completedDiligences).findWhere(id: diligence.id)

      diligence_from_main_list.is_selected = false if diligence_from_main_list

    @select_all_entities = false

  goBack: =>
    @$window.history.back()

  filterFirms: (query) =>
    return @firms unless query
    regex = new RegExp(query, 'i')
    _(@firms).filter((firm) -> regex.test(firm.name))

  resetFilter: ->
    @customDateFilter = angular.copy @defaultRange
    @filter = {
      selected_template: ""
    }
    @searchText = ""
    @filterBy = ""
    @selectedOnly = false
    @selectedQuestions = []
    @manager_ids = []
    @completedDiligences.length = 0
    @clearSelection()
    @clearEntityFilters()
