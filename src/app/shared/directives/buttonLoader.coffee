###*
 * @ngdoc directive
 * @name buttonLoader
 * @restrict A
 *
 * @param {expression} buttonLoader An expression that needs to evaluate to
 * `true/false`
 *
 * @description
 * When you submit a form, most of the times we make an $http request
 * which returns a promise, so until the promise is resolved we're supposed
 * to show a loading feedback to the user. So, whenever the specified
 * expression evaluates to `true`, the content of the button is replaced
 * with a animating loader & it stops loading when the expression
 * evaluates to `false` again.
 *
 * @example
 * `<button button-loader="vm.loading" type="submit">Submit</button>`
 *
 * Displays a animated loader when the controller does `@loading = true`
 ###
angular.module('diligenceVault').directive 'buttonLoader', ($compile, $timeout) ->
  restrict: 'A'
  compile: (element, attrs) ->
    element.addClass 'btn-loader'
    element.html "<div class='btn-label'>#{element.html()}</div>"
    element.append '<spinner></spinner>'

    (scope, lElem) ->
      $timeout ->
        font_size = parseInt(lElem.css('font-size'))
        lElem.find('.dvi-spinner')
          .css('margin-left', -font_size/2)
          .css('margin-top', -font_size/2)

      scope.$watch attrs.buttonLoader, (newValue, oldValue) ->
        if (newValue is oldValue)
          return

        if newValue
          lElem
            .attr('data-loading', "")
            .prop('disabled', true)
        else
          lElem
            .removeAttr('data-loading')
            .prop('disabled', false)
