angular.module('diligenceVault').factory 'AuthService', ($injector, $auth, $window, authSettings, $q, $http, DvAlert, Restangular, toaster, DvInputAlert, Utils, RetryFactory, Sentry) ->
  new class AuthService
    constructor: ->
      @requests_to_retry = []

    logoutViaRequest: (toState, toParams) ->
      # if Utils.isAngular()
      #   AngularAuthService.logoutViaRequest()
      toaster.pop 'wait', '', 'Logging out...', 500000

      Restangular.all('RefreshTokens').remove().then (response) =>
        toaster.clear()
        @logout(toState, toParams, response, true)

    logout: (toState, toParams, response, logoutViaRequest = false) ->
      $state = $injector.get('$state')
      $auth = $injector.get('$auth')
      $auth.logout()
      $window.localStorage?.removeItem('dv_refresh_token')
      DvInputAlert.dismissActiveInputAlert()

      if response and response.url
        $window.open(response.url, "_self")
        return

      return if toState is false

      if toState?
        $state.go toState, toParams
      else
        # $state.go 'authentication.login'
        # Added to force reload
        $window.location.href="/"

    login: (params, retry = false) ->
      if retry
        RetryFactory.retryRequests($auth.login(params), 5).then (response) ->
          if $window.localStorage
            if !response
              Sentry.captureException (new Error ("login angular js null response"));
            if !response.data
              Sentry.captureException (new Error ("login angular js null response data"));
            if !response.data.refresh_token
              Sentry.captureException (new Error ("login angular js null refresh token"));
            $window.localStorage.setItem('dv_refresh_token', response.data.refresh_token)
            $window.localStorage.setItem('jwt', response.data.jwt)
          else
            Sentry.captureException (new Error ("login angular js local storage not available"));

          response
      else
        $auth.login(params).then (response) ->
          if $window.localStorage
            if !response
              Sentry.captureException (new Error ("login angular js null response"));
            if !response.data
              Sentry.captureException (new Error ("login angular js null response data"));
            if !response.data.refresh_token
              Sentry.captureException (new Error ("login angular js null refresh token"));
            $window.localStorage.setItem('dv_refresh_token', response.data.refresh_token)
            $window.localStorage.setItem('jwt', response.data.jwt)
          else
            Sentry.captureException (new Error ("login angular js local storage not available"));

          response

    isTokenBeingRefreshed: ->
      @is_token_being_refreshed

    refreshToken: ->
      refresh_token = $window.localStorage?.getItem('dv_refresh_token')
      deferred = $q.defer()

      if refresh_token?
        params = angular.extend({}, authSettings, {
          grant_type: 'refresh_token',
          refresh_token: refresh_token
        })

        @is_token_being_refreshed = true

        @login(params, true).then((response) =>
          deferred.resolve(response)
          @retryPendingRequests()
        , (response) ->
          deferred.reject(response)
        ).finally(=> @is_token_being_refreshed = false)
      else
        deferred.reject()

      deferred.promise

    retryPendingRequests: ->
      angular.forEach @requests_to_retry, (options) ->
        config = options.config
        deferred = options.deferred

        $http(config).then (response) ->
          deferred.resolve(response)
        , (response) ->
          deferred.reject(response)

      @requests_to_retry.length = 0

    queueRequest: (config, deferred) ->
      @requests_to_retry.push({
        config: config,
        deferred: deferred
      })
