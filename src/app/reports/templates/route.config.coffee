angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.reports.templates',
    url: '/templates'
    abstract: true
    template: '<ui-view />'
