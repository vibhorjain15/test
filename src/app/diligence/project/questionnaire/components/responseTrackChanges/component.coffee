angular.module('diligenceVault').component 'responseTrackChanges',{
  bindings:{
    response: '='
    onResponseChanged: '&'
    onResponseEdit: '&'
  }
  templateUrl: 'diligence/project/questionnaire/components/responseTrackChanges/template.html'
  controller: 'ResponseTrackChangesController'
  controllerAs: 'vm'
}