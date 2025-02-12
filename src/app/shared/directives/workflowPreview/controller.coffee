class WorkflowPreviewController extends BaseController
    @register 'WorkflowPreviewController'
    @inject '$scope', '$attrs', 'Restangular', 'BaseDataService', 'toaster', '$state', '$q','DueDiligenceDataservice'

    initialize: ->
        @workflowId = @$scope.$parent.$eval(@$attrs.id)
        @entityId = 1
        @entityType = 'DueDiligence'
        @minDate = new Date()
        @has_steps = true
        @$scope.$watch @$attrs.workflow, (value)=>
            if value
                @entityType = value.entity_type
                @getWorkflowPreview(@workflowId)

        @BaseDataService.getTeamMembers().then (teamMembers) =>
            @teamMembers = _(teamMembers).map (teamMember) ->
                teamMember.fullname = _([teamMember.firstName, teamMember.lastName]).compact().join(' ')
                teamMember

        @BaseDataService.getFunctions().then (response)=>
            @functions = response

    getWorkflowPreview:(workflowId)=>
        @loading_workflow = true
        @Restangular.all('workflow_audits').customGET('preview',{workflow_id: workflowId,entity_id:@entityId,entity_type:@entityType}).then (response) =>
            @workflow_audits = response
            @groupWorkflowAudits()
            @getWorkflowDueDate() if @workflow_audits.workflow_steps_audits.length > 0
        .finally => @loading_workflow = false

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
                action[0].due_at = moment.utc(action[0].due_at).local().format('YYYY-MM-DD')
                stepactions.push action[0]
            )
            step.actions = stepactions
        )
        @workflow = _(@workflow_audits).pick('entity_id','entity_type','firm_id','name','owner_id','pct_complete','source','updated_at','updated_by','workflow_id','created_at','created_by','entities','id','is_active','description')
        steps = _(steps).sortBy (eachStep) -> eachStep[0].order
        @workflow.steps = steps
        @has_steps =  Object.keys(@workflow.steps).length > 0

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