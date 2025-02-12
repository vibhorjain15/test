angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.share_class_tables',
    url: '/share_class_tables/:shareClassTableId'
    template: "<ui-view />"
    abstract: true
    hidden_from: ['securityAdmin']
