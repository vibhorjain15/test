angular.module('diligenceVault').component 'mappedQuestionsGroupedView',{
  bindings:{
    template: '='
    question: '='
    mappedQuestions: '='
    readonly: '<'
    onRemove: '&'
  }
  templateUrl: 'shared/components/mappedQuestionsGroupedView/template.html'
  controller: 'MappedQuestionsGroupedViewController'
  controllerAs: 'vm'
}