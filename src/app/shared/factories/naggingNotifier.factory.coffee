angular.module('diligenceVault').factory 'naggingNotifier', ($compile, $rootScope, $templateCache) ->
  class Notification
    constructor: (options) ->
      scope = angular.extend($rootScope.$new(), options)
      templateUrl = 'some template url'
      template = $templateCache.get(templateUrl)
      el = $compile(template)

      @$el = $(el)

      $('body').append(el)

    dismiss: ->
      @$el.remove()

  class NaggingNotifier
    notify: (options) ->
      return if @hasActiveNotification()

      @current_notification = new Notification(options)

    dismiss: ->
      return unless @hasActiveNotification()

      @current_notification.dismiss()
      @current_notification = null

    hasActiveNotification: ->
      @current_notification?

  new NaggingNotifier()
