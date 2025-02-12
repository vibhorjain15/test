angular.module('diligenceVault').directive 'profileDdq', ->
  restrict: 'E'
  templateUrl: 'shared/directives/profileddq/template.html'
  controller: 'ProfileDDQController'
  controllerAs: 'vm'
  scope: 
    modalOpen: '&'
    helpText: '<'
    tooltipText: '<'
  transclude: true

  link: (scope,element,attrs,ProfileDDQController) =>
    ProfileDDQController.openModal = scope.modalOpen
