angular.module('diligenceVault').component 'responseGridTrackChanges',{
  bindings:{
    response: '='
    onResponseChanged: '&'
    onResponseEdit: '&'
  }
  templateUrl: 'diligence/project/questionnaire/components/responseGridTrackChanges/template.html'
  controller: 'ResponseGridTrackChangesController'
  controllerAs: 'vm'
}