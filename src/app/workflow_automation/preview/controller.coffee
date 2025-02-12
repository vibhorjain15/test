class WorkflowAutomationPreviewController extends BaseController

    @register 'WorkflowAutomationPreviewController'

    @inject 'Restangular','$state','BaseDataService','$filter','Utils','toaster','keywordConstants','RestangularHeaderService','angularEnabled'

    initialize: ->
        @workflowId = @$state.params.Id
        @entityId = @$state.params.entity_id
        @entityType = @$state.params.entity_type
        @workflow = null
        @minDate = new Date()
        @pageUrl = ""

        if @entityType.toLowerCase() == @keywordConstants.Firm.toLowerCase()
            @pageUrl = "app/firms/#{@entityId}/workflow_automation/#{@workflowId}"
            @init()
        else if @entityType.toLowerCase() == @keywordConstants.Product.toLowerCase()
            @BaseDataService.getPermissionEntityDetails(@entityId, @entityType).then (response) =>
                @pageUrl = "app/firms/#{response.entity_id}/funds/#{@entityId}/workflow_automation/#{@workflowId}"
                @init()
        else if @entityType.toLowerCase() == @keywordConstants.Vehicle.toLowerCase()
            @BaseDataService.getPermissionEntityDetails(@entityId, @entityType).then (response) =>
                @pageUrl = "app/firms/#{response.firm_id}/funds/#{response.fund_id}/vehicles/#{@entityId}/workflow_automation/#{@workflowId}"
                @init()
        else if @entityType.toLowerCase() == @keywordConstants.Strategy.toLowerCase()
            @BaseDataService.getPermissionEntityDetails(@entityId, @entityType).then (response) =>
                @pageUrl = "app/firms/#{response.entity_id}/strategies/#{@entityId}/workflow_automation/#{@workflowId}"
                @init()
        else if @entityType.toLowerCase() == @keywordConstants.Project.toLowerCase()
            @BaseDataService.getPermissionEntityDetails(@entityId, @entityType).then (permission)=>
                if permission.entity_type.toLowerCase() == @keywordConstants.Product.toLowerCase()
                    fromfirmId = permission.fromfirm_id
                    tofirmId = permission.tofirm_id
                    fundId = permission.entity_id
                    @pageUrl = "app/diligence/#{fromfirmId}/firms/#{tofirmId}/funds/#{fundId}/projects/#{@entityId}/workflow_automation/#{@workflowId}"
                else if permission.entity_type.toLowerCase() == @keywordConstants.Firm.toLowerCase()
                    fromfirmId = permission.fromfirm_id
                    tofirmId = permission.entity_id
                    @pageUrl = "app/diligence/#{fromfirmId}/firms/#{tofirmId}/projects/#{@entityId}/workflow_automation/#{@workflowId}"
                else if permission.entity_type.toLowerCase() == @keywordConstants.Vehicle.toLowerCase()
                    fromfirmId = permission.fromfirm_id
                    tofirmId = permission.tofirm_id
                    fundId = permission.parent_entity_id
                    vehicleId = permission.entity_id
                    @pageUrl = "app/diligence/#{fromfirmId}/firms/#{tofirmId}/funds/#{fundId}/vehicles/#{vehicleId}/projects/#{@entityId}/workflow_automation/#{@workflowId}"
                else if permission.entity_type.toLowerCase() == @keywordConstants.Strategy.toLowerCase()
                    fromfirmId = permission.fromfirm_id
                    tofirmId = permission.tofirm_id
                    strategyId = permission.entity_id
                    @pageUrl = "app/diligence/#{fromfirmId}/firms/#{tofirmId}/strategies/#{strategyId}/projects/#{@entityId}/workflow_automation/#{@workflowId}"
                @init()
        else if @entityType.toLowerCase() == @keywordConstants.Document.toLowerCase()
            @pageUrl = "app/content/docuemnt/#{@entityId}"
            @init()
        else
            @init()

    init: =>
        @RestangularHeaderService.RestangularWithHeader(@pageUrl).all('workflows').customGET('',{entity_type: @entityType}).then (response) =>
            @workflows = response
            @getWorkflowAudits(@workflowId)

        @BaseDataService.getTeamMembers().then (teamMembers) =>
            @teamMembers = _(teamMembers).map (teamMember) ->
                teamMember.fullname = _([teamMember.firstName, teamMember.lastName]).compact().join(' ')
                teamMember

        @BaseDataService.getFunctions().then (response)=>
            @functions = response

    getWorkflowAudits:(workflowId)=>
        if workflowId
            @loading_workflow_audits = true
            @RestangularHeaderService.RestangularWithHeader(@pageUrl).all('workflow_audits').customGET('preview',{workflow_id: workflowId,entity_id:@entityId,entity_type:@entityType}).then (response) =>
                @workflow_audits = response
                @groupWorkflowAudits()
                @getWorkflowDueDate() if @workflow_audits.workflow_steps_audits.length > 0
                @loading_workflow_audits = false

    getWorkflowDueDate: =>
        steps = Object.keys(@workflow.steps)
        lastStep = steps[steps.length - 1]
        lastStepActions = @workflow.steps[lastStep].actions
        lastAction = lastStepActions[lastStepActions.length-1]
        @workflow_due_date = lastAction.due_at

    getUserFullName:(user, type)=>
        if type == 'function'
            teamMember = _(@functions).find ((member)=>
                member.function_id == Number(user)
            )
            if teamMember
                return teamMember.function_name
            else
                return null
        else
            teamMember = _(@teamMembers).find ((member)=>
                member.id == Number(user)
            )
            if teamMember
                return teamMember.fullname
            else
                return null
        

    groupWorkflowAudits: =>
        steps = _(@workflow_audits.workflow_steps_audits).groupBy ((step)=>
            step.workflow_steps_id
        )
        _(steps).each ((step)=>
            actions = _(step).groupBy ((action)=>
                action.workflow_steps_actions_id
            )
            stepactions = []
            _(actions).each ((action)=>
                action[0].users = _(action).chain().filter((user)=>
                    user.user_id
                ).pluck('user_id').value()
                action[0].functions = _(action).chain().filter((user)=>
                    user.function_id
                ).pluck('function_id').value()
                action[0].due_at = moment.utc(action[0].due_at).toDate()
                stepactions.push action[0]
            )
            step.actions = stepactions
        )
        @workflow = _(@workflow_audits).pick('entity_id','entity_type','firm_id','name','owner_id','pct_complete','source','updated_at','updated_by','workflow_id','created_at','created_by','entities','id','is_active','description')
        steps = _(steps).sortBy (eachStep) -> eachStep[0].order
        @workflow.steps = steps

    triggerWorkflow:=>
        return if @workflow_audit_preview_form.$invalid
        if @validateDueDates()
            @trigger_workflow = true
            changedWorkflow = @ungroupWorkflowAudits()

            @RestangularHeaderService.RestangularWithHeader(@pageUrl).all('workflow_audits').customPOST(changedWorkflow).then (response)=>
                @toaster.pop 'success','','Workflow triggered successfully'
                @$state.go 'app.workflow_automation.detail', Id: response.id
            .finally => @trigger_workflow = false
        else
            @toaster.pop 'error','','Action Due dates are not in order'



    showInitials: (user, type) ->
        fullName = @getUserFullName(user, type)
        if fullName
            firstName = fullName.split(' ').slice(0, -1).join(' ')
            lastName = fullName.split(' ').slice(-1).join(' ')
            if firstName and !lastName
                initials = firstName[0]
            if lastName and !firstName
                initials = lastName[0]
            if firstName and lastName
                initials = firstName[0] + lastName[0]
            initials
        else
            "N/A"


    displayUserName: (user, type)=>
        fullName = @getUserFullName(user,type)
        if fullName
            fullName
        else
            "User not active"

    ungroupWorkflowAudits:=>
        ungroupedWorkflow = _(@workflow).pick('entity_id','entity_type','firm_id','name','owner_id','pct_complete','source','updated_at','updated_by','workflow_id','created_at','created_by','entities','id','is_active')
        ungroupedWorkflow.workflow_steps_audits = []
        _(@workflow.steps).each ((step)=>
            _(step.actions).each ((action)=>
                _(action.users).each ((user)=>
                    newAction = _(action).pick('action_id','checklist','created_at','due_at','id','is_owner_task','name','order','status','updated_at','updated_by','user_id','workflow_audit_id','workflow_steps_actions_id','workflow_steps_id','description')
                    newAction.user_id = Number(user)
                    ungroupedWorkflow.workflow_steps_audits.push newAction
                )
                _(action.functions).each ((func)=>
                    newAction = _(action).pick('action_id','checklist','created_at','due_at','id','is_owner_task','name','order','status','updated_at','updated_by','function_id','workflow_audit_id','workflow_steps_actions_id','workflow_steps_id','description')
                    newAction.function_id = Number(func)
                    ungroupedWorkflow.workflow_steps_audits.push newAction
                )
            )
        )
        ungroupedWorkflow

    dueDateChanged: (currentStep,action) =>
        if currentStep.stepIndex == @workflow.steps.length - 1 and action.actionIndex == currentStep.actions.length - 1
            @workflow_due_date = action.due_at

    validateDueDates:=>
        steps = Object.keys(@workflow.steps)

        valid = true
        maxInPreviousStep = null
        _(steps).each ((step)=>
            minInStepAction = (_(@workflow.steps[step].actions).min ((action)=>
                action.due_at
            )).due_at
            if maxInPreviousStep and moment(maxInPreviousStep).isAfter(moment(minInStepAction))
                valid = false

            maxInPreviousStep = (_(@workflow.steps[step].actions).max ((action)=>
                action.due_at
            )).due_at
        )
        valid
