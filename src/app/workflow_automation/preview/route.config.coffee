angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.workflow_automation.preview',
    url: '/:Id/preview?entity_id&entity_type'
    templateUrl: 'workflow_automation/preview/template.html'
    controller: 'WorkflowAutomationPreviewController'
    controllerAs: 'vm'