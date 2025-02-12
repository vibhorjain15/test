angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.monitor.investments',
    url: '/investments'
    templateUrl: 'monitor/investments/template.html'
    controller: 'MonitorInvestmentsController'
    controllerAs: 'vm'
