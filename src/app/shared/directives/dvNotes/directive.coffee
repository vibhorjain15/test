angular.module('diligenceVault').directive 'dvNotes', ->
  restrict: 'E'
  scope: true
  templateUrl: 'shared/directives/dvNotes/template.html'
  controller: 'DvNotesController'
  controllerAs: 'vm'
