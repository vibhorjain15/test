angular.module('diligenceVault').filter 'removeUnderscores', ->
  (text) ->
    if text
      str = text.toString().replace(/_/g, " ")
      str
