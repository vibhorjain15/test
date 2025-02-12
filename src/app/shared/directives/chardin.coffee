###*
 * @ngdoc directive
 * @name chardin
 * @restrict A
 *
 * @param {expression} chardin An expression that evaluates to chardin config object
 *
 * @param {attribute=} revealOnKeyPress If it is specified then the help on a page can
 * be activated by pressing `?` symbol on keyboard(More like a pro tip)
 *
 * @description
 * This is a wrapper for [chardinJS](https://github.com/heelhook/chardin.js), we use this
 * to display overlay instructions for first time users on how to get started with a
 * particular UI functionality
 *
 * @example
 * ## Reveal Help on clicking a `<button>`
 * `<button btn-type="primary" chardin="vm.chardin_config" reveal-on-keypress>Take the product tour</button>`
 *
 * <pre>
  @chardin_config = {
    reveal_menubar: true
    intros: [
      {
        target: '.js-menu-new-action',
        intro: 'Use this to add anything new, For example: a new Project, Template, Product, or a User as supported by your subscription',
        visible_elements: '.js-navbar-default'
      }
      {
        target: '.js-settings-toggle',
        intro: 'Use this to manage account & firm related settings',
        visible_elements: '.js-navbar-default'
      }
      {
        target: '.js-help-toggle'
        intro: 'Use this to send feedback to us or view help'
        visible_elements: '.js-navbar-default'
      }
    ]
  }
 * </pre>
 * Help will be revealed on clicking the `<button>` or by hitting `?` key on keyboard
 ###
angular.module('diligenceVault').directive 'chardin', (ChardinService, $rootScope) ->
  restrict: 'A'
  link: (scope, element, attrs) ->
    $body = $('body')
    config = scope.$eval(attrs.chardin)
    config_list = config.intros
    chardin_active = false
    chardin_visible_class = 'chardinjs-show-element'
    original_label = element.text()

    element.addClass('relative')

    scope.$on '$destroy', ->
      ChardinService.hide()

      if angular.isDefined(attrs.revealOnKeypress)
        $body.off('keypress.dv-help')
        $rootScope.has_help = false

    revealIntro = (is_key_press) ->
      unless chardin_active
        ChardinService.show(config, ->
          unless is_key_press
            element.addClass(chardin_visible_class)
            element.text('Got it')

          chardin_active = true
        , ->
          element.text(original_label)
          element.removeClass(chardin_visible_class)

          chardin_active = false
        )
      else
        ChardinService.hide()

    element.on 'click', -> revealIntro()

    if angular.isDefined(attrs.revealOnKeypress)
      $rootScope.has_help = true

      $body.on 'keypress.dv-help', (e) ->
        if e.target is $body[0] and e.keyCode is 63 #63 is keycode for "?"
          revealIntro(true)
