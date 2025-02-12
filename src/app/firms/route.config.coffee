angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.firms',
    url: '/firms/:firmId'
    abstract: true
    template: '<ui-view/>'
    hidden_from: ['securityAdmin']
