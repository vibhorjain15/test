angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'authentication.activate',
    url: '/activate?token'
    views:
      'authentication-view@':
        templateUrl: 'authentication/activate/template.html'
        controller: 'ActivateController'
        controllerAs: 'vm'
    skip_authorization: true
    data:
      title: 'Activate Your DiligenceVault Account'
