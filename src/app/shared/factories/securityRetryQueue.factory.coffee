angular.module('diligenceVault').factory 'securityRetryQueue', ($q) ->

  class RetryItem
    constructor: (@retryFn, @deferred) ->

    retry: ->
      $q.when(@retryFn()).then ((value) =>
        @deferred.resolve value
      ), (value) =>
        @deferred.reject value

    cancel: ->
      @deferred.reject()


  new class SecurityRetryQueue
    constructor: ->
      @_retryQueue = []

    hasMore: ->
      @_retryQueue.length > 0

    pushRetryFn: (retryFn) ->
      deferred = $q.defer()
      retryItem = new RetryItem(retryFn, deferred)

      @_retryQueue.push retryItem
      deferred.promise

    retryAll: ->
      while @hasMore()
        @_retryQueue.shift().retry()


