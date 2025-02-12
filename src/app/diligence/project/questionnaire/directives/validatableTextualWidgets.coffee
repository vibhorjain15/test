registerTextualWidget = (type, error_message, responseType) ->
  directiveFn = (ddWidgetsFactory, $timeout) ->
    "ngInject"
    link = (scope, element, attrs, ddFormControlController) ->
      original_response = undefined
      $input = element.find('input')
      modelController = angular.element($input).controller('ngModel')

      validate = ->
        if modelController.$valid
          ddFormControlController.removeErrorMessage()
        else
          ddFormControlController.setErrorMessage error_message

      save = ->
        if ddFormControlController.responseDidChange(modelController, original_response)
          ddFormControlController.saveResponse(scope.response).then (response) ->
            original_response = response[responseType]

      if scope.response
        original_response = scope.response[responseType]

        $input.on 'keydown', _.debounce (-> $timeout(validate)), 500

        scope.$watch 'response.' + responseType, (newValue, oldValue) ->
          return if modelController.$invalid

          save() if newValue isnt oldValue

    ddWidgetsFactory.getDirectiveConfig(type, link)

  angular.module('diligenceVault').directive type, directiveFn


registerTextualWidget 'textemailRw', 'Is not a valid email address', 'textResponse'
registerTextualWidget 'textphoneRw', 'Not a valid phone number', 'numericResponseA'
registerTextualWidget 'percentageRw', 'Must be a numeric value', 'numericResponseA'
registerTextualWidget 'identifierRw', 'Must be a numeric value', 'numericResponseA'
registerTextualWidget 'numericRw', 'Must be a numeric value', 'numericResponseA'
registerTextualWidget 'integerRw', 'Must be a valid integer', 'numericResponseA'
