angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.funds.profile.vehicles',
    url: '/vehicles'
    templateUrl: 'funds/profile/vehicles/template.html'
    controller: 'FundProfileVehiclesController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.firms.funds.profile.vehicles',
    url: '/vehicles'
    templateUrl: 'funds/profile/vehicles/template.html'
    controller: 'FundProfileVehiclesController'
    controllerAs: 'vm'
