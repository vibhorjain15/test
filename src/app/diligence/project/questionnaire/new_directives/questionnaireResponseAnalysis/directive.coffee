angular.module('diligenceVault').directive 'questionnaireResponseAnalysis', ->
  restrict: 'E'
  templateUrl: 'diligence/project/questionnaire/new_directives/questionnaireResponseAnalysis/template.html'
  scope: true
  replace: true
  controller: 'QuestionnaireResponseAnalysisController'
  controllerAs: 'vm'
