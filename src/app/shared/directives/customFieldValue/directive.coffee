angular.module('diligenceVault').directive 'customFieldValue', ->
  restrict: 'E'
  scope:
    field: '='
  templateUrl: 'shared/directives/customFieldValue/template.html'
  controller: 'CustomFieldValueController'
  controllerAs: 'vm'
  replace: true
