angular.module('diligenceVault').factory 'RetryFactory', ($injector, $q, $http, $window, authSettings, $timeout) ->
  new class RetryFactory
    retry: (config, numRetries)=>
      refresh_token = $window.localStorage?.getItem('dv_refresh_token')
      params = angular.extend({}, authSettings, {
        grant_type: 'refresh_token',
        refresh_token: refresh_token
      })
      config.data = params
      $http(config).then ((response) =>
        $q.resolve response
      ), (response) =>
        config.retryCount++
        if config.retryCount <= numRetries
          $timeout =>
            @retry config, numRetries or 3
          , 1000
        else
          $q.reject response

    retryRequests: (promise, numOfRetries)=>
      promise.then ((response) =>
        $q.resolve response
      ), (response) =>
        config = angular.extend({ retryCount: 0 }, response.config)
        $timeout =>
          @retry config, numOfRetries or 3
        ,1000
