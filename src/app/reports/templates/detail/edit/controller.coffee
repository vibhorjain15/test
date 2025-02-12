class ReportsTemplatesDetailEditController extends BaseController
  @register 'ReportsTemplatesDetailEditController'
  @inject 'ReportTemplateDataservice', '$stateParams'

  initialize: ->
    @getTemplate(@$stateParams.templateId)

  getTemplate: (id) ->
    @ReportTemplateDataservice.getTemplate(id).then (response) =>
      @template = response
