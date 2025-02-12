class RealtimeReportsNewController extends BaseController
  @register 'RealtimeReportsNewController'
  @inject 'ReportTemplateDataservice', '$stateParams', 'FundDataservice', 'toaster', '$state', 'RbComponentFactory', 'Utils', 'FirmDataservice', 'Restangular', 'keywordConstants'

  initialize: ->
    @asofDate = new Date()
    @maxAsOfDate = @Utils.getMaxAsOfDate()
    @entity_type = null
    @selected_entity = {}
    @diligence_templates = [
      {
        name: "Purpose"
        done: true
        id: -3
      }
      {
        name: "Create Report"
        id: -3
      }
    ]
    @active_step = @diligence_templates[1]
    @getTemplates()
    @Restangular.all('firm_preferences/set_firm_entity_default').customGET().then (response) =>
      if response.set_firm_entity_default and response.set_firm_entity_default.toLowerCase() == @keywordConstants.Firm.toLowerCase()
        @setEntityType("Firm")
      else
        @setEntityType("Fund")


  setEntityType: (entity_type) ->
    @entity_type = entity_type
    if @entity_type is "Fund"
      @getFunds()
    else
      @getFirms()
    return

  resetSelection: ->
    @selected_template = {}
    @selected_entity = {}
    @asofDate = new Date()
    @entity_type = 'Fund'

  getFirms: ->
    params =
      skip_pagination: true
    @FirmDataservice.getFirms(params).then (response) =>
      @firms = response

  getFunds: ->
    @FundDataservice.getFunds().then (response) =>
      @funds = response


  getTemplates: ->
    @ReportTemplateDataservice.getTemplates().then (response) =>
      @templates = response


  composeOptions: =>
    @options =
      entity_id: @selected_entity.id
      entity_type: @entity_type
      entity_name: @selected_entity.name
      as_of_date: moment(@asofDate).format("DD-MMMM-YYYY")
    if @entity_type.toLowerCase() == @keywordConstants.Product.toLowerCase()
      @options.parent_entity_id = @selected_entity.parentFirm.id

  generatePageUrl: =>
    pageUrl = ""
    if @entity_type.toLowerCase() == @keywordConstants.Firm.toLowerCase()
      pageUrl = "app/firms/#{@selected_entity.id}/realtime-reports"
    else if @entity_type.toLowerCase() == @keywordConstants.Product.toLowerCase()
      pageUrl = "app/firms/#{@selected_entity.parentFirm.id}/funds/#{@selected_entity.id}/realtime-reports"
    pageUrl

  generateReport: =>
    if @selected_entity.id and @selected_template.id
      pages = @selected_template.definition.split('*|dv:page_break|*')

      pages = _(pages).map (page_tpl) =>
        components = @RbComponentFactory.parseTemplate(page_tpl)
        _(components).each((component, idx) =>
          if component.type == 'text'
            component.options.content = @Utils.supplant(component.options.content, @options)
        )
        { components: components }

      pages = _(pages).map (page) =>
        @RbComponentFactory.formatComponents(page.components)
      merge_tag_template = pages.join('*|dv:page_break|*')

      params =
        name: @selected_entity.name + " Report"
        report_template_id: @selected_template.id
        entity_id: @selected_entity.id
        entity_type: @entity_type
        as_of_date: moment(@asofDate).format("DD-MMMM-YYYY")
        definition: merge_tag_template

      @toaster.pop 'wait', '', 'Generating Report...', 500000

      pageUrl = @generatePageUrl()
      @ReportTemplateDataservice.createReport(params,pageUrl).then((response) =>
        @$state.go 'app.reports.realtime-reports.detail.edit', {
          reportId: response.id
        }
      ).finally(=>
        @toaster.clear()
      )
