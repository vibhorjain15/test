angular.module('diligenceVault').directive 'platformActivityPanel', ->
  templateUrl: 'shared/directives/platformActivityPanel/template.html'
  controller: 'PlatformActivityPanelController'
  controllerAs: 'vm'
  scope: true
  restrict: 'E'
