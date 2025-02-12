angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.monitor.my_firm.profile.monitor_firm',
    url: '/monitor_firm'
    templateUrl: 'monitor/my_firm/profile/monitor_firm/template.html'
    controller: 'MyFirmProfileMonitorController'
    controllerAs: 'vm'
