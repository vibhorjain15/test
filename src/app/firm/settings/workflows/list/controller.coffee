class WorkflowsListController extends BaseController
  @register 'WorkflowsListController'
  @inject '$state', 'WorkflowsResource', 'SweetAlert', 'Restangular', 'toaster','ModalFactory','Utils','keywordConstants','angularEnabled'

  initialize: ->
    @workflows = @WorkflowsResource.$new()
    @is_manager = @Utils.isManager()

    @modalOptions =
      resolve:
        edit_mode: false

  confirmWorkflowDeletion: (workflow) ->
    title = 'Are you sure you want to delete this workflow?'

    @SweetAlert.confirm({
      title: title
      focusCancel: true
      showLoaderOnConfirm: true
      preConfirm: =>
        @deleteWorkflow(workflow)
    })

  deleteWorkflow: (workflow) ->
    @Restangular.one('workflows', workflow.id).remove().then =>
      swal.close()
      @toaster.pop 'success', '', 'Workflow deleted successfully'
      @workflows.refresh()


  openAddWorkflowModal:()=>
    param = {
      name: null
      entity_type: null
      entity_sub_type: null
    }
    @ModalFactory.invokeModal 'manage_workflow',
      resolve:
        edit_mode: false
        workflow: => param
      success: (response) =>
        @workflow = response

  openRow: (row,col)=>
    if !row.internalRow && col.field != "selectionRowHeaderCol" && col.field != 'action'
      @$state.go("app.firm.settings.workflows.detail.edit",{workflowId: row.entity.id})

  clearGrouping: (grid,column)=>
    grid.api.grouping.clearGrouping()

  getEntityTypeName: (entity_type) =>
    if typeof entity_type != "number"
      display_name = @Utils.getDisplayEntityType(entity_type)
      if @is_manager and display_name == @keywordConstants.Firm
          display_name = 'Investor'
      display_name

  getEntityGroupHeaderName: (grid, row, col)=>
    enity_name = ""
    #get group name from the aggregations list.
    for i in [0...row.treeNode.aggregations.length]
      agg = row.treeNode.aggregations[i]
      if agg.groupVal and agg.groupVal.length > 0
        entity_name = agg.groupVal

    #if we find the group name from the aggregations list, get its appropriate label name, otherwise show 'Ungrouped'
    if entity_name != ""
      entity_name = @getEntityTypeName(entity_name)
    else
      entity_name = "Ungrouped"
    entity_name + "(#{row.treeNode.children.length})"
