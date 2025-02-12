angular.module('diligenceVault').factory 'DvAlertNotification', ($compile, $templateCache, $rootScope, $timeout) ->
  class DvAlertNotification
    constructor: (@options, success_cb, cancel_cb) ->
      noop = angular.noop

      @success_cb = success_cb || noop
      @cancel_cb = cancel_cb || noop

    launch: ->
      $container = $('.js-content-main')
      template = $templateCache.get('shared/templates/dv-alert-notification.html')
      defaults = {
        button_label: 'Save',
        button_selected : 'Save'  #variable to know which button was clicked
      }
      scope = angular.extend($rootScope.$new(), defaults, @options)

      scope.onSave = (argument...) =>
        #save the selected button name in the button_selected variable
        scope.button_selected = if argument.length == 2 then argument[1] else scope.button_label
        #send the arguments passed to the success_callback. Arguments required for Questionaire WIP
        result = @success_cb.apply(@,argument)

        return if result is false #you can prevent this notification from dismissing by explicitly returning false from the callback

        if result? and angular.isFunction(result.then)
          scope.is_loading = true

          result
            .then(=> @dismiss())
            .finally(-> scope.is_loading = false)
        else
          @dismiss()

        return

      el = $compile(template)(scope)

      @el = el
      @scope = scope

      @initial_container_padding_bottom = $container.css('padding-bottom')

      #removed $timeout to fix the loader issue in this panel
      $container.append(el)
      $container.css('padding-bottom',  "#{el.outerHeight()}px")

    updateMessage: (message) ->
      @scope.message = message

    dismiss: ->
      @el.remove()
      $('.js-content-main').css('padding-bottom', @initial_container_padding_bottom)

  {
    $new: (options, success_cb, cancel_cb) ->
      new DvAlertNotification(options, success_cb, cancel_cb)
  }
