angular.module('diligenceVault').directive 'modalButton', (ModalFactory) ->
  restrict: 'A'
  link: (scope, elem, attrs) ->
    options = scope.$eval attrs.modalOptions

    elem.on 'click', ->
      ModalFactory.invokeModal attrs.modalButton, options
