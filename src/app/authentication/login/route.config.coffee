angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'authentication.login',
    url: '/login?redirectToState&redirectToParams&email&token&firm_id&error_message&from_extension&from_office_extension&redirectId'
    views:
      'authentication-view@':
        templateUrl: 'authentication/login/template.html'
        controller: 'LoginController'
        controllerAs: 'vm'
    skip_authorization: true
    title: 'Login'
