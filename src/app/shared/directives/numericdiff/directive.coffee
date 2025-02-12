angular.module('diligenceVault').directive 'numericdiff', ->
  restrict: 'A'
  templateUrl: 'shared/directives/numericdiff/template.html'
  scope:
    current: '='
    previous: '='
