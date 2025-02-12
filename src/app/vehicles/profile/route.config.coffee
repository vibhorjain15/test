angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.vehicles.profile',
    url: '/profile'
    templateUrl: 'vehicles/profile/template.html'
    controller: 'VehicleProfileController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.firms.funds.vehicles.profile',
    url: '/profile'
    template: '<ng2-entity-tabs></ng2-entity-tabs>'
