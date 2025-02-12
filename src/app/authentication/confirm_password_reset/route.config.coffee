angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'authentication.confirm_password_reset',
    url: '/confirm_password_reset?token&email_id'
    views:
      'authentication-view@':
        templateUrl: 'authentication/confirm_password_reset/template.html'
        controller: 'ConfirmPasswordResetController'
        controllerAs: 'vm'
    skip_authorization: true
    title: 'Confirm Password Reset'
