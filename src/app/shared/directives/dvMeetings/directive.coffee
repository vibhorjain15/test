angular.module('diligenceVault').directive 'dvMeetings', ->
  restrict: 'E'
  scope: true
  templateUrl: 'shared/directives/dvMeetings/template.html'
  controller: 'DvMeetingsController'
  controllerAs: 'vm'
