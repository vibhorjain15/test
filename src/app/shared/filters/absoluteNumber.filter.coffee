angular.module('diligenceVault').filter 'absoluteNumber', ->
  (input) ->
    Math.abs(input)