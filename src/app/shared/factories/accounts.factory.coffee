angular.module('diligenceVault').factory 'AccountsService', (Restangular) ->
  new class AccountsService
    activate: (params) ->
        Restangular.one('account', null).all('activate').post(params)