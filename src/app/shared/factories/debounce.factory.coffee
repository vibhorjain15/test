angular.module('diligenceVault').factory 'debounce', ($timeout) ->
  (fn, wait, immediate) ->
    timeout = null
    context = null
    args = null

    debounceTimeout = ->
      timeout = null

      fn.apply(context, args) unless immediate

    ->
      context = @
      args = arguments
      callNow = immediate && !timeout

      $timeout.cancel(timeout)
      timeout = $timeout(debounceTimeout, wait)

      fn.apply(context, args) if callNow
