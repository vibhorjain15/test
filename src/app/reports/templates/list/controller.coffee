class ReportTemplatesListController extends BaseController
  @register 'ReportTemplatesListController'
  @inject 'ReportTemplateDataservice', '$state', '$scope', '$timeout'

  initialize: ->
    @getTemplates()
    @$scope.$on 'refresh_sidebar', (event, template_id) =>
      @getTemplates(template_id)

  getTemplates: (template_id)->
    @ReportTemplateDataservice.getTemplates({include_new_reports: true}).then (response) =>
      @templates = response
      if response.length
        if template_id
          selectedTemplate = _(response).findWhere({id: template_id})
          tempId = template_id
        else
          selectedTemplate = response[0]
          tempId = response[0].id
        @ReportTemplateDataservice.setReportTemplate(selectedTemplate)
        @$timeout =>
          @$state.go 'app.reports.templates.list.preview', {
            templateId: selectedTemplate.id, is_new_report: selectedTemplate.is_new_report
          }

  redirectToTemplate: (template) =>
    @ReportTemplateDataservice.setReportTemplate(template)
    @$state.go 'app.reports.templates.list.preview', {
      templateId: template.id
    }

  redirectToNewTemplate: ->
    @$state.go 'app.reports.templates.new'
