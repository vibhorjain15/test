class WorkflowAutomationListController extends BaseController

  @register 'WorkflowAutomationListController'

  @inject 'WorkflowAuditResource'

  initialize: ->
    @audits = @WorkflowAuditResource.$new()


