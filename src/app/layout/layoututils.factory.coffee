angular.module('diligenceVault').factory 'LayoutUtils', ($rootScope) ->

  new class LayoutUtils
    toggleFeedbackPanel: ->
      $rootScope.$broadcast 'feedback_panel:toggle'

    enterFullscreenMode: (element) ->
      $('body').addClass('fullscreen-mode')

      element.addClass('fullscreen-target')

      $rootScope.fullscreen_mode = true

    exitFullscreenMode: (element) ->
      $('body').removeClass('fullscreen-mode')

      element.removeClass('fullscreen-target')

      $rootScope.fullscreen_mode = false

    triggerHelp: ->
      evt = jQuery.Event("keypress")
      evt.keyCode = 63

      $("body").trigger(evt)
