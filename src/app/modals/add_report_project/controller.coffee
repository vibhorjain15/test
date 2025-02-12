class AddReportProjectController extends ModalController
  @register 'AddReportProjectController'

  @inject '$uibModalInstance', 'toaster', 'Restangular', '$state', '$timeout', 'FundDataservice', 'FirmDataservice', '$scope', 'Utils'

  initialize: ->
    @report_name = ""
    @user_template = null
    @strategyObj = []
    @diligences = []
    @combinedData = []
    @alreadyUsedDiligences = []
    @entity_type = "Fund"
    @selected_templates = []
    @customDateFilter = {}
    @formData = {
      include_custom_review_diligences: false
    }
    @getFunds()
    @getFirms()
    @getMappings()
    template_ids = []
    @selected_report_templates = []
    @Restangular.all('firm_preferences').customGET().then (response) =>
      @customDateFilter = @Utils.getPredefinedDateRanges(response.default_daterange_months)
      @customDateFilter.selectedRange = @Utils.getDateRanges()[response.default_daterange_months].label

  isTemplateAndEntitySelected: =>
    if !@formData.selected_entities
      @toaster.pop 'error', '', 'Please select Product or Firm'
      return false
    if !@formData.selected_templates
      @toaster.pop 'error', '', 'Please select Templates'
      return false
    return true

  getInnerReportTemplates: =>
    template_ids = []
    if @user_template
      @selected_report_templates = JSON.parse(@user_template.template_details).template_details
      for template in @selected_report_templates
        template_ids.push template.template_id
      params = {}
      params.template_ids = template_ids
      @Restangular.all('templates/details').post(params).then (response) =>
        @selected_templates = response

  getMappings: =>
    @Restangular.all('reports/new/mappings').customGET().then (response) =>
      @mapping_templates = response

  applyMethod: (startDate,endDate)=>
    @getDiligences()

  resetTemplate: =>
    @formData.selected_template = {}

  getTemplateUsageCount: (template) ->
    count = 0
    for entry in @combinedData
      if entry.template_id == template.id
        count += 1
    count

  isTemplateFrequencyValid: (template) ->
    usage_count = @getTemplateUsageCount(template)
    valid = true
    for report_temp in @selected_report_templates
      if report_temp.template_id == template.id and usage_count >= report_temp.frequency
        valid = false
    valid

  getDiligences: =>
    if !@formData.selected_entity || !@formData.selected_entity.id
      return
    if !@formData.selected_template || !@formData.selected_template.id
      return
    params = {}
    params.entity_ids = [@formData.selected_entity.id]
    params.template_ids = [@formData.selected_template.id]
    params.start_date = null
    params.end_date = null
    params.entity_type = @entity_type
    if @customDateFilter.selectedRange != 'No Filter'
      params.start_date = @Utils.formatDatetime(@customDateFilter.startDate)
      params.end_date = @Utils.formatDatetime(@customDateFilter.endDate)

    params.include_custom_review_diligences = @formData.include_custom_review_diligences
    @formData.selected_diligence = {}
    @Restangular.all('diligences/GetByEntityAndTemplate').post(params).then (response) =>
      @diligences = response


  getFunds: ->
    @FundDataservice.getFunds().then (response) =>
      @funds = response

  getFirms: ->
    @FirmDataservice.getFirms().then (response) =>
      @firms = response.results

  filterFunds: (query) =>
    return @funds unless query
    regex = new RegExp(query, 'i')
    _(@funds).filter((fund) -> regex.test(fund.display_name))

  filterFirms: (query) =>
    return @firms unless query
    regex = new RegExp(query, 'i')
    _(@firms).filter((fund) -> regex.test(fund.display_name))

  filterTemplates: (query) =>
    return @selected_templates unless query
    regex = new RegExp(query, 'i')
    _(@selected_templates).filter((template) -> regex.test(template.name))

  filterDiligences: (query) =>
    return @diligences unless query
    regex = new RegExp(query, 'i')
    _(@diligences).filter((diligence) -> regex.test(diligence.name))

  getMaxArray: (diligences, entities, templates) ->
    maxValArray = ""
    max_val = 0
    if diligences.length >= entities.length
      maxValArray = "selected_diligences"
      max_val = diligences.length
    else
      maxValArray = "selected_entities"
      max_val = entities.length
    if templates.length >= max_val
      maxValArray = "selected_templates"
      max_val = templates.length
    maxValArray

  removeSelectedEntry: (entity, idx) =>
    index = _.findIndex(@combinedData, (item) ->
      item.diligence_id == entity.diligence_id
    )
    @combinedData.splice(index, 1)
    if @alreadyUsedDiligences.indexOf(entity.diligence_id) > -1
      @alreadyUsedDiligences.splice(@alreadyUsedDiligences.indexOf(entity.diligence_id), 1)


  setEntityType: (entity_type) =>
    @entity_type = entity_type
    @formData = {}

  compileData: =>
    if !@formData.selected_entity || !@formData.selected_entity.id
      return
    if !@formData.selected_template || !@formData.selected_template.id
      return
    if !@formData.selected_diligence || !@formData.selected_diligence.id
      return
    if @alreadyUsedDiligences.indexOf(@formData.selected_diligence.id) > -1
      @toaster.pop 'error', '', 'This diligence has already been added'
      return
    if !@isTemplateFrequencyValid(@formData.selected_template)
      @toaster.pop 'error', '', 'Selected template has reached max usage frequency'
      return
    combinedObj = {}
    combinedObj.entity_type = @entity_type
    combinedObj.entity_id = @formData.selected_entity.id
    combinedObj.entity_name = @formData.selected_entity.name
    combinedObj.template_id = @formData.selected_template.id
    combinedObj.template_name = @formData.selected_template.name
    combinedObj.diligence_id = @formData.selected_diligence.id
    combinedObj.diligence_name = @formData.selected_diligence.name
    @combinedData.push combinedObj
    @alreadyUsedDiligences.push @formData.selected_diligence.id
    @diligences = _(@diligences).filter (dd) ->
      dd.id != @formData.selected_diligence.id
    @$timeout =>
      @formData = {}


  submit: =>
    if @combinedData.length
      params = {}
      params.document_id = @user_template.document_id
      params.name = @report_name
      params.diligence_ids = _(@combinedData).pluck 'diligence_id'
      @loading = true
      @Restangular.all('reports/new/generate').post(params).then ((response) =>
        @toaster.pop 'success', '', 'Report exported successfully'
        @close()
      ), (error) =>
        @loading = false
