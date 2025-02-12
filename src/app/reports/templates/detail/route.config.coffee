angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.reports.templates.detail',
    abstract: true
    url: '/:templateId'
    template: '<ui-view />'
