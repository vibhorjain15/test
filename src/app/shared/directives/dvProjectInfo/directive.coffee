angular.module('diligenceVault').directive 'dvProjectInfo', ->
  restrict: 'E'
  scope: true
  templateUrl: 'shared/directives/dvProjectInfo/template.html'
  controller: 'DvProjectInfoController'
  controllerAs: 'vm'
