angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.reports',
    url: '/reports'
    abstract: true
    template: '<ui-view />'
    hidden_from: ['securityAdmin', 'manager']
