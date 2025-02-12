angular.module('diligenceVault').directive 'workflowPreview', ->
  restrict: 'E'
  controller: 'WorkflowPreviewController'
  controllerAs: 'vm'
  scope: true
  templateUrl: 'shared/directives/workflowPreview/template.html'