angular.module('diligenceVault').directive 'reportPreview', ->
  template: '<spinner></spinner>'
  controller: 'ReportPreviewController'
  controllerAs: 'vm'
  scope: true
  restrict: 'E'
