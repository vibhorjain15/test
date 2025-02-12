angular.module('diligenceVault').directive 'strategyDocuments', ->
  restrict: 'E'
  templateUrl: 'strategies/profile/directives/strategyDocuments/template.html'
  controller: 'StrategyDocumentsController'
  controllerAs: 'vm'
  scope: true
  transclude: true
