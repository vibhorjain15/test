angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.content',
    url: '/content'
    abstract: true
    template: '<ui-view/>'
    hidden_from: ['securityAdmin']
