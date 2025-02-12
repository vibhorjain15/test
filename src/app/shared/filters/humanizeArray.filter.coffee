angular.module('diligenceVault').filter 'humanizeArray', ->
  (values..., last) ->
    [values.join(', '), last].join(' & ')
