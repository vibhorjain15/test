angular.module('diligenceVault').directive 'questionnairePreview', ->
  restrict: 'E'
  templateUrl: 'diligence/template/preview/directives/questionnairePreview/template.html'
  scope: true
  controller: 'QuestionnairePreviewController'
  controllerAs: 'vm'
