angular.module('diligenceVault').directive 'dvSelectorList', ->
  restrict: "E"
  scope: true
  templateUrl: 'shared/directives/dvSelectorList/template.html'
  controller: 'DVSelectorListController'
  controllerAs: 'vm'