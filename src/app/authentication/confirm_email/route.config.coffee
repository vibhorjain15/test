angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'authentication.confirm_email',
    url: '/confirm_email?token&emailId&redirectId'
    views:
      'authentication-view@':
        templateUrl: 'authentication/confirm_email/template.html'
        controller: 'ConfirmEmailController'
        controllerAs: 'vm'
    skip_authorization: true
    title: 'Confirm Email'
