angular.module('diligenceVault').directive 'selectAllText', ($timeout) ->
  restrict: 'A'
  link: (scope, element) ->
    $timeout -> element.select()
