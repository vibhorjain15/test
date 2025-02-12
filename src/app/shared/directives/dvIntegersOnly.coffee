angular.module('diligenceVault').directive 'dvIntegersOnly', ->
  restrict: 'A'
  require: 'ngModel'
  link: (scope, element, attrs, ngModelController) ->
    ensureIntegersOnly = (inputValue) =>
      if inputValue == undefined
        return ''
      transformedInput = inputValue.replace(/[^0-9\n]/g, '')
      if transformedInput != inputValue
        ngModelController.$setViewValue transformedInput
        ngModelController.$render()
      transformedInput

    ngModelController.$parsers.push ensureIntegersOnly
