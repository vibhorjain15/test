angular.module('diligenceVault').directive 'slideToggle', ->
  restrict: 'A'
  compile: (element, attrs) ->
    element.css('display', 'none')

    (scope, lElem) ->
      scope.$watch attrs.slideToggle, (value) ->
        return unless value?

        lElem.slideToggle()
