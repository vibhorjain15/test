angular.module('diligenceVault').factory 'NotificationsFactory', ($interval, NotificationDataservice) ->
  new class NotificationsFactory
    constructor: ->
      @callbacks = []

    onload: (callback) ->
      @callbacks.push(callback)

    startPolling: ->
      @stopPolling()

      @getUnreadNotificationCount()

      @interval_id = $interval =>
        @getUnreadNotificationCount()
      , 1200 * 1000 #1200 seconds / 20 mins

    getUnreadNotificationCount: ->
      NotificationDataservice.getUnreadNotificationCount().then (response) =>
        @invokeCallbacks(response)

        response

    invokeCallbacks: (response) ->
      angular.forEach @callbacks, (callback) ->
        callback(response)

    stopPolling: ->
      if @interval_id?
        $interval.cancel(@interval_id)
