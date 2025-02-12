angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.monitor.firms',
    url: '/firms'
    templateUrl: 'monitor/firms/template.html'
    controller: 'MonitorFirmsController'
    controllerAs: 'vm'
