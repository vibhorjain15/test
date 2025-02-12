angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.settings.security.two_factor_authentication.intro',
    url: '/intro'
    templateUrl: 'settings/security/two_factor_authentication/intro/template.html'
    controller: 'TwoFactorAuthenticationIntroController'
    controllerAs: 'vm'
