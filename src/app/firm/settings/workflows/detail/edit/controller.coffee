class WorkflowsDetailEditController extends BaseController
  @register 'WorkflowsDetailEditController'
  @inject '$stateParams'

  initialize: ->
    @workflowId = @$stateParams.workflowId