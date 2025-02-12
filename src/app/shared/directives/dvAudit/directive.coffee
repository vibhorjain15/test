angular.module('diligenceVault').directive 'dvAudit', ->
  restrict: 'E'
  scope: true
  templateUrl: 'shared/directives/dvAudit/template.html'
  controller: 'DvAuditController'
  controllerAs: 'vm'
