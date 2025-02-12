angular.module('diligenceVault').directive 'questionnairePrintPreview', ->
  restrict: 'E'
  templateUrl: 'diligence/template/preview/new_directives/questionnairePrintPreview/template.html'
  scope: true
  controller: 'QuestionnairePrintPreviewController'
  controllerAs: 'vm'
