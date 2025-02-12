angular.module('diligenceVault').factory 'DvAlert', (DvAlertNotification) ->
  new class DvAlert
    hasActiveNotification: ->
      !!@active_notification

    dismissActiveNotification: ->
      return unless @active_notification?

      @active_notification.dismiss()
      @active_notification = null

    notify: (options, success_cb, cancel_cb) ->
      @dismissActiveNotification() if @hasActiveNotification()

      notification = DvAlertNotification.$new(options, success_cb, cancel_cb)
      notification.launch()

      @active_notification = notification

      notification
