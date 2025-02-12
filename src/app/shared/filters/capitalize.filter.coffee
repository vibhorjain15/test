angular.module('diligenceVault').filter 'capitalize', ->
  (input) ->
    input = input.toString() unless _.isString(input)

    return input if input.length is 0 # if the string is ""

    "#{input[0].toUpperCase()}#{input.slice(1).toLowerCase()}"
