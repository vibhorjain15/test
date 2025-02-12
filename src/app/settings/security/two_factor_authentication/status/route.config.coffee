angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.settings.security.two_factor_authentication.status',
    url: '/status'
    templateUrl: 'settings/security/two_factor_authentication/status/template.html'
    controller: 'TwoFactorAuthenticationStatusController'
    controllerAs: 'vm'
