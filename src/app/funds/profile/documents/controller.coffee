class FundsProfileDocumentsController extends BaseController

  @register 'FundsProfileDocumentsController'

  @inject 'Utils', '$scope', '$state', '$stateParams', 'ModalFactory', 'DocumentDataservice','angularEnabled'

  initialize: ->
    @subscription = @Utils.getSubscriptionLevel()
    @$scope.FundsDocumentsListController = {}
    @fundId = @$stateParams.fundId

    @getDocumentCounts(@fundId)

    @$scope.getFund().then (fund) =>
      @fund = fund

  getDocumentCounts: (fundId) ->
    @DocumentDataservice.getAttachmentAssignmentCount('Fund', fundId).then (response) =>
      @documentCount = response.count

  openUploadDocumentModal: ->
    entityId = @$stateParams.fundId
    @ModalFactory.invokeModal 'manage_document',
      resolve:
        documentOptions: ->
          editAccessGranted: true
          entityType: 'Fund'
          entityId: entityId
          mode: 'update'
      success: (response) =>
        if response
          @$scope.FundsDocumentsListController.documents.refresh()
          @getDocumentCounts(@fundId)
