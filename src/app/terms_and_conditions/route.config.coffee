angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.terms-and-conditions',
    url: '/terms-and-conditions'
    template: '<ng2-terms-and-conditions></ng2-terms-and-conditions>'
