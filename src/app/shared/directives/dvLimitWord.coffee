angular.module('diligenceVault').directive 'dvLimitWord', ->
  restrict: 'A'
  link: (scope, element, attrs) ->
    limit = parseInt(attrs.charLimit, 10)

    scope.$watch attrs.dvLimitWord, (content) ->
      return unless content?

      if content.length > limit
        element.text(content.slice(0, limit - 3) + "...")
        element.attr('title', content)
      else
        element.text(content)
