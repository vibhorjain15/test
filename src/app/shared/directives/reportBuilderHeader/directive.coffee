angular.module('diligenceVault').directive 'reportBuilderHeader', ($state) ->
  templateUrl: 'shared/directives/reportBuilderHeader/template.html'
  scope: true
  replace: true
  restrict: 'E'
  controller: 'ReportBuilderHeaderController'
  controllerAs: 'vm'
  require: ['reportBuilderHeader', '^reportBuilder']
  link: (scope, element, attrs, controllers) ->
    [reportBuilderHeaderController, reportBuilderController] = controllers

    reportBuilderController
      .registerReportBuilderHeader(reportBuilderHeaderController)

    switch reportBuilderController.type
      when 'edit-report'
        scope.type_text = 'Report'
      when 'edit-template'
        scope.type_text = 'Report Definition'

    scope.updateTemplate = (params) ->
      reportBuilderController.updateTemplate(params)

    scope.insertComponent = (component, idx) ->
      reportBuilderController.insertComponent(component.type, idx)

    scope.redirectToPreview = (id) ->
      if reportBuilderController.isRealtimeReport()
        $state.go 'app.reports.realtime-reports.detail.preview', {
          reportId: id
        }
      else
        $state.go 'app.reports.templates.detail.preview', {
          templateId: id
        }
