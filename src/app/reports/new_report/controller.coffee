class NewReportController extends BaseController
  @register 'NewReportController'
  @inject 'ExportDataservice', '$stateParams', 'toaster', '$state',  'Utils','baseUrl','$http','Restangular','$window' , 'ModalFactory', 'FirmDataservice', 'FundDataservice', '$timeout', 'WizardHandler', 'angularEnabled'

  initialize: ->
    @firm_name = @Utils.getCurrentUser().firmInfo.name
    @request = {}
    @getFirmPref()
    @getFunds()
    @minDate = new Date()
    @maxAsOfDate = @Utils.getMaxAsOfDate()
    @step_number = 0
    @getFirms()
    @review_entity_type = "All"
    @newFlowSelected = false
    @selectedOnly = false
    @selected_entities = []
    @completedDiligences = []
    @inner_report_template = []
    @filters_section = {}
    @entityTypesArr = ["Fund", "Firm"]
    @diligence_templates = [
      {
        name: 'Purpose',
        display_name: 'Purpose',
        id: -3
      }
      {
      name: 'Select Report Definition',
      display_name: 'Select Report Definition',
      id: -1
      }
      {
        name: 'Review&Export',
        display_name: "Review&Export",
        id: -2
      }]
    @active_step = @diligence_templates[0]
    @current_page = 0
    @filterBy = ""
    @selection_list = []
    @selected_diligences = []

    @filter = {
      include_custom_review_diligences: false
    }

    @getTemplates()
    @diligences = []
    @combinedData = []
    @alreadyUsedDiligences = []
    @entity_type = "All"
    @customDateFilter = {}
    @formData = {
      include_custom_review_diligences: false
    }
    template_ids = []
    @selected_report_templates = []

  applyMethod: (startDate,endDate)=>
    @diligences = []
    @diligencesCopy = []
    @getDiligences()

  getFirmPref: =>
    @loading_prefs = true
    @Restangular.all('firm_preferences').customGET().then (response) =>
      @customDateFilter = @Utils.getPredefinedDateRanges(response.default_daterange_months)
      @customDateFilter.selectedRange = @Utils.getDateRanges()[response.default_daterange_months].label
      @defaultRange = angular.copy @customDateFilter
      @loading_prefs = false

  setActiveStep: (step) =>
    @active_step = step

  filterDiligencesByTemplate: =>
    @diligences = _(@diligencesCopy).filter (diligence) => diligence.template_id == @active_step.id


  removeSelectedDD: (entry) =>
    index = _(@combinedDiligences).findIndex (diligencesCopy)=>
      diligencesCopy.id == entry.id
    @combinedDiligences.splice index, 1


  getMappings: =>
    @diligences = []
    @diligencesCopy = []
    @diligence_report_templates =  []
    @Restangular.all('reports/new/mappings').customGET().then (response) =>
      @mapping_templates = response
      @request.selected_template = null
      @display_wizard_footer = false

  setEntityType: (entity_type) =>
    @review_entity_type = entity_type
    @filter.diligence_entity = null
    @filterByEntity(entity_type)
    @diligence_funds = @getDiligenceFunds()
    @diligence_firms = @getDiligenceFirms()
    @diligence_strategies = @getDiligenceStrategies()
    @diligence_vehicles = @getDiligenceVehicles()
    @filters_section.show = false

  filterByEntity: (type) =>
    if @active_step_template and @active_step_template.id
      if type == 'Firm'
        @diligences = _(@diligencesCopy).filter (diligence) => diligence.entity_type == "Firm" and diligence.template_id == @active_step_template.id
      else if type == 'Fund'
        @diligences = _(@diligencesCopy).filter (diligence) => diligence.entity_type == "Fund" and diligence.template_id == @active_step_template.id
      else if type == 'Strategy'
        @diligences = _(@diligencesCopy).filter (diligence) => diligence.entity_type == "Strategy" and diligence.template_id == @active_step_template.id
      else if type == 'Vehicle'
        @diligences = _(@diligencesCopy).filter (diligence) => diligence.entity_type == "Vehicle" and diligence.template_id == @active_step_template.id
      else if type == "Custom" || type == "Review"
        @diligences = _(@diligencesCopy).filter (diligence) => diligence.entity_type == "Review" and diligence.template_id == @active_step_template.id
      else if type == "All"
        @diligences = _(@diligencesCopy).filter (diligence) => diligence.id and diligence.template_id == @active_step_template.id

  addProject: =>
    if @add_new_report.$valid
      @ModalFactory.invokeModal 'add_report_project',
        resolve:
          user_template: => @filter.selected_template
          report_name: => @filter.report_name

  shouldFooterBeVisible: =>
    if @diligences and @diligences.length
      @display_wizard_footer = true
    else
      @display_wizard_footer = false

  getDiligenceFunds: ->
    if @active_step_template and @active_step_template.id
      arr = []
      dupes = []
      for diligence in @diligences
        if diligence.entity_type == 'Fund' and diligence.template_id == @active_step_template.id and dupes.indexOf(diligence.entity_id) == -1
          arr.push diligence
          dupes.push diligence.entity_id
      arr

  getDiligenceStrategies: () ->
    if @active_step_template and @active_step_template.id
      arr = []
      dupes = []
      for diligence in @diligences
        if diligence.entity_type == 'Strategy' and diligence.template_id == @active_step_template.id and dupes.indexOf(diligence.entity_id) == -1
          arr.push diligence
          dupes.push diligence.entity_id
      arr

  getDiligenceVehicles: () ->
    if @active_step_template and @active_step_template.id
      arr = []
      dupes = []
      for diligence in @diligences
        if diligence.entity_type == 'Vehicle' and diligence.template_id == @active_step_template.id and dupes.indexOf(diligence.entity_id) == -1
          arr.push diligence
          dupes.push diligence.entity_id
      arr

  getDiligenceFirms: ->
    if @active_step_template and @active_step_template.id
      arr = []
      dupes = []
      for diligence in @diligences
        if diligence.entity_type == 'Firm' and diligence.template_id == @active_step_template.id and dupes.indexOf(diligence.entity_id) == -1
          arr.push diligence
          dupes.push diligence.entity_id
      arr

  getDiligenceTemplates: (frequencyArr) ->
    arr = []
    dupes = []
    # existing = _(@diligence_report_templates).pluck 'id'
    count = 1
    for diligence,idx in @diligences
      for frequencyObj in frequencyArr
        if dupes.indexOf(diligence.template_id) == -1 && diligence.template_id == frequencyObj.template_id
          displayName = "Select Project - Step " + count
          count++
          arr.push {id: diligence.template_id, name: diligence.template_name, frequency: frequencyObj.frequency, display_name: displayName}
          dupes.push diligence.template_id
    arr

  filterDiligences: (value, type) =>
    if (type == "Fund" or type == "Firm" or type == "Vehicle" or type == "Strategy") and (@active_step_template and @active_step_template.id)
      @diligences = _(@diligencesCopy).filter (diligence) => diligence.entity_id == value.entity_id and diligence.template_id == @active_step_template.id

  resetDiligences: =>
    @filter.diligence_template = {}
    @filter.diligence_entity = {}
    @diligences = angular.copy @diligencesCopy

  toggleFiltersSection: =>
    @filters_section.show = !@filters_section.show

  getDiligences: =>
    @request.selected_template.stepController = @request.selected_template.id
    @selected_report_templates = JSON.parse(@request.selected_template.template_details).template_details
    params = {}
    params.template_ids = _(@selected_report_templates).pluck 'template_id'
    params.start_date = null
    params.end_date = null
    if @customDateFilter.selectedRange != 'No Filter'
      params.start_date = @Utils.formatDatetime(@customDateFilter.startDate)
      params.end_date = @Utils.formatDatetime(@customDateFilter.endDate)
      @request.selected_template.stepController = @request.selected_template.id + params.start_date + params.end_date

    params.include_custom_review_diligences = true
    @show_review_step = false
    @request.selected_diligence = {}
    @diligence_report_templates = []
    @diligences = []
    @diligencesCopy = []
    @display_wizard_footer = false
    @show_dilignece_zero_text = false
    @Restangular.all('diligences/GetByTemplate').post(params).then (response) =>
      @diligences = response
      if @diligences.length
        @display_wizard_footer = true
      else
        @show_dilignece_zero_text = true

      @diligencesCopy = angular.copy response
      @originalDiligencesResponse = angular.copy response
      @diligence_report_templates = @getDiligenceTemplates(@selected_report_templates)
      if @diligence_report_templates and @diligence_report_templates.length
        for row in @diligence_report_templates
          row.selection_list = []


  markSelection: (diligences) ->
    ids = _(@selection_list).pluck('id')

    _(diligences).filter (diligence) ->
      diligence.is_selected = _(ids).contains(diligence.id)

  clearEntityFilter: =>
    @filter.diligence_entity = null
    @setEntityType(@review_entity_type)

  selectAll: ->
    _(@diligences).each (diligence) =>
      @addToSelection(diligence)

    @select_all_entities = false
    @disable_select_all = true

  entryExists: (step)=>
    ids = _(@diligence_report_templates).pluck 'id'
    if ids.length > 0 and ids.indexOf(step) > -1
      return true
    else
      return false

  projectsSelectionBeforeEnter: (template, index) =>
    @active_step_template = template
    @filterByEntity(@review_entity_type)
    @diligence_funds = @getDiligenceFunds()
    @diligence_firms = @getDiligenceFirms()
    @diligence_strategies = @getDiligenceStrategies()
    @diligence_vehicles = @getDiligenceVehicles()
    @filter.diligence_entity = null

  reviewIsAlive: (step)=>
    if @request.selected_template
      @show_review_step and Number(step) == @request.selected_template.id

  addToSelection: (entry, diligence) ->
    if @diligence_report_templates[entry.rowIndex].selection_list.length >= entry.frequency
      @toaster.pop 'error', '', 'Maximum limit reached'
      return
    ids = _(@diligence_report_templates[entry.rowIndex].selection_list).pluck('id')
    unless _(ids).contains(diligence.id)
      diligence.is_selected = true
      @diligence_report_templates[entry.rowIndex].selection_list.push diligence

  removeFromSelection: (entry, diligence) ->
    @setEntityType(diligence.entity_type)
    @$timeout =>
      @handleDeselection([diligence])
      entry.selection_list.splice(entry.selection_list.indexOf(diligence), 1)

  combineSelectedDiligences: =>
    @combinedDiligences = []
    for entry in @diligence_report_templates
      for diligence in entry.selection_list
        @combinedDiligences.push diligence


  clearSelectionList: (entry) ->
    @handleDeselection(entry.selection_list)
    entry.selection_list.length = 0
    @disable_select_all = false

  handleDeselection: (diligences) ->
    _(diligences).each (diligence) =>
      diligence_from_main_list = _(@diligences).findWhere(id: diligence.id)

      diligence_from_main_list.is_selected = false if diligence_from_main_list

    @select_all_entities = false

  goToFirstStep: =>
    @newFlowSelected = true


  startNewReport: =>
    @getMappings()
    wizard = @WizardHandler.getWizard('new-reporting-flow')
    @request.DDTypeDisplayName = 'Review Diligence'
    wizard.goToNextStep()
    wizard.setFooterVisibility true

  isNewFlowSelected: =>
    @newFlowSelected

  exportReport: =>
    if !@report_name
      @toaster.pop 'error', '', 'Please Enter Report Name'
      return
    if @combinedDiligences.length
      params = {}
      params.document_id = @request.selected_template.id
      params.name = @report_name
      params.as_of_date = if @as_of_date then new Date(@as_of_date) else null
      params.diligence_ids = _(@combinedDiligences).pluck 'id'
      @loading = true
      @Restangular.all('reports/new/generate').post(params).then ((response) =>
        @toaster.pop 'success', '', 'Report exported successfully'
        @loading = false
        @showSecondPannel = false
        @filter = {}
        @diligence = []
        @$state.go 'app.reports.realtime-reports.list'
      ), (error) =>
        @loading = false
    else
      message = 'Please select at least one project!'
      @toaster.pop 'error', '', message


  cancelAddProject: =>
    @showSecondPannel = false
    @filter = {}
    @diligences = []

  getFunds: ->
    @FundDataservice.getFunds().then (response) =>
      @funds = response

  getFirms: ->
    @FirmDataservice.getFirms().then (response) =>
      @firms = response.results

  getTemplates: ->
    @ExportDataservice.getTemplates().then (response) =>
      @templates = response

  composeOptions: =>
    @options =
      template_id: @selected_template.id

  goBack: =>
    @$window.history.back()

  resetFilter: ->
    @filter = {}

  canProceedToNextProjectStep: (template) =>
    template.diligences = @selection_list
    @selection_list = []
    return true

  canProceedToReviewOpinionDiligenceNext: =>
    selectedDiligences = []
    can_proceed = false
    for entry in @diligence_report_templates
      for diligence in entry.selection_list
        selectedDiligences.push diligence
    if selectedDiligences.length > 0
      can_proceed = true
    if !can_proceed
      message = 'Please select at least one project!'
      @toaster.pop 'error', '', message
    can_proceed
