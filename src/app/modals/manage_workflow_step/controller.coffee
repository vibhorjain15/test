class ManageWorkflowStepController extends ModalController
  @register 'ManageWorkflowStepController'

  @inject 'Restangular', '$q', 'toaster', 'SweetAlert','step','edit_mode','workflowId','allSteps'

  initialize: ->
    useStepBuilder = false
    @steps = []

  save: =>
    @workflow_step_form.$setSubmitted true
    return if @workflow_step_form.$invalid

    if @useStepBuilder
      @saveStepsInbulk()
      return

    @saving = true
    if @edit_mode
      params = _(@step).pick('name','description','workflow_id','id','order','destination_index')
      @Restangular.one('workflows',@workflowId).one('workflow_steps',@step.id).customPUT(params).then (response) =>
        @toaster.pop 'success','','Workflow Step updated successfully'
        @close(response)
      .finally => @saving = false
    else
      @Restangular.one('workflows',@workflowId).all('workflow_steps').post(@step).then (response) =>
        @toaster.pop 'success','','Workflow Step added successfully'
        @close([response])
      .finally => @saving = false

  saveStepsInbulk: =>
    @saving = true
    @Restangular.one('workflows',@workflowId).all('workflow_steps').customPOST(@steps,'bulk_workflow_steps').then (response) =>
      @toaster.pop 'success','','Workflow Steps added successfully'
      @close(response)
    .finally => @saving = false
