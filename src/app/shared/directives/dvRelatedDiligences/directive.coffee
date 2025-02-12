angular.module('diligenceVault').directive 'dvRelatedDiligences', ->
  restrict: 'E'
  scope: 
    refreshLinkedProjects: '&'
  templateUrl: 'shared/directives/dvRelatedDiligences/template.html'
  controller: 'DvRelatedDiligenceController'
  controllerAs: 'vm'