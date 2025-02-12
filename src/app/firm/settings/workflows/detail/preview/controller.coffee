class ReportsTemplatesDetailPreviewController extends BaseController
  @register 'WorkflowsDetailPreviewController'
  @inject '$stateParams','$scope'

  initialize: ->
    @workflowId = @$stateParams.workflowId
