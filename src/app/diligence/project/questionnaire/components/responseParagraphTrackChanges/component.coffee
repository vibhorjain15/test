angular.module('diligenceVault').component 'responseParagraphTrackChanges',{
  bindings:{
    response: '='
    onResponseChanged: '&'
  }
  templateUrl: 'diligence/project/questionnaire/components/responseParagraphTrackChanges/template.html'
  controller: 'ResponseParagraphTrackChangesController'
  controllerAs: 'vm'
}