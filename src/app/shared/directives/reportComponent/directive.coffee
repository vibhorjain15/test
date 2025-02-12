angular.module('diligenceVault').directive 'reportComponent', ($compile, $rootScope, RbComponentFactory, $timeout) ->
  restrict: 'E'
  replace: true
  scope: true
  controller: 'ReportComponentController'
  controllerAs: 'vm'
  templateUrl: 'shared/directives/reportComponent/template.html'
  require: ['ngModel', '^reportBuilder', 'reportComponent', '^reportPage']
  link: (scope, element, attrs, controllers) ->
    [ngModel, reportBuilderController, reportComponentController, reportPageController] = controllers
    $content_container = element.find('.js-content')
    $edit_button = element.find('.js-edit-button')
    component_scope = null
    readonly = reportBuilderController.isReadOnly()

    scope.readonly = readonly

    activateComponent = ->
      return if readonly

      $timeout ->
        reportBuilderController.activateComponent(reportComponentController)

    scope.removeComponent = (component) ->
      reportPageController.removeComponentConfirmation(component)

    element.on 'click', activateComponent

    scope.editComponent = (component) ->
      activateComponent()
      component.edit_mode = true

    scope.$watch "#{attrs.ngModel}.options", (new_val, old_val) ->
      return if new_val is old_val

      ngModel.$render()
      reportPageController.onComponentUpdate(ngModel.$viewValue)
    , true

    ngModel.$render = ->
      component = @$viewValue
      reportComponentController.setComponent(component)

      if component?
        if RbComponentFactory.isComponentConfigurable(component.type)
          $edit_button.removeClass('hidden')
        else
          $edit_button.addClass('hidden')

        if component_scope?
          component_scope.$render()
        else
          component_scope = $rootScope.$new()
          component_scope.component = component
          component_scope.reportBuilderController = reportBuilderController
          component.options ||= {}

          angular.extend(component.options, reportBuilderController.getOptions())
          # if (component.type == "aum_chart" || component.type == 'performance_chart') and component.options.entity_type == "Firm"
          #   directive = RbComponentFactory.getComponentDirectiveForNotSupported()
          # else
          directive = RbComponentFactory.getComponentDirective(component.type)
          $content_container.html($compile(directive)(component_scope))

    if scope.$index == 0
      activateComponent()
    ###activateComponent()###
