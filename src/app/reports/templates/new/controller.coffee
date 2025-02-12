class ReportsTemplatesNewController extends BaseController
  @register 'ReportsTemplatesNewController'
  @inject '$state', 'ReportTemplateDataservice', 'toaster'

  initialize: ->
    @createReportTemplate()

  createReportTemplate: (type, size='portrait') ->
    template = @ReportTemplateDataservice.newTemplate()

    @toaster.pop 'wait', '', 'Creating...', 500000

    @ReportTemplateDataservice.create(template).then((response) =>
      @$state.go 'app.reports.templates.detail.edit', {
        templateId: response.id
      }
    ).finally(=>
      @toaster.clear()
    )
