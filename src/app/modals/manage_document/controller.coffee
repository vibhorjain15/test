class DocumentManageController extends ModalController
  @register 'DocumentManageController'

  @inject '$stateParams', 'toaster', '$filter', 'DueDiligenceDataservice', '$state', '$uibModalInstance', 'Restangular', 'BaseDataService','FileHandlerFactory', 'DocumentDataservice', 'FundDataservice', 'FirmDataservice', '$q', 'documentOptions', 'Utils', '$http','baseUrl', '$timeout', 'RestangularHeaderService','keywordConstants','VehicleDataService', 'hierarchyConstants', 'angularEnabled'

  initialize: ->
    @global_hierarchy_option = @hierarchyConstants.Strategy

    @isManager = @Utils.isManager()
    @maxDate = new Date()
    @maxAsOfDate = @Utils.getMaxAsOfDate()
    @entityId = []
    @showToggleButton = true
    @finishingDocsAssignments = false
    @disableFinishButton = true
    @entityType = undefined
    @assignedAttachmentIds = []
    @dict =
      "originalAssigned": {},
      "unassigned": {},
      "newAssigned":{}

    @sourceType = "existing"

    @drop_files = []
    @params = {}
    @files = []
    @params.name = null
    @attachments = []
    @setUploadType('existing')

    @mode = @documentOptions.mode
    @managerCheck = @documentOptions.managerCheck
    @firmId = @Utils.getCurrentFirm().id
    @searchAttachment = ''

    try
      if @mode == '' or @mode == null or @mode == undefined
        throw 'Mode Undefined: Please define `mode` when you invoke this modal.'
    catch err
      console.error err
      return

    allowed_file_extensions = @FileHandlerFactory.getFileTypes()
    @maxFileSize = @FileHandlerFactory.getMaxFileSize()

    # these are the sources from where edit/update call is made
    @onlyNewUploadSources = ['detail' , 'list' , 'documentsEditClick', 'firmDocumentsList']

    @allowed_file_extensions_str = _(allowed_file_extensions).map((ext) ->
      '.' + ext
    ).join(',')

    ### Add common initialization here ###

    ### Use a switch case of initialize specific modals ###

    @loading = true
    promises = []

    switch @mode
      when 'update'
        @editMode = if @documentOptions.document then true else false
        # we dont't need tp depend on source of modal to set the sourceType,
        # we will use edit mode instead. Id edit mode is true then user can only upload new document
        if @editMode
          @showToggleButton = false
          @sourceType = 'new'
        # *************************
        @editAccessGranted = @documentOptions.editAccessGranted
        if @documentOptions.entityId
          @entityId = [@documentOptions.entityId]
        @entityType = @documentOptions.entityType
        @document = @documentOptions.document

        @source = @documentOptions.source

        @showEntityRelatedFields = if (@source == 'all_documents' || @source == 'main_menu_new') then true else false

        if @showEntityRelatedFields
          @entityType = 'Firm'
          promises.push @getFirmsList()

        if @entityType == 'Fund' or @showEntityRelatedFields
          promises.push @getFunds()

        if @entityType == 'Vehicle' or @showEntityRelatedFields
          promises.push @getVehicles()

        if @entityType == 'Strategy' or @showEntityRelatedFields
          promises.push @getAllStrategies()

        @editAccess = if (@editAccessGranted != undefined or @editAccessGranted != null) then @editAccessGranted else true

        if @editMode
          @params =_(@document).pick('name', 'as_of_date', 'type_id', 'tags')

          if @params.as_of_date?
            @params.as_of_date = new Date(@params.as_of_date)


          @uploaded_file =
            name: @document.file_name

        promises.push @getAttachmentTypes()

      when 'new-upload'
        @editMode = if @documentOptions.document then true else false
        @showToggleButton = false
        @editAccess = true
        @setUploadType('new-upload')

        promises.push @getAttachmentTypes()

      when 'add'
        promises.push @getSourcesList()

      when 'update_document_tags'
        @document = @documentOptions.document
        @params = angular.extend({}, @document)

        @params.as_of_date = new Date(@params.as_of_date)
        @params.tag_ids_copy = @params.tag_ids

        promises.push @getFunds()
        promises.push @getAttachmentTypes()

    @$q.all(promises).then (response)=>
      @loading = false
      @getFirmPref()
      if @documentOptions and @documentOptions.entityType
        @setEntityData([@documentOptions.entityId], @documentOptions.entityType)
    ,(error)=>
      @loading = false

  applyMethod: (startDate,endDate)=>
    @getAllDocs(startDate,endDate)

  getFirmPref: =>
    @loading = true
    @Restangular.all('firm_preferences').customGET().then (response) =>
      @predefinedDate = @Utils.getPredefinedDateRanges(response.default_daterange_months)
      @predefinedDate.selectedRange = @Utils.getDateRanges()[response.default_daterange_months].label
      @customDateFilter = angular.copy @predefinedDate
      if !(@mode == 'update' && @editMode)
        if @customDateFilter.selectedRange == 'No Filter'
          @getAllDocs(null,null)
        else
          @getAllDocs(@Utils.formatDatetime(@customDateFilter.startDate),@Utils.formatDatetime(@customDateFilter.endDate))
      @loading = false
    ,(error)=>
      @loading = false

  getAttachmentTypes: () =>
    @BaseDataService.getAttachmentTypes().then (attachmentTypes) =>
      @attachmentTypes = attachmentTypes

  getFirmsList: () =>
    @FirmDataservice.getFirms({skip_pagination: true}).then (firms) =>
      @firms = firms

  getAllStrategies: () ->
    params =
        include_contacts: false,
        include_custom_fields: false,
        include_dates: true,
        is_active: true,
        filters: {}
        search_for: @global_hierarchy_option
    @Restangular.all('service/dvapi_service/product_search').post(params).then (response) =>
        @strategies = angular.copy response.data

  getVehicles: () =>
    @VehicleDataService.getVehicles().then (response) =>
      @vehicles = response

  resetDates: =>
    @customDateFilter = angular.copy @predefinedDate

  enumerateDaysBetweenDates: (startDate, endDate) ->
    now = startDate
    dates = []
    while now.isSameOrBefore(endDate)
      dates.push now.format('M/D/YYYY')
      now.add 1, 'days'
    dates

  filterBetweenDates: (startDate,endDate) =>
    if @copyOfAttachments
      @attachments = JSON.parse(JSON.stringify(@copyOfAttachments))
      startDate = moment(startDate)
      endDate = moment(endDate)
      datesArray =  @enumerateDaysBetweenDates(startDate,endDate)
      testArr = []
      _(@attachments).each (product) ->
        product.as_of_date = moment(product.as_of_date)
        product.as_of_date = product.as_of_date.format('M/D/YYYY')
        if product.as_of_date in datesArray
          testArr.push product
      @attachments = testArr

  setEntityData: (entity_id, entity_type) =>
    @entityId = entity_id
    @entityType = entity_type
    @pageUrl = @generatePageUrl()
    @DocumentDataservice.setDocumentPageUrl(@pageUrl)
    # @getAllDocs(@Utils.formatDatetime(@customDateFilter.startDate),@Utils.formatDatetime(@customDateFilter.endDate))

  generatePageUrl: =>
    pageUrl = ""
    if @entityType.toLowerCase() == @keywordConstants.Firm.toLowerCase()
      _(@entityId).each (entity_id,index)=>
        pageUrl += "app/firms/#{entity_id}/document"
        pageUrl += "," if index != @entityId.length - 1
    else if @entityType.toLowerCase() == @keywordConstants.Product.toLowerCase()
      _(@entityId).each (entity_id,index)=>
        fundIndex = _(@funds).findIndex (fund)=>
          fund.id == Number(entity_id)
        if fundIndex > -1
          firmId = @funds[fundIndex].parentFirm.id
          pageUrl += "app/firms/#{firmId}/funds/#{entity_id}/document"
        else
          pageUrl += "app/funds/#{entity_id}/document"
        pageUrl += "," if index != @entityId.length - 1
    else if @entityType.toLowerCase() == @keywordConstants.Vehicle.toLowerCase()
      _(@entityId).each (entity_id,index)=>
        vehicleIndex = _(@vehicles).findIndex (vehicle)=>
          vehicle.id == Number(entity_id)
        if vehicleIndex > -1
          pageUrl = "app/firms/#{@vehicles[vehicleIndex].firm_id}/funds/#{@vehicles[vehicleIndex].fund_id}/vehicles/#{entity_id}/document"
        else
          pageUrl = "app/vehicles/#{entity_id}/document"
        pageUrl += "," if index != @entityId.length - 1
    pageUrl

  getAllDocs: (startDate, endDate) =>
    @loading = true
    # @$http.get(@baseUrl + '/attachments?sort_by=as_of_date&sort_direction=Ascending&start_date='+startDate+'&end_date='+endDate).then (response) =>
    @RestangularHeaderService.RestangularWithHeader(@pageUrl).all('attachments').getList(sort_by: 'as_of_date', sort_direction: 'Ascending', start_date: startDate, end_date: endDate).then (response) =>
      @attachments = response
      @loading = false
      # Filter by owner_firm_id for current firm
      @attachments = _(@attachments).filter (attachment) =>
        attachment.owner_firm_id == @firmId

      # make a copy of all this firms attachments
      @copyOfAttachments = JSON.parse(JSON.stringify(@attachments))

      @filterByAssociatedEntity(@entityId)
    ,(error)=>
      @loading = false


  setUploadType: (type) ->
    @sourceType = type

  uploadAttachment: (files) ->
    @new_document_uploaded = true
    @files = files

    if files?.length
      @uploaded_file = files[0]


  uploadDropAttachment: () =>
    @new_document_uploaded = true
    @files = @drop_files

    if @drop_files?.length
      @uploaded_file = @drop_files[0]

  ### Refactor this function - This should be the entry point for the form submission function.
      Based of the mode, preprocess params and call appropriate submit function ###
  submit: () ->
    switch @mode
      when 'update'
        @updateDocumentSubmit()
      when 'new-upload'
        @updateDocumentSubmit()
      when 'add'
        @addDocumentSubmit()
      when 'update_document_tags'
        @updateDocumentTagSubmit()

  setDocName: (doc) ->
    if !@params.name
      @params.name = doc[0].name


  updateDocumentSubmit: () =>
    if @editMode
      if @documentForm.$valid and !@rejectedFiles?.length and @uploaded_file?
        @savingDocument = true

        params = _(@params).pick('as_of_date', 'name', 'tags')
        params.tags = JSON.stringify(params.tags)
        params.as_of_date = @$filter('date')(params.as_of_date, 'MM-dd-yyyy')
        id = if @document.attachment_id then @document.attachment_id else @document.id
        @DueDiligenceDataservice.updateAttachment(@files, params, id).then ((response) =>
          @savingDocument = false
          @toaster.pop 'success', '', 'Document successfully updated'
          @close response.data[0]
        ), ((error) =>
          @savingDocument = false
        ), ((evt) =>
          progressPercentage = parseInt(100.0 * evt.loaded / evt.total)
          @progressPercentage = progressPercentage
        )
    else
      return unless @documentForm.$valid

      unless @files?.length
        @toaster.pop 'error', '', 'Please select a file'
        return

      @savingDocument = true

      @updatedParams = _(@params).pick('name', 'tags', 'as_of_date')
      @updatedParams.tags = JSON.stringify(@updatedParams.tags)
      @updatedParams.as_of_date = @$filter('date')(@updatedParams.as_of_date, 'MM-dd-yyyy')

      file_handler1 = @FileHandlerFactory.get('file-handler-one')
      file_handler2 = @FileHandlerFactory.get('file-handler-two')
      selected_file_handler = {}

      _([file_handler1, file_handler2]).each (handler) =>
        if(handler.files != undefined && handler.files.length > 0 && (handler.files[0].name == @files[0].name))
          selected_file_handler = handler

      selected_file_handler.upload()

  documentUploadComplete: (response) =>
    attachmentId = response[0][0].id
    @DocumentDataservice.postAttachmentAssignment(attachmentId, @entityType, @entityId, []).then (response) =>
      @toaster.pop 'success', '', 'Document successfully uploaded'
      @savingDocument = false
      if @source == 'main_menu_new'
        @$state.go 'app.content.document.detail', {documentId: response.attachment_id}
      @close("refresh")

  newDocumentUploadComplete: (response) =>
    @finishingDocsAssignments = true
    @finishingDocsAssignments = false
    @savingDocument = false
    @close(response[0])

  documentUploadCompleteBulk: (response) =>
    attachmentId = response[0][0].id
    @finishingDocsAssignments = true
    params =
      unassigned: Object.keys(@dict.unassigned)
      newassigned: [attachmentId]
      entity_type: @entityType
      Entity_ids: @entityId
      firm_ids: []
    @DocumentDataservice.assignBulkDocuments(params).then ((response) =>
      @toaster.pop 'success', '', 'Document(s) assignments saved'
      @savingDocument = false
      @finishingDocsAssignments = false
      @close "refresh"
    ), ((error) =>
      avoid_error_logging_statuses = @BaseDataService.getAvoidErrorLoggingStatusList()
      @finishingDocsAssignments = false
      @savingDocument = false
      if !(error.status in avoid_error_logging_statuses)
        @Utils.logError('Documents bulk assignment failed', error)
    )

  documentUploadFailed: (response)=>
    @savingDocument = false

  newDocumentUploadFailed: (response)=>
    @savingDocument = false

  removeAttachment: (attachment) ->
    attachment.assigned = false
    if @dict.originalAssigned.hasOwnProperty(attachment.id)
      @dict.unassigned[attachment.id] = attachment.id
      @disableFinishButton = false
      return

    if @dict.newAssigned.hasOwnProperty(attachment.id)
      delete @dict.newAssigned[attachment.id]

    if Object.keys(@dict.unassigned).length == 0 and Object.keys(@dict.newAssigned).length == 0
      @disableFinishButton = true


  assignAttachment: (attachment) ->
    if @entityId and @entityType
      # remove key from unassigned if exist
      if @dict.unassigned.hasOwnProperty(attachment.id)
        delete @dict.unassigned[attachment.id]

      # remove key from new assigned if exist
      if @dict.newAssigned.hasOwnProperty(attachment.id)
        delete @dict.newAssigned[attachment.id]


      if @dict.originalAssigned.hasOwnProperty(attachment.id)
        attachment.assigned = true
        @disableFinishButton = false
        # check if the state is back to where it started
        if Object.keys(@dict.unassigned).length == 0 and Object.keys(@dict.newAssigned).length == 0
          @disableFinishButton = true
        return

      if !@dict.newAssigned.hasOwnProperty(attachment.id) and !@dict.unassigned.hasOwnProperty(attachment.id) and !@dict.originalAssigned.hasOwnProperty(attachment.id)
        attachment.assigned = true
        @disableFinishButton = false
        @dict.newAssigned[attachment.id] = attachment.id


  getAttactments: (id, type) =>
    @entityId = id
    @entityType = type
    @pageUrl = @generatePageUrl()
    @DocumentDataservice.setDocumentPageUrl(@pageUrl)
    if @customDateFilter.selectedRange == 'No Filter'
        @getAllDocs(null,null)
      else
        @getAllDocs(@Utils.formatDatetime(@customDateFilter.startDate),@Utils.formatDatetime(@customDateFilter.endDate))

  filterByAssociatedEntity: (entityId) =>
    @assignedAttachmentIds = []
    @entityId = entityId
    typeOfEntity = @entityType.toUpperCase()
    @disableFinishButton = true
    @dict =
      "originalAssigned": {},
      "unassigned": {},
      "newAssigned":{}

    @attachments = _(@attachments).each (attachment) =>
      attachment.assigned = false
      if typeOfEntity == 'FUND'
        if @entityId.some(value => attachment.associated_funds.includes(value))
          @dict.originalAssigned[attachment.id] = attachment.id
          attachment.assigned = true
      else if typeOfEntity == 'FIRM'
        if @entityId.some(value => attachment.associated_firms.includes(value))
          @assignedAttachmentIds.push attachment.id
          @dict.originalAssigned[attachment.id] = attachment.id
          attachment.assigned = true
      else if typeOfEntity == 'DUEDILIGENCE'
         if @entityId.some(value => attachment.associated_duediligences.includes(value))
          @assignedAttachmentIds.push attachment.id
          @dict.originalAssigned[attachment.id] = attachment.id
          attachment.assigned = true
      else if typeOfEntity == 'MEETING'
        if @entityId.some(value => attachment.associated_meetings.includes(value))
          @assignedAttachmentIds.push attachment.id
          @dict.originalAssigned[attachment.id] = attachment.id
          attachment.assigned = true
      else if typeOfEntity == 'VEHICLE'
        if @entityId.some(value => attachment.associated_vehicles.includes(value))
          @assignedAttachmentIds.push attachment.id
          @dict.originalAssigned[attachment.id] = attachment.id
          attachment.assigned = true
      else
          #let's log error here and slack notification perhaps?

  finishAssignDocuments: ->
    if Object.keys(@dict.unassigned).length > 0 or Object.keys(@dict.newAssigned).length > 0
      @finishingDocsAssignments = true
      params =
        unassigned: Object.keys(@dict.unassigned)
        newassigned: Object.keys(@dict.newAssigned)
        entity_type: @entityType
        Entity_ids: @entityId
        firm_ids: []
      @DocumentDataservice.assignBulkDocuments(params).then ((response) =>
        @toaster.pop 'success', '', 'Document(s) assignments saved'
        @finishingDocsAssignments = false
        @close "refresh"
      ), ((error) =>
        avoid_error_logging_statuses = @BaseDataService.getAvoidErrorLoggingStatusList()
        @finishingDocsAssignments = false
        if !(error.status in avoid_error_logging_statuses)
          @Utils.logError('Documents bulk assignment failed', error)
      )

  getSourcesList: =>
    @Restangular.all('document_sources').getList().then (response) =>
      @sources_options = response

  deleteFile: (idx) =>
    @files.splice(idx, 1)

  getDocumentUploadResponse: (response) =>
    @toaster.pop 'success', '', 'Document(s) successfully uploaded'
    @loading = false
    @close('refresh')

  handleUploadError: (response) =>
    @loading = false

  addDocumentSubmit: () =>
    return unless @documentForm.$valid

    unless @files?.length
      @toaster.pop 'error', '', 'Please select at least one file'
      return

    @params.as_of_date = @Utils.getLocalDateTime(@params.as_of_date).toDate()
    @savingDocument = true
    file_handler1 = @FileHandlerFactory.get('file-handler-one')
    file_handler2 = @FileHandlerFactory.get('file-handler-two')
    selected_file_handler = {}

    _([file_handler1, file_handler2]).each (handler) =>
      if(handler != undefined && handler.files != undefined && handler.files.length > 0 && (handler.files[0].name == @files[0].name))
        selected_file_handler = handler
    selected_file_handler.upload()

  ### Update Document Tags related Functions ###

  getFunds: ->
    @FundDataservice.getFunds().then (response) =>
      @funds = response

  updateDocumentTagSubmit: () =>
    return unless @documentForm.$valid

    @params.tag_ids = []
    _(@params.tag_ids_copy).each (tag) =>
      @params.tag_ids.push(tag.value)
    @params.as_of_date = @Utils.getLocalDateTime(@params.as_of_date).toDate()
    @savingDocument = true
    @Restangular.one('document_queue', @document.id ).customPUT(@params).then (response) =>
      @savingDocument = false
      @toaster.pop 'success', '', 'Document tags successfully updated'
      @close('refresh')
    , => @savingDocument = false


  customCloseModal: ->
    @close()

  updateApproveDocumentSubmit: () =>
    return unless @documentForm.$valid

    @params.tag_ids = []
    _(@params.tag_ids_copy).each (tag) =>
      @params.tag_ids.push(tag)

    @approvingDocument = true
    promises = []
    promises.push @Restangular.one('document_queue', @document.id ).customPUT @params

    @$q.all(promises).then =>
      approve_params =
        entity_type: 'Document'
        entities: []
      approve_params.entities.push({entity_id: @document.id})
      @Restangular.one('workflow_audits').customPOST(approve_params).then (response) =>
        @approving_document = false
        @toaster.pop 'success', '', 'Documents successfully updated and approved'
        @close('refresh')
      , => @approvingDocument = false
    , => @approvingDocument = false
