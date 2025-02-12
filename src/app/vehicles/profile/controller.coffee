class VehicleProfileController extends BaseController

  @register 'VehicleProfileController'

  @inject '$stateParams', 'Restangular', '$state', 'Utils', '$scope', '$q','VehicleDataService'

  initialize: ->
    @firmId = @$stateParams.firmId
    @fundId = @$stateParams.fundId
    @vehicleId = @$stateParams.vehicleId

    @FreeSubscription = @Utils.isFreeSubscription()

    @$scope.getVehicle = @getVehicle
    @issue_tracker_default_name = ''
    @getFirmPref()

  getFirmPref: =>
    @loading_prefs = true
    @Restangular.all('firm_preferences').customGET().then (response) =>
      @issue_tracker_default_name = response.issue_tracker_default_name
      @loading_prefs = false
      
  getVehicle: () =>
    deferred = @$q.defer()
    @VehicleDataService.getVehicle(@firmId,@fundId,@vehicleId).then (response) =>
      deferred.resolve(response)
    deferred.promise
  
  

  
  