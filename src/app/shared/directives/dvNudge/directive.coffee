angular.module('diligenceVault').directive 'dvNudges', ->
  restrict: 'E'
  scope: true
  templateUrl: 'shared/directives/dvNudge/template.html'
  controller: 'DvNudgesController'
  controllerAs: 'vm'
