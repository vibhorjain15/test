angular.module('diligenceVault').component 'teamSelection',{
  bindings:{
    selectedTeams: '='
    type: '<'
    teamselectionForm: '='
    onClose: '&'
    disabled: '<'
    teams: '='
    accessList: '='
  }
  templateUrl: 'shared/components/teamSelection/template.html'
  controller: 'TeamSelectionController'
  controllerAs: 'vm'
}