angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.settings.account',
    url: '/account'
    templateUrl: 'settings/account/template.html'
    controller: 'AccountSettingsController'
    controllerAs: 'vm'
