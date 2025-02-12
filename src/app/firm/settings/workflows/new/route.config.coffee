angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.firm.settings.workflows.new',
    url: '/new'
    templateUrl: 'firm/settings/workflows/new/template.html'
    controller: 'WorkflowNewController'
    controllerAs: 'vm'
