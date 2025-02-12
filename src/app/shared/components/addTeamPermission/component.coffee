angular.module('diligenceVault').component 'addTeamPermissions',{
  bindings:{
    editMode: '<'
    resources: '='
    selectedEntities: '='
    loading: '=?'
    onResourceTypeChanged: '&'
  }
  templateUrl: 'shared/components/addTeamPermission/template.html'
  controller: 'addTeamPermissionsController'
  controllerAs: 'vm'
}
