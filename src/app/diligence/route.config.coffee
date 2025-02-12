angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.diligence',
    url: '/diligence'
    abstract: true
    template: '<ui-view/>'
    hidden_from: ['securityAdmin']
