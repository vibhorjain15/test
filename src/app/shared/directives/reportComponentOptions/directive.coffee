angular.module('diligenceVault').directive 'reportComponentOptions', ->
  templateUrl: 'shared/directives/reportComponentOptions/template.html'
  scope: true
  replace: true
  restrict: 'E'
  require: ['^reportBuilder', 'reportComponentOptions']
  controller: 'ReportComponentOptionsController'
  controllerAs: 'vm'
  link: (scope, element, attrs, controllers) ->
    [reportBuilderController, reportComponentOptionsController] = controllers

    reportBuilderController
      .registerComponentOptionsController(reportComponentOptionsController)

    scope.deactivateComponent = ->
      reportBuilderController.deactivateComponent()
