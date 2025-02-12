angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.settings.security.my_token',
    url: '/my_token'
    templateUrl: 'settings/security/my_token/template.html'
    controller: 'MyTokenController'
    controllerAs: 'vm'
