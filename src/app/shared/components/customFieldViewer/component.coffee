angular.module('diligenceVault').component 'customFieldViewer',{
  bindings:{
    entityType: '<'
    entityTypeId: '<'
    entityId: '<'
    source: '<'
  }
  templateUrl: 'shared/components/customFieldViewer/template.html'
  controller: 'CustomFieldViewerController'
  controllerAs: 'vm'
}