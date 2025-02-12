angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.reports.templates.detail.preview',
    url: '/preview'
    templateUrl: 'reports/templates/detail/preview/template.html'
    controller: 'ReportsTemplatesDetailPreviewController'
    controllerAs: 'vm'
