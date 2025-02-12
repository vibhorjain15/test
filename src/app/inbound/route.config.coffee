angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.inbound',
    url: '/inbound'
    abstract: true
    template: '<ui-view />'
    accessible_to: ['manager']
    hidden_from: ['securityAdmin']
