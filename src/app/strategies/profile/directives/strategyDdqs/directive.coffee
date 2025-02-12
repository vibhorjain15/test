angular.module('diligenceVault').directive 'strategyDdqs', ->
  restrict: 'E'
  templateUrl: 'strategies/profile/directives/strategyDdqs/template.html'
  controller: 'StrategyDDQsController'
  controllerAs: 'vm'
  scope: 
    modalOpen: '&'
    modalTitle: '<'
    ddqType: '<'
    helpText: '<'
  transclude: true

  link: (scope,element,attrs,StrategyDDQsController) =>
    StrategyDDQsController.openModal = scope.modalOpen
