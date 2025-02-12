class ReportsTemplatesDetailPreviewController extends BaseController
  @register 'ReportsTemplatesDetailPreviewController'
  @inject 'ReportTemplateDataservice', '$stateParams', 'FundDataservice', 'FirmDataservice', 'Restangular'

  initialize: ->
    @getTemplate(@$stateParams.templateId)
    @setEntityType("Fund")
    # @Restangular.all('firm_preferences/set_firm_entity_default').customGET().then (response) =>
    #   if response.set_firm_entity_default == @keywordConstants.Firm
    #     @setEntityType("Firm")
    #   else
    #     @setEntityType("Fund")

  setEntityType: (entity_type) ->
    @entity_type = entity_type
    if @entity_type is "Fund"
      @getFunds()
    else
      @getFirms()
    return

  getFirms: ->
    params=
      skip_pagination: true
    @FirmDataservice.getFirms(params).then (response) =>
      @firms = response

  getTemplate: (id) ->
    @ReportTemplateDataservice.getTemplate(id).then (response) =>
      @template = response

  resetSelection: ->
    @options = null
    @selected_entity = {}
    @entity_type = 'Fund'

  getFunds: ->
    @FundDataservice.getFunds().then (response) =>
      @funds = response

  composeOptions: (entity) ->
    @options =
      entity_id: entity.id
      entity_name: entity.name
      entity_type: @entity_type
    if @entity_type is "Fund"
      @options.parent_entity_id = entity.parentFirm.id
    @options
