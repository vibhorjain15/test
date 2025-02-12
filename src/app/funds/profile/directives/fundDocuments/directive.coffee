angular.module('diligenceVault').directive 'fundDocuments', ->
  restrict: 'E'
  templateUrl: 'funds/profile/directives/fundDocuments/template.html'
  controller: 'FundDocumentsController'
  controllerAs: 'vm'
  scope: true
  transclude: true
