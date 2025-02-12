angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.excel_sync',
    url: '/excel_sync'
    abstract: true
    template: '<ui-view />'
