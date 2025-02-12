class ShareDocumentController extends ModalController
  @register 'ShareDocumentController'

  @inject '$uibModalInstance', 'Utils', 'InvestorDataservice', 'FirmDataservice', 'BaseDataService', 'toaster',
    'DocumentDataservice', '$q', 'document', 'entityId', 'entityType', 'uibButtonConfig','Restangular'

  initialize: ->
    @uibButtonConfig.activeClass = 'btn-primary'
    @isManager = @Utils.isManager()
    @isInvestor = @Utils.isInvestor()
    @selectedFirms = []
    @selectedInvestors = []
    @shareBasis = 'status'
    @selectedEntities = []
    @selectedStatuses = []
    @statusPlaceholder = "Select #{if @isManager then 'Investor' else 'Firm'} Status"

    @BaseDataService.getStatuses().then (statuses) =>
      @statuses = statuses

    @getAllFirms()

  shareDocument: ->
    if (!(@selectedStatuses.length or @selectedInvestors.length or @selectedFirms.length))
      return

    @sharingDocument = true

    if @shareBasis == 'status'
      promises = []

      _(@selectedStatuses).each (statusId) =>
        promises.push @DocumentDataservice.getFirmRelationships(statusId)

      @$q.all(promises).then (responses) =>
        _(responses).each (response) =>
          _(response).each (firm) =>
            @selectedEntities.push firm.entity_id

        @submitShareDocumentForm()
    else
      _(@selectedInvestors).each (investor) =>
        @selectedEntities.push investor.id

      _(@selectedFirms).each (firm) =>
        @selectedEntities.push firm.id

      @submitShareDocumentForm()

  submitShareDocumentForm: () ->
    @DocumentDataservice.postAttachmentAssignment(@document.attachment_id, @entityType, @entityId, @selectedEntities).then((response) =>
      @toaster.pop 'success', '', 'Document successfully shared'
      @$uibModalInstance.close response
    ).finally(=>
      @sharingDocument = false
    )

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

  getAllFirms: () =>
    params =
      include_contacts: false,
      include_custom_fields: false,
      include_dates: true,
      is_active: true,
      filters: {}
    @Restangular.all('service/dvapi_service/firm_search').post(params).then (response) =>
      if @isManager
        @allInvestorsList = response.data
      else
        @allFirmsList = response.data

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

  cancel: (-> @$uibModalInstance.dismiss 'cancel')

