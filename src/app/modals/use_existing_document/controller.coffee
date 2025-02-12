class UseExistingDocumentController extends ModalController
    @register 'UseExistingDocumentController'

    @inject '$stateParams', 'toaster', '$state', 'Restangular','FileHandlerFactory', 'DocumentsService','Utils'

    initialize: ->
        @firmId = @Utils.getCurrentFirm().id
        @dict =
            "originalAssigned": {},
            "unassigned": {},
            "newAssigned":{}
        @getFirmPref()

    getFirmPref: =>
        @loading = true
        @Restangular.all('firm_preferences').customGET().then (response) =>
            @predefinedDate = @Utils.getPredefinedDateRanges(response.default_daterange_months)
            @predefinedDate.selectedRange = @Utils.getDateRanges()[response.default_daterange_months].label
            @customDateFilter = angular.copy @predefinedDate
            if @customDateFilter.selectedRange == 'No Filter'
                @getAllDocs(null,null)
            else
                @getAllDocs(@Utils.formatDatetime(@customDateFilter.startDate),@Utils.formatDatetime(@customDateFilter.endDate))
        ,(error)=>
            @loading = false

    applyMethod: (startDate,endDate)=>
        @getAllDocs(startDate,endDate)

    getAllDocs: (startDate, endDate) =>
        @loading = true
        # @$http.get(@baseUrl + '/attachments?sort_by=as_of_date&sort_direction=Ascending&start_date='+startDate+'&end_date='+endDate).then (response) =>
        @Restangular.all('attachments').getList(sort_by: 'as_of_date', sort_direction: 'Ascending', start_date: startDate, end_date: endDate).then (response) =>
            @attachments = response
            @loading = false
            # Filter by owner_firm_id for current firm
            @attachments = _(@attachments).filter (attachment) =>
                attachment.owner_firm_id == @firmId

            # make a copy of all this firms attachments
            @copyOfAttachments = JSON.parse(JSON.stringify(@attachments))
        ,(error)=>
            @loading = false

    removeAttachment: (attachment) ->
        attachment.assigned = false

    assignAttachment: (attachment) ->
        attachment.assigned = true

    submit: =>
        attachedAssignments = _(@attachments).filter (attachment)=>
            attachment.assigned

        @close(attachedAssignments)