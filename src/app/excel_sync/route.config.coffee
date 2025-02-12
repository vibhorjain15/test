angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.excel_sync',
    url: '/excel_sync'
    abstract: true
    template: '<ui-view />'
    hidden_from: ['securityAdmin']
