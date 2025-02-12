angular.module('diligenceVault').component 'addQuestionMapping',{
  bindings:{
    template: '='
    question: '='
    mappedQuestions: '='
    onSave: '&'
    onCancel: '&'
    sourceTemplates: '<'
  }
  templateUrl: 'shared/components/addQuestionMapping/template.html'
  controller: 'AddQuestionMappingController'
  controllerAs: 'vm'
}