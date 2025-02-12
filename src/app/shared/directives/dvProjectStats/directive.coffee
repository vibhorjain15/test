angular.module('diligenceVault').directive 'dvProjectStats', ->
  restrict: 'E'
  scope: true
  templateUrl: 'shared/directives/dvProjectStats/template.html'
  controller: 'DvProjectStatsController'
  controllerAs: 'vm'
