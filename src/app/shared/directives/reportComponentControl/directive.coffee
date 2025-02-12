angular.module('diligenceVault').directive 'reportComponentControl', ($compile, $templateCache) ->
  template: '<div class="report-component-control"></div>'
  replace: true
  scope: true
  restrict: 'E'
  require: '^reportBuilder'
  link: (scope, element, attrs, reportBuilderController) ->
    component_control = scope.$eval attrs.componentControl

    scope.component_control = component_control

    if component_control.sub_components?
      templateUrl = 'shared/directives/reportComponentControl/component-with-dropdown.html'
    else
      templateUrl = 'shared/directives/reportComponentControl/component.html'

    template = $templateCache.get(templateUrl)

    element.html $compile(template)(scope)

    scope.insertComponent = (component) ->
      reportBuilderController.insertComponent(component.type)
