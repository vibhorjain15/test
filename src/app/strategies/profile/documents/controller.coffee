class StrategiesProfileDocumentsController extends BaseController

  @register 'StrategiesProfileDocumentsController'

  @inject 'Utils', '$scope', '$state', '$stateParams', 'ModalFactory', 'DocumentDataservice','angularEnabled'

  initialize: ->
    @subscription = @Utils.getSubscriptionLevel()
    @$scope.StrategiesDocumentsListController = {}
    @strategyId = @$stateParams.strategyId

    @getDocumentCounts(@strategyId)

    @$scope.getStrategy().then (strategy) =>
      @strategy = strategy

  getDocumentCounts: (strategyId) ->
    @DocumentDataservice.getAttachmentAssignmentCount('Strategy', strategyId).then (response) =>
      @documentCount = response.count

  openUploadDocumentModal: ->
    entityId = @$stateParams.strategyId
    @ModalFactory.invokeModal 'manage_document',
      resolve:
        documentOptions: ->
          editAccessGranted: true
          entityType: 'Strategy'
          entityId: entityId
          mode: 'update'
      success: (response) =>
        if response
          @$scope.StrategiesDocumentsListController.documents.refresh()
          @getDocumentCounts(@strategyId)
