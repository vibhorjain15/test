angular.module('diligenceVault').directive 'ddInvestorSelector', ->
  restrict: "E"
  scope: true
  templateUrl: 'diligence/invite/directives/ddInvestorSelector/template.html'
  controller: 'DDInvestorSelectorController'
  controllerAs: 'vm'
