###*
 * @ngdoc directive
 * @name circularProgressbar
 * @restrict E
 *
 * @param {expression} progress an expression that evaluates to a number, which
 * is the percentage of the progress
 *
 * @description
 * This directive renders a LinkednIn style(profile completeness) circular progressbar
 *
 * @example
 * `<circular-progressbar progress="vm.progress_percentage"></circular-progressbar>`
###
angular.module('diligenceVault').directive 'circularProgressbar', ->
  restrict: 'E'
  template: '<div></div>'
  replace: true
  link: (scope, element, attrs) ->
    scope.$watch attrs.progress, (value) ->
      if value?
        if progressbar?
          progressbar.setProgress(value)
        else
          progressbar = new CircularProgressBar(
            el: element[0]
            height: 150
            progress: value
          )
