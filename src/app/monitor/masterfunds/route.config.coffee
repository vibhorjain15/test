angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.monitor.strategies',
    url: '/strategies'
    controller: 'MonitorMasterFundsController'
    controllerAs: 'vm'
    templateUrl: 'monitor/masterfunds/template.html'
