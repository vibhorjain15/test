angular.module('diligenceVault').directive 'fileInputChange', () ->
  restrict: 'A'
  link: (scope, element, attrs) ->
    onChangeHandler = scope.$eval attrs.fileInputChange
    element.on 'change', onChangeHandler
    element.on '$destroy', () ->
      element.off()
