angular.module('diligenceVault').directive 'reportCanvas', ->
  templateUrl: 'shared/directives/reportCanvas/template.html'
  scope: true
  replace: true
  restrict: 'E'
  require: ['ngModel', '^reportBuilder', 'reportCanvas']
  controller: 'ReportCanvasController'
  controllerAs: 'rc_controller'
  link: (scope, element, attrs, controllers) ->
    [ngModel, reportBuilderController, reportCanvasController] = controllers
    reportBuilderController.registerCanvas(reportCanvasController)
    pages = null

    reportBuilderController.getPages().then (value) ->
      pages = value

      reportCanvasController.setPages(pages)

    reportCanvasController.onPageUpdate = (page, idx) ->
      reportBuilderController.onCanvasUpdate(pages)
