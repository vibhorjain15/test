angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.platform_activity',
    url: '/platform_activity'
    templateUrl: 'diligence/platform_activity/template.html'
    controller: 'PlatformActivityController'
    controllerAs: 'vm'
    title: 'Platform Activity'
