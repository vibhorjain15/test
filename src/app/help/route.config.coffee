angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.help',
    url: '/help'
    abstract: true
    template: '<ui-view/>'
    hidden_from: ['securityAdmin']