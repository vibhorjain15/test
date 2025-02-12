angular.module('diligenceVault').directive 'workflowBuilder', ->
  restrict: 'E'
  controller: 'WorkflowBuilderController'
  controllerAs: 'vm'
  scope: true
  templateUrl: 'shared/directives/workflowBuilder/template.html'

