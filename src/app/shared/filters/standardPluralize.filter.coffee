angular.module('diligenceVault').filter 'standardPluralize', (Utils)->
  (text) ->
    return Utils.standardPluralize(text)
