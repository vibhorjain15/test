###*
 * @ngdoc directive
 * @name a
 * @restrict E
 *
 * @description
 * Adds behaviour to `<a>` tag such that, if it has "disabled" class
 * it blocks click events
 *
 * Basically, a `<button>` tag has a `disabled` attribute which blocks
 * all click events when that is set. At times we use `<a>` tags which
 * look like a `<button>`, although they still would have `href` attribute
 * set on them. There was a usecase where we wanted to prevent the click
 * event, since it cannot be accessed. If we just add `disabled` class
 * it'll just change the look & feel but the user would still be able to
 * navigate. With this directive if you have to make a link truly disabled
 * just add `disabled` class
 ###
angular.module('diligenceVault').directive 'a', ($compile) ->
  restrict: 'E'
  link: (scope, element, attrs) ->
    element.on 'click', (event) ->
      if element.hasClass('disabled')
        event.preventDefault()
        event.stopPropagation()
