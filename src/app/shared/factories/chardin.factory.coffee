angular.module('diligenceVault').factory 'ChardinService', ($timeout) ->
  new class ChardinService
    constructor: ->
      @active = false

    show: (config, onShow, onHide) ->
      $body = $('body')
      chardin_visible_class = 'chardinjs-show-element'
      chardin_noscroll_class = 'chardin-noscroll'

      init = =>
        $body.addClass(chardin_noscroll_class)

        if config.reveal_menubar
          $body.scrollTop(0)

          $timeout ->
            $body.chardinJs('start')
          , 301
        else
          $body.chardinJs('start')

        if angular.isFunction(onShow)
          onShow()

        @active = true

        $body.on 'chardinJs:stop', =>
          angular.forEach config.intros, (intro_config) ->
            $target = $(intro_config.target)

            $target.attr('data-intro', null)

            if intro_config.position
              $target.attr('data-position', null)

            if intro_config.visible_elements
              $(intro_config.visible_elements).removeClass(chardin_visible_class)

          $body.removeClass(chardin_noscroll_class)

          if angular.isFunction(onHide)
            onHide()

          @active = false

      angular.forEach config.intros, (intro_config) ->
        $target = $(intro_config.target)
        $target.attr('data-intro', intro_config.intro)

        if intro_config.position
          $target.attr('data-position', intro_config.position)

        if intro_config.visible_elements
          $(intro_config.visible_elements).addClass(chardin_visible_class)

      if config.scroll_to_target
        top = $(config.intros[0].target).offset().top - (config.scroll_offset or 0)
        $body.animate {scrollTop: top}, init
      else
        init()

    hide: ->
      return unless @active

      $body = $('body')

      $body.chardinJs('stop')
      $body.off('chardinJs:stop')
