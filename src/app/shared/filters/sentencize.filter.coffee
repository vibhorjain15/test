angular.module('diligenceVault').filter 'sentencize', ->
  (input) ->
    (input or '').split(/(?=[A-Z])/).join ' '
