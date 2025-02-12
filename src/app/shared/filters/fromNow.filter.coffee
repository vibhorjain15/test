angular.module('diligenceVault').filter 'fromNow', ->
  (input) ->
    if input?
      moment.utc(input).local().fromNow()
