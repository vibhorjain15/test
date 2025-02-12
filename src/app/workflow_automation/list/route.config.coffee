angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'monitor.workflow_automation.list',
    url: '/list'
    templateUrl: 'workflow_automation/list/template.html'
    controller: 'WorkflowAutomationListController'
    controllerAs: 'vm'