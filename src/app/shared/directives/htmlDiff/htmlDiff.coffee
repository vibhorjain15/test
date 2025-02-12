angular.module('diligenceVault').directive 'htmldiff', ($compile) ->
  restrict: 'A'
  link: (scope, element, attrs) ->
    textProperty = attrs.textProperty
    current = null
    previous = null
    consider_null = angular.isDefined attrs.considerNull

    scope.$watch attrs.current, (value) ->
      current = value

      if textProperty? && current?
        current = current[textProperty]

      if consider_null
        current ||= ''

      render()

    scope.$watch attrs.previous, (value) ->
      previous = value

      if textProperty? && previous?
        previous = previous[textProperty]

      if consider_null
        previous ||= ''

      render()


    render = ->
      if current? and previous?
        element.empty()
        output = htmldiff(previous, current)
        element.append output
