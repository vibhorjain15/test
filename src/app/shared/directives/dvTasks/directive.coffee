angular.module('diligenceVault').directive 'dvTasks', ->
  restrict: 'E'
  scope: true
  templateUrl: 'shared/directives/dvTasks/template.html'
  controller: 'DvTasksController'
  controllerAs: 'vm'
