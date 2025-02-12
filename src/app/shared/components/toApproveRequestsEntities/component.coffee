angular.module('diligenceVault').component 'toApproveRequestsEntities',{
  bindings:{
    toApproveRequestData: '='
  }
  templateUrl: 'shared/components/toApproveRequestsEntities/template.html'
  controller: 'ToApproveRequestsEntitiesController'
  controllerAs: 'vm'
}