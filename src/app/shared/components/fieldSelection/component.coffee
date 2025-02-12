angular.module('diligenceVault').component 'fieldSelection',{
  bindings:{
    fieldselectionForm: '='
    onClose: '&'
    disabled: '<'
    fields: '='
    splitMandatory: '<'
    customUrl: '<'
    readonly: '='
    enableTracking: '<'
  }
  templateUrl: 'shared/components/fieldSelection/template.html'
  controller: 'FieldSelectionController'
  controllerAs: 'vm'
}
