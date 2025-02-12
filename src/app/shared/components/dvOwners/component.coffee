angular.module('diligenceVault').component 'dvOwners',{
  bindings:{
    entity: '='
    entityType: '='
    params: '='
    owners: '='
  }
  templateUrl: 'shared/components/dvOwners/template.html'
  controller: 'DvOwnersController'
  controllerAs: 'vm'
}
