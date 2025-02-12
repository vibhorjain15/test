angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'authentication.begin_password_reset',
    url: '/begin_password_reset?userName'
    views:
      'authentication-view@':
        templateUrl: 'authentication/begin_password_reset/template.html'
        controller: 'BeginPasswordResetController'
        controllerAs: 'vm'
    skip_authorization: true
    title: 'Begin Password Reset'
