class VehicleProfileVehiclesController extends BaseController
  @register 'VehicleProfileVehiclesController'

  @inject '$stateParams', '$scope', 'Utils', 'VehicleDataService', 'statusLabel','angularEnabled'

  initialize: ->
    @firmId = @$stateParams.firmId
    @fundId = @$stateParams.fundId
    @vehicleId = @$stateParams.vehicleId
    @is_manager = @Utils.isManager()
    @isFreeSubscription = @Utils.isFreeSubscription()

    @$scope.getVehicle().then (vehicle) =>
      @vehicle = vehicle

    @getRelatedVehicles()


  getRelatedVehicles: ->

    @VehicleDataService.getRelatedVehicles(@firmId, @fundId, @vehicleId).then (response) =>
      @related_entities = response
