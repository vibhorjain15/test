angular.module('diligenceVault').config (RestangularProvider, baseUrl) ->
  RestangularProvider.setBaseUrl baseUrl

  RestangularProvider.setRequestInterceptor (elem, operation) ->
    if operation == 'remove'
      return null
    elem