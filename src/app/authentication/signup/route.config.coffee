angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'authentication.signup',
    url: '/signup?redirectId&username'
    views:
      'authentication-view@':
        templateUrl: 'authentication/signup/template.html'
        controller: 'SignupController'
        controllerAs: 'vm'
    skip_authorization: true
    title: 'Signup'
