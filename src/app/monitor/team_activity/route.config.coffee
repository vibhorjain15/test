angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.monitor.team_activity',
    url: '/team_activity'
    templateUrl: 'monitor/team_activity/template.html'
    controller: 'TeamActivityController'
    controllerAs: 'vm'
    title: 'Team Activity'
