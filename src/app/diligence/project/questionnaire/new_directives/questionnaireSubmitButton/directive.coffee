angular.module('diligenceVault').directive 'questionnaireSubmitButton', ->
  restrict: 'E'
  templateUrl: 'diligence/project/questionnaire/new_directives/questionnaireSubmitButton/template.html'
  controller: 'QuestionnaireSubmitButtonController'
  controllerAs: 'vm'
  scope: true
  replace: true
