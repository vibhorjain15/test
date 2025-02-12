angular.module('diligenceVault').directive 'templateQuestionBuilder', ->
  restrict: 'E'
  templateUrl: 'shared/directives/templateQuestionBuilder/template.html'
  controller: 'TemplateQuestionBuilderController'
  controllerAs: 'vm'
  scope: true
