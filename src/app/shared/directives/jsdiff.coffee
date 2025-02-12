angular.module('diligenceVault').directive 'jsdiff', ($compile) ->
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
        tokens = Diff.diffWordsWithSpace(previous, current)

        element.empty()

        angular.forEach tokens, (token) ->
          value = token.value

          if /^\n+$/.test(value)
            value = value.replace(/\n/g, ' \n')

          if token.added
            element.append "<ins>#{value}</ins>"
          else if token.removed
            element.append "<del>#{value}</del>"
          else
            element.append "<span>#{value}</span>"
