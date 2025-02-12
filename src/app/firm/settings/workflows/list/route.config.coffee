angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.firm.settings.workflows.list',
    url: '/list'
    templateUrl: 'firm/settings/workflows/list/template.html'
    controller: 'WorkflowsListController'
    controllerAs: 'vm'
