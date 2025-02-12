angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.analyze.platform_activity',
    url: '/platform_activity'
    templateUrl: 'analyze/platform_activity/template.html'
    controller: 'PlatformActivityController'
    controllerAs: 'vm'
    hidden_from: ['securityAdmin','manager']
