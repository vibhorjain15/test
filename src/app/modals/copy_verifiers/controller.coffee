class CopyVerifiersController extends ModalController

    @register 'CopyVerifiersController'

    @inject 'Restangular', 'keywordConstants', 'Utils','VehicleDataService','FirmDataservice','FundDataservice','$q','DueDiligenceDataservice','diligence','toaster','diligenceStatusConstant','BaseDataService','$http','baseUrl'

    initialize: ->
        @minDate = moment().subtract(5,'years').toDate()
        @maxDate = new Date()
        @is_investor = @Utils.isInvestor()
        @is_manager = @Utils.isManager()
        @current_user = @Utils.getCurrentUser()
        @diligences = []
        @source_diligence = null
        @entity_id = null
        @tabType = 'assign_verifier'
        @getTeamMembers()
        @getMyFunctions()
        @diligenceFilters = [
            {
                label: 'All Questions'
                value: 'all'
            }
            {
                label: 'Only Mandatory Questions'
                value: 'mandatory'
            }
        ]
        @selected_filter = @diligenceFilters[0].value
        @due_date = moment().add(3,'days').toDate()
        if @diligence.status == @diligenceStatusConstant.PRECOMPLETIONREVIEW or @diligence.status == @diligenceStatusConstant.POSTCOMPLETIONREVIEW or (@is_manager and @diligence.alwaysOpen)
            @review_started = true
        else
            @review_started = false

        @entity_types = [{name: 'Product', value: 'Fund'},{name: 'Firm', value: 'Firm'},{name: 'Vehicle', value: 'Vehicle'},{name: 'Strategy', value: 'Strategy'}]
        if @is_manager
            @entity_types = [{name: 'Product', value: 'Fund'},{name: 'My Firm', value: 'Myfirm'},{name: 'Vehicle', value: 'Vehicle'},{name: 'Strategy', value: 'Strategy'}]

    getFirmPref: =>
        if !@firm_pref
            @loading = true
            @Restangular.all('firm_preferences').customGET().then (response) =>
                @firm_pref = response
                @customDateFilter = @Utils.getPredefinedDateRanges(response.default_daterange_months)
                @customDateFilter.selectedRange = @Utils.getDateRanges()[response.default_daterange_months].label
                if @customDateFilter.selectedRange == 'No Filter'
                    @customDateFilter.startDate = null
                    @customDateFilter.endDate = null

                if @is_manager and @diligence.entity_type == @keywordConstants.Firm
                    @setEntityType(@keywordConstants.MyFirm)
                else
                    @setEntityType(@diligence.entity_type, @diligence.entity_id)

                @loading = false

    applyMethod: (startDate,endDate)=>
        @customDateFilter.startDate = startDate
        @customDateFilter.endDate  = endDate

        if @customDateFilter.selectedRange == 'No Filter'
            start_date = null
            end_date = null
        else
            start_date = @Utils.formatDatetime(@customDateFilter.startDate)
            end_date = @Utils.formatDatetime(@customDateFilter.endDate)
        @getDiligences(start_date,end_date)

    getTeamMembers: =>
        @BaseDataService.getTeamMembers().then (teamMembers) =>
            @teamMembers = _(teamMembers).map (teamMember) ->
                teamMember.fullname = _([teamMember.firstName, teamMember.lastName]).compact().join(' ')
                teamMember

    getMyFunctions: =>
        if @diligence.entity_type == 'Review'
            params =
                entity_type: @keywordConstants.Project
                entity_id: @diligence.id
        else
            params =
                entity_type: @diligence.entity_type
                entity_id: @diligence.entity_id
        @Restangular.all('function_assignments').getList(params).then (response)=>
            @functions = response

    setTabType: (type)=>
        @tabType = type
        if @tabType == 'assign_verifier'
            @getTeamMembers()
        else
            @getFirmPref()
            @getDiligences()

    onEntityTypeChanged: (type)=>
        @setEntityType(type)

    setEntityType: (entity_type, entity_id)=>
        @entity_type = entity_type
        @entity_id = if entity_id then entity_id else null
        @diligences.length = 0
        @source_diligence = null

        if @entity_type == @keywordConstants.MyFirm
            @entity_id = @current_user.firmInfo.id
        else if @entity_type == @keywordConstants.Product and !@entity_id
            fundKeys = Object.keys(@funds)
            @entity_id = @funds[fundKeys[0]].id if fundKeys.length > 0
        else if @entity_type == @keywordConstants.Firm and !@entity_id
            firmKeys = Object.keys(@firms)
            @entity_id = @firms[firmKeys[0]].id if firmKeys.length > 0
        else if @entity_type == @keywordConstants.Vehicle and !@entity_id
            vehicleKeys = Object.keys(@vehicles)
            @entity_id = @vehicles[vehicleKeys[0]].id if vehicleKeys.length > 0
        else if @entity_type == @keywordConstants.Strategy and !@entity_id
            strategyKeys = Object.keys(@strategies)
            @entity_id = @strategies[strategyKeys[0]].id if strategyKeys.length > 0
        @filterDiligences()

    onEntityChanged: =>
        @filterDiligences()

    getDiligences: (start_date,end_date)=>
        params =
            template_id: @diligence.template_id
            template_version: @diligence.template_version
            task_type: if @diligence.status == @diligenceStatusConstant.COMPLETED or @diligence.status == @diligenceStatusConstant.POSTCOMPLETIONREVIEW then 1701 else 1702
            start_date: start_date
            end_date: end_date
        @Restangular.all('diligences').getList(params).then (response) =>
            @diligencesBackup = response
            @generateEntities()
            @filterDiligences()

    generateEntities: =>
        @firms = {}
        @funds = {}
        @vehicles = {}
        @strategies = {}
        _(@diligencesBackup).each (diligence)=>
            switch diligence.entity_type
                when @keywordConstants.Product
                    @funds[diligence.entity_name] = {
                        id: diligence.entity_id
                        type: diligence.entity_type
                        name: diligence.entity_name
                    }
                when @keywordConstants.Firm
                    @firms[diligence.entity_name] = {
                        id: diligence.entity_id
                        type: diligence.entity_type
                        name: diligence.entity_name
                    }
                when @keywordConstants.Vehicle
                    @vehicles[diligence.entity_name] = {
                        id: diligence.entity_id
                        type: diligence.entity_type
                        name: diligence.entity_name
                    }
                when @keywordConstants.Strategy
                    @strategies[diligence.entity_name] = {
                        id: diligence.entity_id
                        type: diligence.entity_type
                        name: diligence.entity_name
                    }

    filterDiligences: =>
        @diligences = _(@diligencesBackup).filter (diligence)=>
            diligence.entity_id == @entity_id

    getVerifiers: =>
        if @source_diligence
            @loading_verifiers = true
            params = {
                task_type: if @diligence.status == @diligenceStatusConstant.COMPLETED or @diligence.status == @diligenceStatusConstant.POSTCOMPLETIONREVIEW then 1701 else 1702
            }
            @Restangular.one('diligences', @source_diligence.id).all('reviewers').getList(params).then (response)=>
                @verifiersForProject = response
                @loading_verifiers = false
            ,(error)=>
                @loading_verifiers = false

    submit: =>
        if @copy_verifiers_form.$valid
            if @tabType == 'assign_verifier'
                @assignReviewer()
            else if @tabType == 'copy_verifier'
                @copyReviewer()

    copyReviewer: =>
        if @source_diligence and @source_diligence.id
            @starting_review = true
            params = {
                source_diligence_id: @source_diligence.id
                diligence_id: @diligence.id
                task_type: if @diligence.status == @diligenceStatusConstant.COMPLETED or @diligence.status == @diligenceStatusConstant.POSTCOMPLETIONREVIEW then 1701 else 1702
            }
            @Restangular.one('diligences',@diligence.id).all('assign_reviewers').post(params).then (response)=>
                @toaster.pop 'success','','Reviewers copied'
                @startReview()
            ,(error)=>
                @starting_review = false
        else
            @startReview()


    assignReviewer: =>
        if @review_started and !@assigned_to_user
            @toaster.pop 'error','','Please assign to a user role/team member'
            return

        @starting_review = true
        if @assigned_to_user and @due_date
            params = {
                diligence_id: @diligence.id
                task_type: if @diligence.status == @diligenceStatusConstant.COMPLETED or @diligence.status == @diligenceStatusConstant.POSTCOMPLETIONREVIEW then 1701 else 1702
                due_at: @Utils.getToDateTimeFormatted(@due_date)
                assignment_filter: @selected_filter
            }
            if @assigned_to_user.type == 'function'
                params.assigned_to_function_id = @assigned_to_user.id
            else
                params.assigned_to = @assigned_to_user.id
            @Restangular.one('diligences',@diligence.id).all('assign_reviewer').post(params).then (response)=>
                @toaster.pop 'success','','Reviewer assigned'
                @startReview()
            ,(error)=>
                @starting_review = false
        else
            @startReview()


    startReview: =>
        if not @review_started

            if @diligence.is_internal
                if @diligence.status == @diligenceStatusConstant.COMPLETED
                    status = @diligenceStatusConstant.POSTCOMPLETIONREVIEW
                else
                    status = @diligenceStatusConstant.PRECOMPLETIONREVIEW
            else
                if @current_user.firmInfo.id == @diligence.fromfirm_id
                    status = @diligenceStatusConstant.POSTCOMPLETIONREVIEW
                else if @current_user.firmInfo.id == @diligence.tofirm_id
                    status = @diligenceStatusConstant.PRECOMPLETIONREVIEW

            @DueDiligenceDataservice.setStatus(@diligence.id, status).then (response) =>
                @toaster.pop 'success','','Verification Started'
                @starting_review = false
                @close response
            ,(error)=>
                @starting_review = false
        else
            @starting_review = false
            @close @diligence
