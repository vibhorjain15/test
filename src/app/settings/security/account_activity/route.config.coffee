angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.settings.security.account_activity',
    url: '/account_activity'
    templateUrl: 'settings/security/account_activity/template.html'
    controller: 'AccountActivityController'
    controllerAs: 'vm'
