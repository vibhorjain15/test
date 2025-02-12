angular.module('diligenceVault').directive 'humanize', ->
  restrict: 'A'
  link: (scope, element, attrs) ->
    method = Humanize[attrs.humanize]
    args = (attrs.humanizeArgs || '').split(',')

    if method?
      scope.$watch attrs.humanizeInput, (value) ->
        argsCopy = angular.copy args
        argsCopy.unshift(value)
        element.text(method.apply(Humanize, argsCopy))
