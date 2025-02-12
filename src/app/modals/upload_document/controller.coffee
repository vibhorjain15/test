class UploadDocumentController extends ModalController
  @register 'UploadDocumentController'

  @inject '$stateParams', '$scope', 'toaster', 'FileHandlerFactory', 'BaseDataService', '$uibModalInstance',
    'entityId', 'entityType', 'DocumentDataservice', '$q', 'Utils', 'FirmDataservice', 'InvestorDataservice',
    'uibButtonConfig'

  initialize: ->
    @uibButtonConfig.activeClass = 'btn-primary'
    @isManager = @Utils.isManager()
    @isInvestor = @Utils.isInvestor()
    @is_freeSubscription = @Utils.isFreeSubscription()
    @maxDate = new Date()
    @maxAsOfDate = @Utils.getMaxAsOfDate()
    @selectedFirms = []
    @selectedInvestors = []
    @shareBasis = 'status'
    @selectedEntities = []
    @statusPlaceholder = "Select #{if @isManager then 'Investor' else 'Firm'} Status"
    allowed_file_extensions = @FileHandlerFactory.getFileTypes()
    @maxFileSize = @FileHandlerFactory.getMaxFileSize()

    if @isManager
      @getAllInvestor()

    if @isInvestor
      @getAllFirms()

    @allowed_file_extensions_str = _(allowed_file_extensions).map((ext) ->
      '.' + ext
    ).join(',')

    @getAttachmentTypes()

    @BaseDataService.getStatuses().then (statuses) =>
      @statuses = statuses

  getAttachmentTypes: () =>
    @BaseDataService.getAttachmentTypes().then (attachmentTypes) =>
      @attachmentTypes = attachmentTypes

  getAllFirms: () =>
    @FirmDataservice.getFirms().then (response) =>
      totalRecords = response.meta.totalRecords
      @FirmDataservice.getFirms({recordsPerPage: totalRecords}).then (response) =>
        @allFirmsList = response.results

  getAllInvestor: () =>
    @InvestorDataservice.getInvestors().then (response) =>
      totalRecords = response.meta.totalRecords
      @InvestorDataservice.getInvestors({recordsPerPage: totalRecords}).then (response) =>
        @allInvestorsList = response.results

  addEntity: () =>
    if @isManager
      if !@checkForDuplicateInvestor(@selectedInvestor)
        @selectedInvestors.push @selectedInvestor
      else
        @toaster.pop 'warning', '', 'You can\'t add same investor twice.'

    if @isInvestor
      if !@checkForDuplicateFirm(@selectedFirm)
        @selectedFirms.push @selectedFirm
      else
        @toaster.pop 'warning', '', 'You can\'t add same firm twice.'

  removeFirm: (firm, idx) =>
    @selectedFirms.splice idx, 1

  removeInvestor: (investor, idx) =>
    @selectedInvestors.splice idx, 1

  checkForDuplicateFirm: (firm) =>
    Boolean(_(@selectedFirms).findWhere(firm))

  checkForDuplicateInvestor: (investor) =>
    Boolean(_(@selectedInvestors).findWhere(investor))

  clearSelection: () ->
    @selectedFirms = []
    @selectedInvestors = []

  uploadDocument: ->
    return unless @uploadDocumentForm.$valid

    unless @files?.length
      @toaster.pop 'error', '', 'Please select a file'
      return

    @params.attachment.tags = JSON.stringify @tags

    @uploadingDocument = true

    file_handler1 = @FileHandlerFactory.get('file-handler-one')
    file_handler2 = @FileHandlerFactory.get('file-handler-two')
    selected_file_handler = {}

    _([file_handler1, file_handler2]).each (handler) =>
      if(handler.files != undefined && handler.files.length > 0 && (handler.files[0].name == @files[0].name))
        selected_file_handler = handler

    if @showShareOptions
      if @shareBasis == 'status'
        promises = []

        _(@selectedStatuses).each (statusId) =>
          promises.push @DocumentDataservice.getFirmRelationships(statusId)

        @$q.all(promises).then (responses) =>
          _(responses).each (response) =>
            _(response).each (firm) =>
              @selectedEntities.push firm.entity_id

          selected_file_handler.upload()
      else
        _(@selectedInvestors).each (investor) =>
          @selectedEntities.push investor.id

        _(@selectedFirms).each (firm) =>
          @selectedEntities.push firm.id

        selected_file_handler.upload()
    else
      @selectedEntities = []
      selected_file_handler.upload()

  documentUploadComplete: (response) =>
    attachmentId = response[0][0].id
    @DocumentDataservice.postAttachmentAssignment(attachmentId, @entityType, @entityId, @selectedEntities).then (response) =>
      @uploadingDocument = false
      @$uibModalInstance.close response

  displaySharePanel: () ->
    @showShareOptions = true

  hideSharePanel: () ->
    @showShareOptions = false

  cancel: (-> @$uibModalInstance.dismiss 'cancel')

