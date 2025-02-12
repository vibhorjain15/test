angular.module('diligenceVault').component 'pendingDraftRequests',{
  bindings:{
    onSelectedRow: '&'
  }
  templateUrl: 'shared/components/pendingDraftRequests/template.html'
  controller: 'PendingDraftRequestsController'
  controllerAs: 'vm'
}