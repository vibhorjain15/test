angular.module('diligenceVault').directive 'questionnaireTextResponseAnalysis', ->
  restrict: 'E'
  templateUrl: 'diligence/project/questionnaire/new_directives/questionnaireTextResponseAnalysis/template.html'
  scope: true
  replace: true
  controller: 'QuestionnaireTextResponseAnalysisController'
  controllerAs: 'vm'
