angular.module('diligenceVault').directive 'offlineDDQuestionBuilder', ->
  restrict: 'E'
  templateUrl: 'shared/directives/offlineDDQuestionBuilder/template.html'
  controller: 'OfflineDDQuestionBuilderController'
  controllerAs: 'vm'
  scope: true
