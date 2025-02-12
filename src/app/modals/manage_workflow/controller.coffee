class ManageWorkflowController extends ModalController
    @register 'ManageWorkflowController'

    @inject 'Restangular', '$q', 'toaster', 'SweetAlert','BaseDataService','$state','edit_mode','workflow','Utils','keywordConstants'

    initialize: ->
        @is_manager = @Utils.isManager()
        @getDocumentTypes()
        @setEntityTypes()
        @getWorkflows()
        @baseWorkflow = null

    getDocumentTypes: () =>
        @BaseDataService.getAttachmentTypes().then (response) => 
            @document_types = response

    setEntityTypes: () =>
        @Restangular.all('Workflow_entity_types').getList().then (response) =>
            @entity_types = _.sortBy(response, (i) ->
                i.value
            )

    getWorkflows: =>
        @Restangular.all('workflows').customGET('', null).then (response) =>
            @all_workflows = response

    setEntityType: (type) =>
        @workflow.entity_type = type.value

    save: =>
        if @workflow_builder_form.$invalid or !@validateWorkflowEntityTypes()
            @toaster.pop 'error','','Please fill all the fields'
            return
        
        @saving = true
        if @edit_mode
            params = _(@workflow).pick('name','id','active')
            @Restangular.one('workflows',@workflow.id).customPUT(params).then (response) =>
                @toaster.pop 'success','','Workflow updated successfully'
                @close(response)
            .finally => @saving = false
        else
            if @baseWorkflow
                @workflow.baseworkflow_id = @baseWorkflow
                
            @Restangular.all('workflows').post(@workflow).then (response) =>
                @toaster.pop 'success','','Workflow added successfully'
                @close()
                @$state.go 'app.firm.settings.workflows.detail.edit',{workflowId: response.id}
            .finally => @saving = false

    validateWorkflowEntityTypes: =>
        if @workflow.entity_type == null or @workflow.entity_type == ""
            return false
        
        if @workflow.entity_type and @workflow.entity_type == "Document"
            if @workflow.entity_sub_type == null or @workflow.entity_sub_type == ""
                return false
        return true

    getEntityTypeName: (entity_type) =>
        display_name = @Utils.getDisplayEntityType(entity_type)
        if @is_manager and display_name == @keywordConstants.Firm
            display_name = 'Investor'
        display_name