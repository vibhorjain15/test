angular.module('diligenceVault').factory 'DueDiligence', (Restangular) ->
  Restangular.all 'diligences'
