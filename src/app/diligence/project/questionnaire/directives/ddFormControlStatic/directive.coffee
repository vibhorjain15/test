angular.module('diligenceVault').directive 'ddFormControlStatic', ->
  restrict: 'E'
  templateUrl: 'diligence/project/questionnaire/directives/ddFormControlStatic/template.html'
  link: (scope) ->
    scope.responseDisplay = scope.response.responseDisplay
