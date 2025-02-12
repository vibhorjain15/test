angular.module('diligenceVault').directive 'questionnaireWidget' , ($timeout) ->
  restrict: 'A'
  require: ['ngModel', '^questionnaireFormControl']
  link: (scope, element, attrs, controllers) ->
    last_saved_value = null
    ngModelController = controllers[0]
    questionnaireFormControlController = controllers[1]

    $timeout ->
      last_saved_value = ngModelController.$viewValue

      ngModelController.valueDidChange = -> last_saved_value isnt @$viewValue

      ngModelController.commitCurrentValue = ->
        last_saved_value = @$viewValue

      questionnaireFormControlController.registerNgModelController(ngModelController)

      scope.$on '$destroy', ->
        questionnaireFormControlController.deregisterNgModelController(ngModelController)
