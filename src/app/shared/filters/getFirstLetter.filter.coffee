angular.module('diligenceVault').filter 'getFirstLetter', ->
  (input) ->
    if input
      input = input.toString() unless _.isString(input)

      return input if input.length is 0 # if the string is ""

      "#{input[0]}"
