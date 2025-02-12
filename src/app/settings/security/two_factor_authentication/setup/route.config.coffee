angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.settings.security.two_factor_authentication.setup',
    url: '/setup'
    templateUrl: 'settings/security/two_factor_authentication/setup/template.html'
    controller: 'TwoFactorAuthenticationSetupController'
    controllerAs: 'vm'
