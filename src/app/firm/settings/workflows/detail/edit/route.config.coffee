angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.firm.settings.workflows.detail.edit',
    url: '/edit'
    templateUrl: 'firm/settings/workflows/detail/edit/template.html'
    controller: 'WorkflowsDetailEditController'
    controllerAs: 'vm'
