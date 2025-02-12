angular.module('diligenceVault').directive 'focusMe', ($timeout) ->
  restrict: 'A'
  link: (scope, element, attrs) ->
    scope.$watch attrs.focusMe, (value) ->
      if value
        $timeout -> element.focus()
