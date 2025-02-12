angular.module('diligenceVault').factory 'JobDataservice', (Restangular) ->
  new class JobDataservice
    create: (params) ->
      Restangular.all('jobs').post(params)
