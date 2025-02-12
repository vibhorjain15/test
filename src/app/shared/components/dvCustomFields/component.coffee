angular.module('diligenceVault').component 'dvCustomFields',{
  bindings:{
    entityType: '<'
    onClose: '&'
    entityId: '<'
    customFields: '='
    onAdd: '&'
  }
  templateUrl: 'shared/components/dvCustomFields/template.html'
  controller: 'DVCustomFieldsController'
  controllerAs: 'vm'
}