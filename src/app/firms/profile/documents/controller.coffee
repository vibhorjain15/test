class FirmsProfileDocumentsController extends BaseController

  @register 'FirmsProfileDocumentsController'

  @inject 'Utils', '$scope', '$state', '$stateParams', 'ModalFactory', 'uibButtonConfig', 'DocumentDataservice','angularEnabled'

  initialize: ->
    @subscription = @Utils.getSubscriptionLevel()
    @uibButtonConfig.activeClass = 'btn-primary'
    @$scope.FirmsDocumentsListController = {}
    @firmId = @$stateParams.firmId

    @getDocumentCounts(@firmId)

    @$scope.getFirm().then (firm) =>
      @firm = firm

  getDocumentCounts: (firmId) ->
    @DocumentDataservice.getAttachmentAssignmentCount('Firm', firmId).then (response) =>
      @documentCount = response.count

  openUploadDocumentModal: ->
    entityId = @$stateParams.firmId
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