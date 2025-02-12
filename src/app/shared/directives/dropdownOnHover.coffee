angular.module('diligenceVault').directive 'dropdownOnHover', ($timeout) ->
  restrict: 'A'
  link: (scope, element, attrs) ->
    timer = null

    cancelTimer = ->
      $timeout.cancel(timer) if timer?

    element.on 'mouseenter', ->
      timer = $timeout ->
        element.addClass('open')
        promise = null
      , 200

    element.on 'mouseleave', ->
      cancelTimer()
      element.removeClass('open')

    if attrs.targetSelector?
      element.on 'click', attrs.targetSelector, (e) ->
        element.removeClass('open')

    scope.$on '$destroy', cancelTimer
