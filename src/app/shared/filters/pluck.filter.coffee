angular.module('diligenceVault').filter 'pluck', ->
  (input, key) -> _(input).pluck key
