angular.module('diligenceVault').directive 'dvTemplateBuilderSubcategory', ->
  restrict: 'E'
  replace: true
  scope: true
  templateUrl: 'shared/directives/dvTemplateBuilder/directives/dvTemplateBuilderSubcategory/template.html'
  controller: 'DVTemplateBuilderSubcategoryController'
  controllerAs: 'vm'
