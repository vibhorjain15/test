angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.vehicles.profile.related_vehicles',
    url: '/related_vehicles'
    templateUrl: 'vehicles/profile/related_vehicles/template.html'
    controller: 'VehicleProfileVehiclesController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.firms.funds.vehicles.profile.related_vehicles',
    url: '/related_vehicles'
    templateUrl: 'vehicles/profile/related_vehicles/template.html'
    controller: 'VehicleProfileVehiclesController'
    controllerAs: 'vm'
