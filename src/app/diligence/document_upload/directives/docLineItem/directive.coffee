angular.module('diligenceVault').directive 'docLineItem', ->
  restrict: 'E'
  scope: true
  controller: 'DocLineItemController'
  controllerAs: 'vm'
  templateUrl: 'diligence/document_upload/directives/docLineItem/template.html'
