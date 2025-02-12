class MyFirmProfileDocumentsController extends BaseController

  @register 'MyFirmProfileDocumentsController'

  @inject 'Utils', '$scope', '$state', '$stateParams', 'ModalFactory', 'uibButtonConfig', 'DocumentDataservice'

  initialize: ->
    @firmId = @Utils.getCurrentFirm().id
    @subscription = @Utils.getSubscriptionLevel()
    @uibButtonConfig.activeClass = 'btn-primary'
    @$scope.FirmsDocumentsListController = {}

    @getDocumentCounts(@firmId)

    @$scope.getFirm().then (firm) =>
      @firm = firm

  getDocumentCounts: (firmId) ->
    @DocumentDataservice.getAttachmentAssignmentCount('Firm', firmId).then (response) =>
      @documentCount = response.count

  openUploadDocumentModal: ->
    entityId = @firmId
    @ModalFactory.invokeModal 'manage_document',
      resolve:
        documentOptions: ->
          editAccessGranted: true
          entityType: 'Firm'
          entityId: entityId
          mode: 'update'
      success: (response) =>
        if response
          @$scope.FirmsDocumentsListController.documents.refresh()
          @getDocumentCounts(@firmId)
