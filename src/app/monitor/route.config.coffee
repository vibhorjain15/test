angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.monitor',
    url: '/monitor'
    abstract: true
    template: '<ui-view/>'
    hidden_from: ['securityAdmin']