# this is when you cannot use overflow: text-ellipsis solution because that requires width/min-width to be set
angular.module('diligenceVault').directive 'truncateText', ($timeout) ->
  restrict: 'A'
  link: (scope, element, attrs) ->
    $timeout ->
      text = element.text().trim()
      limit = Number(attrs.truncateText)

      if text.length > limit
        element.attr('title', text)
        element.text(text.slice(0, limit - 3) + "...")
