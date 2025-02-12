angular.module('diligenceVault').directive 'formAdvQuestionnaireSection', ->
  restrict: 'E'
  templateUrl: 'form_adv/firm/questionnaire/category/directives/formAdvQuestionnaireSection/template.html'
  controller: 'FormADVQuestionnaireSectionController'
  controllerAs: 'vm'
  scope: true
