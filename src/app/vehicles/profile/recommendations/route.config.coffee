angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.vehicles.profile.recommendations',
    url: '/recommendations?recommendationId'
    templateUrl: 'vehicles/profile/recommendations/template.html'
    controller: 'VehicleProfileRecommendationsController'
    controllerAs: 'vm'
angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.firms.funds.vehicles.profile.recommendations',
    url: '/recommendations?recommendationId'
    templateUrl: 'vehicles/profile/recommendations/template.html'
    controller: 'VehicleProfileRecommendationsController'
    controllerAs: 'vm'
