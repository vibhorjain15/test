class WorkflowsDetailController extends BaseController
  @register 'WorkflowsDetailController'
  @inject '$stateParams','Restangular','BaseDataService','SweetAlert','toaster','$state','ModalFactory','Utils','keywordConstants','angularEnabled','$scope'

  initialize: ->
    @workflowId = @$stateParams.workflowId
    @is_manager = @Utils.isManager()
    @getWorkflow(@workflowId)

  getDocumentTypes: () =>
    @BaseDataService.getAttachmentTypes().then (response) =>
      @document_types = response
      @getEntitySubType()

  getEntitySubType:=>
    if @workflow.entity_type == 'Document' and @workflow.entity_sub_type != 0
      index = _(@document_types).findIndex ((document)=>
        document.id == @workflow.entity_sub_type
      )
      @workflow.entity_sub_type_name = @document_types[index].name

  getWorkflow: (id) =>
    @Restangular.one('workflows', id).get().then (response) =>
      @workflow = response
      @$scope.workflow = response
      @getDocumentTypes()
      @printOptions =
            pageTitle: "DiligenceVault - #{@workflow.name}"

  confirmWorkflowDeletion: () ->
    title = 'Are you sure you want to delete this workflow?'

    @SweetAlert.confirm({
        title: title
        text:''
        customClass: 'danger'
        focusCancel: true
      }).then (isConfirm) =>
        @deleteWorkflow() if isConfirm.value and isConfirm.value == true

  deleteWorkflow: () ->
    @Restangular.one('workflows', @workflowId).remove().then =>
      swal.close()
      @toaster.pop 'success', '', 'Workflow deleted successfully'
      @$state.go 'app.firm.settings.workflows.list'

  openEditWorkflowModal:=>
    param = angular.copy @workflow
    @ModalFactory.invokeModal 'manage_workflow',
      resolve:
        edit_mode: true
        workflow: => param
      success: (response) =>
        @workflow = response
        @getEntitySubType()

  getEntityTypeName: (entity_type) =>
    display_name = @Utils.getDisplayEntityType(entity_type)
    if @is_manager and display_name == @keywordConstants.Firm
        display_name = 'Investor'
    display_name
