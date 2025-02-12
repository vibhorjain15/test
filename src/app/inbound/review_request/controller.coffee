class InboundReviewRequestController extends BaseController
    @register 'InboundReviewRequestController'

    @inject 'Restangular', 'Utils', '$state', '$q','ModalFactory','keywordConstants','toaster','angularEnabled'

    initialize: ->
        @redirectId = @$state.params.redirectId
        @investorId = @$state.params.investorId
        @current_firm = @Utils.getCurrentFirm()
        @current_user = @Utils.getCurrentUser()
        @isFreeManager = @Utils.isFreeManager()
        @permissions_enabled = @current_user.firmInfo.hasPermissionEnabled
        @hide_private = true
        unless @investorId
            @hide_private = false
            @showSpinner = true
            @Restangular.all('service/dvapi_service/inbound').post(redirect_id: @redirectId).then (response)=>
                @investorId = response.investor_details.id
                @logoLink = response.investor_details.firm_logo
                if moment(response.inbound_details.due_date).isBefore(moment().set({'hour':0,'minute':0,'second':0,'millisecond':0}))
                    @toaster.pop "error","","Sorry, this opportunity has expired."
                    @$state.go 'app.inbound.investor_pitch'
                else
                    @initData()
        else
            @showSpinner = true
            @initData()

    initData: =>
        promises = []
        promises.push @Restangular.all('funds').getList(params:{profile:true})
        promises.push @Restangular.all('service/dvapi_service/get_investors_configs').post(investor_id: @investorId,hide_private: @hide_private)
        promises.push @Restangular.all('service/dvapi_service/product_search').post(
            params:{
                include_contacts: false,  include_custom_fields: false,
                include_dates: true,
                is_active: true,
                filters: {}
                search_for: @global_hierarchy_option
            }
        )
        @$q.all(promises).then (response)=>
            @funds = response[0]
            @opportunities = response[1].data
            @strategies = response[2].data
            if @redirectId
                @defaultOpportunity = _(@opportunities).find((opportunity) =>
                    opportunity.redirect_url.indexOf(this.redirectId) > -1
                )
                if @defaultOpportunity?.description
                    @descriptionContent = @defaultOpportunity.description

            if @opportunities.length > 0
                if !@logoLink
                    @logoLink = @opportunities[0].logo_link
                @params =
                    opportunity_id: if @redirectId and @defaultOpportunity then @defaultOpportunity.id else null
                    investor_firm: @opportunities[0].investor_name
                    descriptionContent : if @defaultOpportunity and @defaultOpportunity.description then @defaultOpportunity.description else ""
                    as_of_date: if @redirectId and @defaultOpportunity and @defaultOpportunity.as_of_date then new Date(@defaultOpportunity.as_of_date) else new Date()
                    entity_type: if @redirectId and @defaultOpportunity then @defaultOpportunity.entity_type else null
                    due_date: if @redirectId and @defaultOpportunity and @defaultOpportunity.due_date then new Date(@defaultOpportunity.due_date) else moment().add(45, 'days').toDate()
                    entity_id: null
                @onEntityTypeChanged()
            else if @opportunities.length == 0
                @params = {}
            @showSpinner = false

    onOpportunityChanged: =>
        @selectedOpportunity = @getSelectedOpportunity()
        if @selectedOpportunity
            @params.due_date = if @selectedOpportunity.due_date then new Date(@selectedOpportunity.due_date) else new Date(moment().add(45, 'days').toDate())
            @params.as_of_date = new Date(@selectedOpportunity.as_of_date)
            @params.descriptionContent = if @selectedOpportunity.description then @selectedOpportunity.description else ""
            @params.entity_type = @selectedOpportunity.entity_type
        else
            @params.due_date = moment().add(45, 'days').toDate()
            @params.as_of_date = new Date()
            @params.descriptionContent = ""
            @params.entity_type = null
        @onEntityTypeChanged()

    getSelectedOpportunity: =>
        _(@opportunities).find((opportunity) =>
            opportunity.id == @params.opportunity_id
        )

    validateDueDate: =>
        @opportunityForm['due-date'].$setValidity('validDueDate',moment(@params.due_date).isSameOrAfter(@params.as_of_date, 'day'))
        @opportunityForm.$setSubmitted true

    onEntityTypeChanged: =>
        @entityText = "Associated "+if @params.entity_type == @keywordConstants.Product then 'Product' else @params.entity_type
        @entityTypeName = if @params.entity_type == @keywordConstants.Product then 'Product' else @params.entity_type
        @params.entity_id = null

    openNewDialog: =>
        if @params.entity_type == @keywordConstants.Product
            @ModalFactory.invokeModal 'manage_fund',
                resolve:
                    source: => 'InformationRequestFlow'
                success: (response) =>
                    @funds.push(response[0])
                    @params.entity_id = response[0].id
        if @params.entity_type == @keywordConstants.Strategy
            @ModalFactory.invokeModal 'manage_master_fund',
                resolve:
                    source: => 'InformationRequestFlow'
                success: (response) =>
                    @strategies.push(response[0])
                    @params.entity_id = response[0].id
        if @params.entity_type == @keywordConstants.Vehicle
            @ModalFactory.invokeModal 'manage_vehicle',
                success: (response) =>
                    @vehicles.push(response[0])
                    @params.entity_id = response[0].id

    getSelectedEntityName: =>
        selectedEntityType = @params.entity_type
        entityId = @params.entity_id
        if selectedEntityType == @keywordConstants.Product
            _(@funds).find((fund) => fund.id == entityId).name
        else if selectedEntityType == @keywordConstants.Strategy
            _(@strategies).find((strategy) => strategy.id == entityId).name
        else if selectedEntityType == @keywordConstants.Vehicle
            _(@vehicles).find((vehicle) => vehicle.id == entityId).name

    generatePageUrl: =>
        pageUrl = ""
        if @params.entity_type == @keywordConstants.Firm
            pageUrl = "app/firms/#{@current_firm.id}/review_request"
        else if @params.entity_type == @keywordConstants.Product
            pageUrl = "app/firms/#{@current_firm.id}/funds/#{@params.entity_id}/review_request"
        else if @params.entity_type == @keywordConstants.Strategy
            pageUrl = "app/firms/#{@current_firm.id}/strategies/#{@params.entity_id}/review_request"
        pageUrl

    submit:=>
        @validateDueDate()
        if @opportunityForm.$invalid
            return

        selectedOpportunity = @getSelectedOpportunity()
        selectedEntityType = @params.entity_type
        pageUrl = @generatePageUrl() if not (!@permissions_enabled or @Utils.isAdmin() or @Utils.isOwner())
        param = {
            diligence_type: 'inbound'
            entities: [
                {
                    id: if selectedEntityType == @keywordConstants.Firm then @Utils.getCurrentUser().firmInfo.id else @params.entity_id
                    notification_contacts: _(selectedOpportunity.contacts).pluck('id')
                    entity_type: selectedEntityType
                    template_id: selectedOpportunity.template_id
                }
            ],
            name: "#{selectedOpportunity.name} "+ if selectedEntityType == @keywordConstants.Firm then @Utils.getCurrentUser().firmInfo.name else @getSelectedEntityName()
            due_at: @Utils.formatDatetime(@params.due_date),
            as_of_date: @Utils.formatDatetime(@params.as_of_date)
            is_internal: true
            investor_id: @investorId
            inbound_configurations_id: selectedOpportunity.id
        }
        @loading = true
        @Restangular.all('v2/diligences').post(param, null, {'page-url': pageUrl}).then (res) =>
            @loading = false
            @$state.go 'app.diligence.project.questionnaire',{diligenceId: res.id}
        ,(error) =>
            @loading = false

    onBack: =>
        window.history.back()
