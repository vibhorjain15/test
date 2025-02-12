angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.monitor.vehicles',
    url: '/vehicles'
    controller: 'MonitorVehiclesController'
    controllerAs: 'vm'
    templateUrl: 'monitor/vehicles/template.html'
