angular.module('diligenceVault').filter 'joinBy', ->
  (input, delimiter) ->
    return input unless _.isArray(input)

    input.join delimiter or ','
