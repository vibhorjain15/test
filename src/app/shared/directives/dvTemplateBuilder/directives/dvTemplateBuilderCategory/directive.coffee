angular.module('diligenceVault').directive 'dvTemplateBuilderCategory', ->
  restrict: 'E'
  replace: true
  scope: true
  templateUrl: 'shared/directives/dvTemplateBuilder/directives/dvTemplateBuilderCategory/template.html'
  controller: 'DVTemplateBuilderCategoryController'
  controllerAs: 'vm'
