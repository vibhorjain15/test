angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.firm.settings.workflows.detail',
    abstract: true
    url: '/:workflowId'
    templateUrl: 'firm/settings/workflows/detail/template.html'
    controller: 'WorkflowsDetailController'
    controllerAs: 'vm'