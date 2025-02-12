angular.module('diligenceVault').factory 'AuthDataService', (Restangular) ->
  new class AuthDataService
    activate: (params) ->
      Restangular
        .one('account', 'activate')
        .withHttpConfig(skip_404_redirection: true)
        .get(params)
