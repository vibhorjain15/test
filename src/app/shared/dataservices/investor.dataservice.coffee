angular.module('diligenceVault').factory 'InvestorDataservice', (Restangular) ->
  new class InvestorDataservice
    getInvestors: (params) ->
      Restangular.all('investors').customGET('', params)
