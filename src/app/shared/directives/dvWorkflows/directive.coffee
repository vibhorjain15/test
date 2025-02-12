angular.module('diligenceVault').directive 'dvWorkflows', ->
  restrict: 'E'
  scope: true
  templateUrl: 'shared/directives/dvWorkflows/template.html'
  controller: 'DvWorkflowsController'
  controllerAs: 'vm'
