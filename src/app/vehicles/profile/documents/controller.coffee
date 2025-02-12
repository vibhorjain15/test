class VehiclesProfileDocumentsController extends BaseController

  @register 'VehiclesProfileDocumentsController'

  @inject 'Utils', '$scope', '$state', '$stateParams', 'ModalFactory', 'DocumentDataservice','angularEnabled'

  initialize: ->
    @subscription = @Utils.getSubscriptionLevel()
    @$scope.VehiclesDocumentsListController = {}
    @vehicleId = @$stateParams.vehicleId

    @getDocumentCounts(@vehicleId)

    @$scope.getVehicle().then (vehicle) =>
      @vehicle = vehicle

  getDocumentCounts: (vehicleId) ->
    @DocumentDataservice.getAttachmentAssignmentCount('Vehicle', vehicleId).then (response) =>
      @documentCount = response.count

  openUploadDocumentModal: ->
    entityId = @$stateParams.vehicleId
    @ModalFactory.invokeModal 'manage_document',
      resolve:
        documentOptions: ->
          editAccessGranted: true
          entityType: 'Vehicle'
          entityId: entityId
          mode: 'update'
      success: (response) =>
        if response
          @$scope.VehiclesDocumentsListController.documents.refresh()
          @getDocumentCounts(@vehicleId)
