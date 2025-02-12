class RealtimeReportsDetailEditController extends BaseController
  @register 'RealtimeReportsDetailEditController'
  @inject 'ReportTemplateDataservice', '$stateParams'

  initialize: ->
    @getReport(@$stateParams.reportId)

  getReport: (id) =>
    @ReportTemplateDataservice.getReport(id).then (response) =>
      @report = response
      @options =
        entity_id: response.entity_id
        entity_type: response.entity_type
        entity_name: response.name
        parent_entity_id: response.firm_id
