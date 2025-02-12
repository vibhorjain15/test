angular.module('diligenceVault').directive 'onScrollComplete', ($parse, $timeout) ->
  restrict: 'A'
  link: (scope, element, attrs) ->
    expressionHandler = $parse(attrs.onScrollComplete)

    invokeExpression = -> expressionHandler(scope, {})

    $timeout ->
      if element[0].scrollHeight <= element.outerHeight()
        invokeExpression()

    $(element).scroll ->
      $el = $(@)
      if Math.ceil($el[0].scrollHeight - $el.scrollTop()) < Math.ceil($el.outerHeight() + 5)
        $timeout -> invokeExpression()
