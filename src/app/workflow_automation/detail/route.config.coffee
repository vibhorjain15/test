angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.workflow_automation.detail',
    url: '/:Id/detail?action_id&workflow_steps_actions_id'
    templateUrl: 'workflow_automation/detail/template.html'
    controller: 'WorkflowAutomationDetailController'
    controllerAs: 'vm'