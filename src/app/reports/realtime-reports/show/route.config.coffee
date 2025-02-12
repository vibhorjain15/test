angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.reports.realtime-reports.show',
    abstract: true
    url: '/:reportId/show'
    template: '<ui-view />'
