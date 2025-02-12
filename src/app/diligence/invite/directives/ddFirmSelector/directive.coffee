angular.module('diligenceVault').directive 'ddFirmSelector', ->
  restrict: "E"
  scope: true
  templateUrl: 'diligence/invite/directives/ddFirmSelector/template.html'
  controller: 'DDFirmSelectorController'
  controllerAs: 'vm'
