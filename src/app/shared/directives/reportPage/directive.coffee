angular.module('diligenceVault').directive 'reportPage', (RbComponentFactory) ->
  templateUrl: 'shared/directives/reportPage/template.html'
  scope: true
  replace: true
  restrict: 'E'
  controller: 'ReportPageController'
  controllerAs: 'rp_controller'
  require: ['reportPage', '^reportCanvas', '^reportBuilder']
  link: (scope, element, attrs, controllers) ->
    [reportPageController, reportCanvasController, reportBuilderController] = controllers
    page = null

    # you'd do this usually when you have multiple pages & user
    # selects a particular page
    reportCanvasController.setCurrentPage(reportPageController)

    readonly = reportBuilderController.isReadOnly()

    scope.readonly = readonly

    scope.onComponentUpdate = ->
      # Update page thumbnail here when that functionality
      # is implemented
      reportCanvasController.onPageUpdate(page, scope.$index)

    scope.deactivateIfActiveComponent = (component) ->
      reportBuilderController.deactivateIfActiveComponent(component)

    scope.deactivateComponent = () ->
      reportBuilderController.deactivateComponent()

    deregisterer = scope.$parent.$watch attrs.page, (value) ->
      if value?
        page = value

        reportPageController.setPage(page)

        deregisterer()
