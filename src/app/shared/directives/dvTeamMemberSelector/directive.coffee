angular.module('diligenceVault').directive 'dvTeamMemberSelector', ->
  restrict: 'E'
  replace: true
  scope:
    selection: '='
    functionSelection: '='
    functions: '='
  bindToController: true
  templateUrl: 'shared/directives/dvTeamMemberSelector/template.html'
  controller: 'DvTeamMemberSelectorController'
  controllerAs: 'vm'
