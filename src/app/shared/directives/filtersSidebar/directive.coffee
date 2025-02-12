angular.module('diligenceVault').directive 'dvFiltersSidebar', ->
  restrict: 'E'
  scope: true
  templateUrl: 'shared/directives/filtersSidebar/template.html'
  controller: 'DvFiltersSidebarController'
  controllerAs: 'vm'
