angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.firm.settings.workflows.detail.preview',
    url: '/preview'
    templateUrl: 'firm/settings/workflows/detail/preview/template.html'
    controller: 'WorkflowsDetailPreviewController'
    controllerAs: 'vm'
