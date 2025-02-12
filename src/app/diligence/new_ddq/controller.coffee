class DiligenceNewddqController extends BaseController

    @register 'DiligenceNewddqController'

    @inject '$scope', 'Utils', 'angularEnabled', 'Restangular', '$state', '$q', 'SweetAlert', 'toaster', 'WizardHandler','FundDataservice','TemplatesDataService','DueDiligence','ModalFactory','DueDiligenceDataservice','requestSteps', 'RequestTypes', 'BaseDataService', 'keywordConstants','$window'

    initialize: ->
        @is_data_loaded = false
        @loading_data = true
        @suggested_due_date_diff = 45
        promises = []
        @alltemplates = []
        #initialise investor_id, template_id and entity_id to empty string to fix the selected of undefined error in the select
        @request =
            'is_firm_dd': null
            'investor_id': ""
            'duediligence_type': null
            'due_at': @getSuggestedDueDate()
            'template_id': ""
            'entity_id': ""
            'name':null
            'type':null
            'as_of_date': new Date()

        @requestId = @$state.params.request

        @headerText = ""
        #maintain an object in which the key will be the attribute to display and the value will be the boolean value
        #representing whether the particular attribute is shown or not.
        @shownMap = {
            investor: false
            product: false
            template: false
            name: false
            dueDate: false
            asOfDate: false
        }

        @current_firm = @Utils.getCurrentFirm()
        @minDate = new Date()
        @maxDate = new Date()
        @maxAsOfDate = @Utils.getMaxAsOfDateDiligence()

        promises.push @TemplatesDataService.getTemplates(detail: false, include_associated_firms : true).then (response) =>
            @alltemplates = response

        @$q.all(promises).then(=>
            @is_data_loaded = true
            @loading_data = false
            if @requestId
                @getRequest()
            else
                @changeRequestType(@RequestTypes.INVESTOR)
        )
        @isManager = @Utils.isManager()
        if !@isManager
          @$window.history.back()
          return

    init: =>
        unless @funds
            @FundDataservice.getFunds().then (response) =>
                @funds = response
                #manually add the default option to the list, so that the source list will never be empty. if source list is
                #empty then the select will be disabled, in that case they wont be able to add new item to the list by searching
                @funds = @appendAddNewOptionToList(@funds,"--Please type to search or add product--")

        if @request.type.toLowerCase() == @RequestTypes.INVESTOR.toLowerCase() and not @investors
            @Restangular.all('firms').customGET('monitor',{recordsPerPage:9999999}).then (response) =>
                @investors = response.results
                #manually add the default option to the list, so that the source list will never be empty. if source list is
                #empty then the select will be disabled, in that case they wont be able to add new item to the list by searching
                @investors = @appendAddNewOptionToList(@investors,"--Please type to search or add investor--")

    getRequest: =>
        @loading_request = true

        @DueDiligenceDataservice.getRequest(@requestId).then (response) =>
            @setRequestType(response.type)
            @prefillData(response)
        .finally => @loading_request = false

    getSuggestedDueDate: =>
        moment().add(@suggested_due_date_diff, 'days').toDate()

    filterTemplates: =>
        if @request['duediligence_type'] == "dd_profile"
            @templates = _(@alltemplates).filter((template)=>
                template.type == "dd_profile"
            )
        else
            @templates = _(@alltemplates).filter((template)=>
                template.type != "dd_profile"
            )

    filterInvestorTemplates: () =>
        if @filter_all_templates
            @filterTemplates()
            @templates = @appendAddNewOptionToList(@templates,"--Please type to search or add template--")
        else
            @filterTemplates()
            @templates = _(@templates).filter((template)=>
                _(template.associated_firms).indexOf(@request.investor_id) > -1
            )
            @templates = @appendAddNewOptionToList(@templates,"--Please type to search or add template--")
        #manually add the default option to the list, so that the source list will never be empty. if source list is
        #empty then the select will be disabled, in that case they wont be able to add new item to the list by searching

    setDDType: (type) ->
        if type.toLowerCase() == @RequestTypes.SHAREABLE.toLowerCase() or type.toLowerCase() == @RequestTypes.INVESTOR.toLowerCase()
            @request['duediligence_type'] = 'dd_new'
        else if type.toLowerCase() == @RequestTypes.PREAPPROVED.toLowerCase()
            @request['duediligence_type'] = 'dd_profile'

    validateDueDate: =>
        @investor_request_form['due-date'].$setValidity('validDueDate',moment(@request.due_at).isSameOrAfter(@request.as_of_date, 'day'))
        @investor_request_form.$setSubmitted true

    setRequestType: (request)=>
        @resetParams()
        @request['type'] = request
        @setDDType(request)
        @init()
        @filterTemplates()
        @templates = @appendAddNewOptionToList(@templates,"--Please type to search or add template--")
        @checkAllFields()

    changeRequestType: (type)=>
        @setRequestType(type)
        @getPendingRequests()

    prefillData: (request)=>
        @request = angular.copy request
        @setDDType(@request.type)
        if @request.entity_type and @request.entity_type.toLowerCase() == @keywordConstants.Firm.toLowerCase()
            @request.is_firm_dd = true
            @request.entity_id = ""

        @request.due_at = moment(@request.due_at).toDate() if @request.due_at
        @request.as_of_date = moment(@request.as_of_date).toDate() if @request.as_of_date

        if request.type.toLowerCase() == @RequestTypes.INVESTOR.toLowerCase()
            @filter_all_templates = false
            @filterInvestorTemplates()

        @checkAllFields()

    resumeRequest: (request)=>
        if request.latest_step == @requestSteps.DOC_PARSER
            @$state.go 'app.content.document_upload.view_progress',
                documentUploadId: request.document_id
                request: request.id
        else if request.latest_step == @requestSteps.EXCEL_PARCER
            @$state.go 'app.diligence.excel_to_template' , {doc_id: request.document_id, type: "EP"}
        else if request.latest_step == @requestSteps.TEMPLATE_BUILDER
            @$state.go 'app.diligence.template.categories',
                templateId: request.template_id
                request: request.id
        else if request.latest_step == @requestSteps.COMPLETE_REQUEST
            @prefillData(request)
        else
            @prefillData(request)

    removeRequest: (request,index)=>
        request.is_active = false
        params = angular.copy request
        @Restangular.one('requesttrackers').customPUT(params).then (response) =>
            @pending_requests.splice index,1
            @toaster.pop 'success','','Request removed'
            swal.close()
        ,()=> swal.close()

    confirmRequestDeletion: (request,index) ->
        @SweetAlert.confirm({
            title: "Are you sure you want to remove this request?"
            showLoaderOnConfirm: true
            preConfirm: =>
                @removeRequest(request,index)
        })

    getPendingRequests : =>
        @loading = true
        @Restangular.one('requesttrackers').customGET('',{type:@request['type']}).then (response) =>
            @pending_requests = _(response).map (request)=>
                pending  = angular.copy request
                pending.savedData = {}
                if request.type.toLowerCase() == @RequestTypes.INVESTOR.toLowerCase() and request.investor_id
                    pending.savedData.investor = request.investor_name
                if request.entity_type == 'Fund' and request.entity_id
                    pending.savedData.product = request.entity_name
                else if request.entity_type == 'Firm' and request.entity_id
                    pending.savedData.firm = request.entity_name
                    pending.is_firm_dd = true
                if request.template_id
                    pending.savedData.template = request.template_name

                if request.name
                    pending.savedData.name = request.name

                if request.latest_step
                    pending.savedData['latest step'] = @getRequestLabel(request.latest_step)
                pending
            @loading = false

    getRequestLabel: (latest_step)=>
        switch latest_step
            when @requestSteps.DOC_PARSER
                'DOCUMENT PARSER'
            when @requestSteps.EXCEL_PARCER
                'EXCEL PARSER'
            when @requestSteps.TEMPLATE_BUILDER
                'TEMPLATE BUILDER'
            when @requestSteps.COMPLETE_REQUEST
                'REQUEST COMPLETION'

    resetParams:=>
        @request.is_firm_dd = null
        @request.due_at = @getSuggestedDueDate()
        @request.template_id = ""
        @request.entity_id = ""
        @request.name = null
        @request.investor_id = ""
        @filter_all_templates = false
        @request.as_of_date = new Date()
        @checkAllFields()

    generatePageUrl: =>
        pageUrl = ""
        if @request.is_firm_dd
            pageUrl = "app/firms/#{@current_firm.id}/new_ddq"
        else if not @request.is_firm_dd
            fundIndex = _(@funds).findIndex (fund)=>
                fund.id == @request.entity_id
            firmId = @funds[fundIndex].parentFirm.id
            pageUrl = "app/firms/#{firmId}/funds/#{@request.entity_id}/new_ddq"
        pageUrl

    createDueDiligence: =>
        @investor_request_form.$setSubmitted true
        unless @request.template_id or @request.template_id != ''
            @toaster.pop 'error','','Please select valid template'
            return

        if @investor_request_form.$valid
            @creating_ddq = true
            @toastInstance = @toaster.pop({type: 'info', title: 'Processing Request...', body: 'Please wait while the request is being processed.', timeout: 0})

            if @request.is_firm_dd
                entity_type = 'Firm'
                entity_id = @current_firm.id
            else
                entity_type = 'Fund'
                entity_id = @request.entity_id

            params =
                'diligence_type': @request.duediligence_type
                'entities': [{'id':entity_id,'entity_type': entity_type, 'template_id': @request.template_id}]
                'name': @request.name
                'due_at' : @request.due_at if @request.duediligence_type == "dd_new"
                'as_of_date': @request.as_of_date
                'is_internal': true

            if @request.type.toLowerCase() == @RequestTypes.INVESTOR.toLowerCase()
                params.investor_id = @request.investor_id

            pageUrl = @generatePageUrl()
            @Restangular.all('v2/diligences').post(params,null,{'page-url': pageUrl})
            .then (response) =>
                @updateRequestandRedirect(response)
            , (error) =>
                @creating_ddq = false
                @toaster.clear(@toastInstance)
                avoid_error_display_statuses = @BaseDataService.getAvoidErrorDisplayStatusList()
                if !(error.status in avoid_error_display_statuses)
                    @toaster.pop 'error', '', 'Something went wrong. Please try again.'

    updateRequestandRedirect: (response)=>
        if @request.id
            @request.duediligence_id = response.id
            @DueDiligenceDataservice.saveRequest(@request).then (res) =>
                @successHandler(response)
        else
            @successHandler(response)

    successHandler: (response)=>
        @creating_ddq = false
        @toaster.clear(@toastInstance)
        @toaster.pop 'success', 'Your project is successfully created'
        @$state.go 'app.diligence.project.questionnaire', {diligenceId: response.id}

    openAddInvestorModal: (name)=>
        @ModalFactory.invokeModal 'manage_firm',
            resolve:
                source: => 'InformationRequestFlow'
                firm_name: => name
            success: (response) =>
                @investors = @investors.concat response
                @request.investor_id = response[0].id
                @checkAllFields()

    openAddProductModal: (name)=>
        @ModalFactory.invokeModal 'manage_fund',
            resolve:
                source: => 'InformationRequestFlow'
                fund_name: => name
            success: (response) =>
                @funds = @funds.concat response
                @request.entity_id = response[0].id
                @checkAllFields()

    openAddTemplateModal: (name, selectedOptionType)=>
        unless @investor_request_form.$valid
            @toaster.pop 'error','','Please enter all the fields'
            return

        if @request.type.toLowerCase() == @RequestTypes.SHAREABLE.toLowerCase() or @request.type.toLowerCase() == @RequestTypes.INVESTOR.toLowerCase()
            templateType = "dd_new"
            optionType = @requestSteps.DOC_PARSER
        else if @request.type.toLowerCase() == @RequestTypes.PREAPPROVED.toLowerCase()
            templateType = "dd_profile"

        optionType = selectedOptionType if selectedOptionType

        params =
            pageUrl: @generatePageUrl()

        @request.params = JSON.stringify(params)
        localParams = {}
        localParams.apiParams = @request
        localParams.pageUrl = @generatePageUrl()
        @TemplatesDataService.setDiligenceParams(localParams)
        @ModalFactory.invokeModal 'manage_template',
            resolve:
                pendingrequest: => @request
                templateOptions: =>
                    templateType: templateType
                    optionType: optionType
                    templateName: name
                source: => 'InformationRequestFlow'

    onInvestorChange: ()=>
        @checkAllFields()
        @filterInvestorTemplates()

    appendAddNewOptionToList :(list,label)=>
        #generic method to add the default option to the begining of the list
        newList = []
        newList.push {
            id: ""
            name: label
        }
        newList = newList.concat list
        newList

    onProductChange: =>
        if @request.is_firm_dd or (not @request.is_firm_dd and not @request.entity_id)
            @request.entity_id = ""
        @checkAllFields()

    onTemplateChange: =>
        @checkAllFields()

    checkConditionsForDisplay: (field) =>
        #instead of adding the conditions in the template, we added the conditions here
        switch field
            when 'investor'
                @shownMap[field] = false
                if @request.type and @request.type.toLowerCase() == @RequestTypes.INVESTOR.toLowerCase()
                    @shownMap[field] = true
            when 'template'
                @shownMap[field] = false
                if @request.type and @checkInvestor() and @checkProduct()
                    @shownMap[field] = true
            when 'product'
                @shownMap[field] = false
                if @request.type and @checkInvestor()
                    @shownMap[field] = true
            when 'name'
                @shownMap[field] = false
                if @request.type and @checkInvestor() and @checkProduct()
                    @shownMap[field] = true
            when 'dueDate'
                @shownMap[field] = false
                if @request.type and @request.type.toLowerCase() != @RequestTypes.PREAPPROVED.toLowerCase() and @checkInvestor() and @checkProduct()
                    @shownMap[field] = true
            when 'asOfDate'
                @shownMap[field] = false
                if @request.type and @checkInvestor() and @checkProduct()
                    @shownMap[field] = true

    checkInvestor: =>
        @request.type != 'investor_request' or (@request.investor_id)

    checkProduct: =>
        (@request.entity_id) or @request.is_firm_dd

    checkTemplate: =>
        @request.template_id

    checkAllFields: =>
        #this function calls the checkConditionsForDisplay method for each entry in the shownMap object.
        _(Object.keys(@shownMap)).each (key)=>
            @checkConditionsForDisplay(key)

    getSuggestedProjectName: =>
        if @request.investor_id and @request.investor_id != ''
            investor = _(@investors).find((investor)=>
                investor.id == @request.investor_id
            )
            if investor
                investorName = investor.name + "_"
            else
                investorName = ""
        else
            investorName = ""

        if @request.is_firm_dd
            entityName = @current_firm.name + "_"
        else if @request.entity_id and @request.entity_id != ''
            entity = _(@funds).find((fund)=>
                fund.id == @request.entity_id
            )
            if entity
                entityName = entity.name + "_"
            else
                entityName = ""
        else
            entityName = ""

        dateInfo = @Utils.formatDatetime(moment())

        "#{investorName}#{entityName}#{dateInfo}"

    setSuggestedProjectName: =>
        @request.name = @getSuggestedProjectName()
