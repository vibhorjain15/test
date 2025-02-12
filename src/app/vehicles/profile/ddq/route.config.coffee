angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.vehicles.profile.ddq',
    url: '/ddq'
    templateUrl: 'vehicles/profile/ddq/template.html'
    controller: 'VehicleProfileDDQController'
    controllerAs: 'vm'
angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.firms.funds.vehicles.profile.ddq',
    url: '/ddq'
    templateUrl: 'vehicles/profile/ddq/template.html'
    controller: 'VehicleProfileDDQController'
    controllerAs: 'vm'