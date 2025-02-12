angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.reports.templates.list.preview',
    url: '/:templateId/preview'
    templateUrl: 'reports/templates/list/preview/template.html'
    controller: 'ReportTemplatesListPreviewController'
    controllerAs: 'vm'
    hidden_from: ['manager']
