angular.module('diligenceVault').directive 'dvSentToInfo', ->
  restrict: 'E'
  scope: true
  templateUrl: 'shared/directives/dvSentToInfo/template.html'
  controller: 'DvSentToInfoController'
  controllerAs: 'vm'
