angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.reports.realtime-reports.detail',
    abstract: true
    url: '/:reportId'
    template: '<ui-view />'
