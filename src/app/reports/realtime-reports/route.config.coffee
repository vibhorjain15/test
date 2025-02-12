angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.reports.realtime-reports',
    url: '/realtime-reports'
    abstract: true
    template: '<ui-view />'
