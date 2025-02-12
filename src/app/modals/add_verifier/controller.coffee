class AddVerifierController extends ModalController
    @register 'AddVerifierController'

    @inject 'response', '$state', 'toaster','BaseDataService','Restangular','Utils', 'verificationLevel','DueDiligenceDataservice', 'verificationType','diligenceStatusConstant', 'diligenceType','functions'

    initialize: ->
        @is_freeSubscription = @Utils.isFreeSubscription()
        @is_manager = @Utils.isManager()
        @showForManager = @is_manager && !@is_freeSubscription
        @minDate = new Date()
        if @response.verifier and @response.verifier.attributes.id
            @edit_mode = true
            @params =
                id : @response.verifier.attributes.id
                due_date : moment(@response.verifier.attributes.due_date).toDate()
            if @response.verifier.attributes.assigned_to_function_id
                @params.assigned_to_user =
                    id: @response.verifier.attributes.assigned_to_function_id
                    fullName: @response.verifier.attributes.assigned_to_function_name
                    type: 'function'
            else if @response.verifier.attributes.assigned_to
                @params.assigned_to_user =
                    id: @response.verifier.attributes.assigned_to
                    fullName: @response.verifier.attributes.assigned_to_name
                    type: 'user'
        else
            @edit_mode = false
            @params =
                due_date : moment().add(3,'days').toDate()
                assigned_to : null

        @teamMembers = []
        @BaseDataService.getTeamMembers().then (teamMembers) =>
            @teamMembers = _(teamMembers).map (teamMember) ->
                teamMember.fullname = _([teamMember.firstName, teamMember.lastName]).compact().join(' ')
                teamMember

    save: =>
        if !@params.assigned_to_user
            @toaster.pop 'error','','Please assign to a user role/team member'
            return

        if @add_verifier_form.$valid
            @saving = true
            params = angular.copy @params
            if params.assigned_to_user.type == 'function'
                params.assigned_to_function_id = params.assigned_to_user.id
            else
                params.assigned_to = params.assigned_to_user.id
            params.due_date = @Utils.getToDateTimeFormatted(params.due_date)
            params.type = if @verificationType == @diligenceStatusConstant.PRECOMPLETIONREVIEW or (@showForManager and @diligenceType == 'dd_profile') then 1702 else 1701
            params.text = ""
            params.entity_type = @verificationLevel
            if @verificationLevel == 'response'
                params.entity_id = @response.id
            else
                params.entity_id = @response.id
                params.parent_id  = @response.diligenceId

            if @edit_mode
                @Restangular.one('todos',params.id).customPUT(params)
                .then (response) =>
                    @toaster.pop 'success', '', 'Verifier successfully updated'
                    @close(response)
                .finally => @saving = false

            else
                @Restangular.all('todos').post(params)
                .then (response) =>
                    @toaster.pop 'success', '', 'Verifier successfully added'
                    @close(response)
                .finally => @saving = false

    changeResponseStatus: (response)=>
        if @verificationLevel == 'response' and @verificationType == @diligenceStatusConstant.PRECOMPLETIONREVIEW
            @DueDiligenceDataservice.updateResponseStatus(@response.id, 'InReview').then (status)=>
                @toaster.pop 'success', '', 'Verifier successfully added'
                @close(response)
        else
            @toaster.pop 'success', '', 'Verifier successfully added'
            @close(response)
