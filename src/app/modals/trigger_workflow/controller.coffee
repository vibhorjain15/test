class TriggerWorkflowController extends ModalController

  @register 'TriggerWorkflowController'

  @inject '$uibModalInstance', 'toaster', 'Restangular', 'workflow', '$state','ModalFactory','pageUrl','RestangularHeaderService'

  initialize: ->
    @RestangularHeaderService.RestangularWithHeader(@pageUrl).all('workflows').customGET('',{entity_type: @workflow.entity_type}).then (response) =>
      @workflows = response
    @selectedWorkflowId = null

  redirectToWorkflowDefinitions: ->
    param = {
      name: null
      entity_type: @workflow.entity_type
      entity_sub_type: null
    }
    @ModalFactory.invokeModal 'manage_workflow',
      resolve:
        edit_mode: false
        workflow: => param
    @$uibModalInstance.dismiss @params

  save: =>
    if @workflow_form.$valid
      @$state.go 'app.workflow_automation.preview', {Id: @selectedWorkflowId,entity_type:@workflow.entity_type,entity_id:@workflow.entity_id}
      @close()
        