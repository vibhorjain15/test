angular.module('diligenceVault').directive 'dvDocuments', ->
  restrict: 'E'
  scope: true
  templateUrl: 'shared/directives/dvDocuments/template.html'
  controller: 'DvDocumentsController'
  controllerAs: 'vm'
