angular.module('diligenceVault').directive 'dvTrigger', ($timeout) ->
  restrict: 'A'
  link: (scope, element, attrs) ->
    attrs.$observe 'dvTrigger', (obj) ->
      angular.forEach scope.$eval(obj), (value, key) ->
        if value
          $timeout -> element.trigger(key)
