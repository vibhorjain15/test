angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.settings.my_accounts',
    url: '/my-accounts'
    templateUrl: 'settings/my_accounts/template.html'
    controller: 'MyAccountsController'
    controllerAs: 'vm'
