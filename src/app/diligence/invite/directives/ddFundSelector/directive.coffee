angular.module('diligenceVault').directive 'ddFundSelector', ->
  restrict: "E"
  scope: true
  templateUrl: 'diligence/invite/directives/ddFundSelector/template.html'
  controller: 'DDFundSelectorController'
  controllerAs: 'vm'
