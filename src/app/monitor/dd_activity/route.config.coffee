angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.monitor.dd_activity',
    url: '/dd_activity'
    templateUrl: 'monitor/dd_activity/template.html'
    controller: 'DDActivityController'
    controllerAs: 'vm'
    title: 'Diligence Activity'
