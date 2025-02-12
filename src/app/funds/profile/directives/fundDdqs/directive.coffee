angular.module('diligenceVault').directive 'fundDdqs', ->
  restrict: 'E'
  templateUrl: 'funds/profile/directives/fundDdqs/template.html'
  controller: 'FundDDQsController'
  controllerAs: 'vm'
  scope: 
    modalOpen: '&'
    modalTitle: '<'
    ddqType: '<'
    helpText: '<'
  transclude: true

  link: (scope,element,attrs,FundDDQsController) =>
    FundDDQsController.openModal = scope.modalOpen
