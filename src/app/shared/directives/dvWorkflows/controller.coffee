class DvWorkflowsController extends BaseController
  @register 'DvWorkflowsController'

  @inject '$attrs', '$scope', 'Restangular', 'ModalFactory','Utils', 'RestangularHeaderService'

  # This is generic a directive for showing workflow history for a given entity
  # Pass entitytype, entityid and entityname as attribute
  # User will be able to view active and completed workflows, trigger new workflow, as well as navigate to detail
  # Implementation: <dv-workflows entity-type="'Document'" entity-id="vm.documentId" entity-name="vm.document.name"></dv-workflows>

  initialize: ->
    deregisterer = @$scope.$parent.$watchGroup [@$attrs.entityType, @$attrs.entityId, @$attrs.entityName, @$attrs.disableInsert, @$attrs.pageUrl], (values) =>
      if values[0] && values[1] && values[2]
        @entity_type = values[0]
        @entity_id = values[1]
        @entity_name = values[2]
        @insertDisabled = if values[3] then values[3] else false
        @pageUrl = values[4]
        if (@$attrs.dateFilter and @customDateFilter) or not @$attrs.dateFilter
          @getWorkflows()
        deregisterer()

    @$scope.$parent.$watch @$attrs.refreshWorkflows, (newValue, oldValue) =>
      if newValue isnt oldValue
        @getWorkflows()

    @$scope.$parent.$watch @$attrs.dateFilter, (newValue) =>
      if newValue
        @customDateFilter = newValue
        @getWorkflows() if @entity_id and @entity_type

  getWorkflows: ->
    @loadingWorkflows = true

    params = {
      entity_type: @entity_type
      entity_id: @entity_id
    }
    if @customDateFilter
      params.start_date = @customDateFilter.startDate
      params.end_date = @customDateFilter.endDate

    @RestangularHeaderService.RestangularWithHeader(@pageUrl).all('workflow_audits').getList(params).then ((response) =>
      @workflows = response
      @loadingWorkflows = false
    ), ((error) =>
      @loadingWorkflows = false
      avoid_error_logging_statuses = @BaseDataService.getAvoidErrorLoggingStatusList()
      if !(error.status in avoid_error_logging_statuses)
        @Utils.logError('Not able to fetch workflow', error)
    )

  addWorkflow: ->
    @ModalFactory.invokeModal 'trigger_workflow',
      resolve:
        workflow: =>
          entity_type: @entity_type
          entity_id: @entity_id
          name: @entity_name
          pageUrl: @pageUrl
