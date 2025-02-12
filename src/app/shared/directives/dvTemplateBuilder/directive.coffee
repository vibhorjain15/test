angular.module('diligenceVault').directive 'dvTemplateBuilder', ->
  restrict: 'E'
  templateUrl: 'shared/directives/dvTemplateBuilder/template.html'
  controller: 'DvTemplateBuilderController'
  controllerAs: 'vm'
  scope: true
