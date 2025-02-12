angular.module('diligenceVault').directive 'delayedFormGroup', (errorMessageMap, $interpolate, $timeout, $compile, $inputMaxLength) ->
  restrict: 'E'
  require: '^form'
  transclude: true
  replace: true
  scope: true # create a new scope for the directive that acts like other child scopes and prototypically inherits from its parent scope
  templateUrl: 'shared/directives/delayedFormGroup/template.html'

  link: (scope, element, attrs, ngFormController, transclude) ->

    isAttributeTouched = ->
      validateOnKeydown = attrs.validateOn is 'keydown'
      validateOnSubmit = attrs.validateOn is 'submit'

      return ngFormController.$submitted if validateOnSubmit

      ngFormController.$submitted or (if validateOnKeydown then scope.modelController.$dirty else scope.modelController.$touched)
    
    init = ->
        selector = attrs.controlSelector or '.form-control'
        scope.field_name = attrs.fieldName
        form_control = element.find(selector)
        scope.field_name_map = scope.$eval(attrs.fieldNameMap)
        input_types_to_apply_max_limit = ['text', 'email', 'number']

        modelController = scope.modelController = form_control.controller('ngModel')

        return unless scope.modelController

        transclude scope, (clone, innerScope) ->
            tooltip_placement = attrs.tooltipPlacement or 'right'
            $error_indicator = $('<icon></icon>')
            $form_control = element.find(selector)
            $form_control_parent = $form_control.parent()
            tag_name = $form_control.prop('tagName').toLowerCase()
            is_dropdown = tag_name is 'select'
            is_datepicker = tag_name is 'dv-datepicker'

            # Adding a default max limit to the input types
            if ($form_control.prop('tagName').toLowerCase() == 'input') && ($form_control.prop('type').toLowerCase() in input_types_to_apply_max_limit) && !($form_control.attr("maxlength"))
                $form_control.attr('maxlength',$inputMaxLength)

            $error_indicator
                .attr('name', 'warning')
                .addClass('form-control-feedback')
                .addClass('invisible')
                .attr('uib-tooltip', '{{errorMessage}}')
                .attr('tooltip-placement', tooltip_placement)
                .attr('tooltip-trigger', 'none')
                .attr('tooltip-is-open', 'display_error_tooltip')

            scope.$on 'modal.opened', ->
                #If we don't do this, the tooltips if visible protrude into the modal dialog
                ngFormController.$setPristine()
                ngFormController.$setUntouched()

            if tooltip_placement is 'left'
                $error_indicator.css('left', 0)

            unless is_dropdown or is_datepicker
                $success_indicator = $('<icon></icon>')

                if scope.field_name != 'Password'
                    $success_indicator
                        .attr('name', 'check')
                        .addClass('form-control-feedback')
                        .attr('data-ng-show', 'modelController && modelControllerIsValid()')

            $success_indicator = $compile($success_indicator)(innerScope)
            $error_indicator = $compile($error_indicator)(innerScope)

            if $form_control_parent.hasClass('input-group') || $form_control_parent.hasClass('minicolors') || $form_control_parent.hasClass('checkbox')
                $form_control_parent.after($success_indicator)
                $form_control_parent.after($error_indicator)
            else
                $form_control.after($success_indicator)
                $form_control.after($error_indicator)

        if scope.modelController?
            scope.$watch 'modelControllerIsInvalid()', (value) ->
                scope.display_error_tooltip = value
    
    $timeout =>
        init()
    ,1000

    scope.modelControllerIsValid = ->
        isAttributeTouched() and scope.modelController.$valid

    scope.modelControllerIsInvalid = ->
        isAttributeTouched() and scope.modelController.$invalid

    scope.$watch 'modelController.$error', (->
        has_error = false
        scope.errorMessage = ''

        if scope.modelController
            angular.forEach scope.modelController.$error, (value, key) ->
                return if has_error

                if value
                    data = fieldName: (scope.field_name_map or {})[key] or scope.field_name or scope.modelController.$name

                if key == 'minlength'
                    angular.extend data, charLength: form_control[0].attributes['minlength'].value

                if key == 'maxlength'
                    angular.extend data, charLength: form_control[0].attributes['maxlength'].value

                if key == 'pattern'
                    if form_control[0].attributes['custom-pattern-message'] && form_control[0].attributes['custom-pattern-message'].value
                        angular.extend data, customPatternMessage: form_control[0].attributes['custom-pattern-message'].value
                    else
                        angular.extend data, customPatternMessage: ''

                if key == 'min'
                    #get min attribute set in the form, to display in the error message
                    angular.extend data, minValue: form_control[0].attributes['min'].value

                scope.errorMessage = $interpolate(errorMessageMap[key])(data)

                has_error = true
            ), true
