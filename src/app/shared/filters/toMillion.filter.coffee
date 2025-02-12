angular.module('diligenceVault').filter 'toMillion', (Utils)->
  (input) ->
    if input > 1000000000
      return '$' + Utils.convertToBillion(input) + 'BN'
    else if input > 1000000
      return '$' + Utils.convertToMillion(input) + 'MM'
    else
      return input
