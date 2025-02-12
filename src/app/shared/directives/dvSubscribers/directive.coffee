angular.module('diligenceVault').directive 'dvSubscribers', ->
  restrict: 'E'
  scope: true
  templateUrl: 'shared/directives/dvSubscribers/template.html'
  controller: 'DvSubscribersController'
  controllerAs: 'vm'
