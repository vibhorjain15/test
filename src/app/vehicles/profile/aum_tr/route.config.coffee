angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.vehicles.profile.aum_tr',
    url: '/aum_tr'
    templateUrl: 'vehicles/profile/aum_tr/template.html'
    controller: 'VehicleProfileAUMTRController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.firms.funds.vehicles.profile.aum_tr',
    url: '/aum_tr'
    templateUrl: 'vehicles/profile/aum_tr/template.html'
    controller: 'VehicleProfileAUMTRController'
    controllerAs: 'vm'
