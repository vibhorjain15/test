angular.module('diligenceVault').directive 'bookendsRw', (ddWidgetsFactory, $timeout) ->
  link = (scope, element, attrs, ddFormControlController) ->
    original_responses = undefined
    $inputs = element.find('.form-control')

    modelControllers = _($inputs).map((input) ->
      angular.element(input).controller 'ngModel'
    )

    isValid = ->
      _(modelControllers).all isModelControllerValid

    # Debouncing because, when you change both numericResponseA & numericResponseB simultaneously
    # we can make only one request
    save = _.debounce ((newValue, oldValue) ->
      if newValue isnt oldValue && isValid()
        ddFormControlController.saveResponse scope.response
    ), 100

    validate = ->
      if isValid()
        ddFormControlController.removeErrorMessage()
      else
        ddFormControlController.setErrorMessage getErrorMessage()

    getErrorMessage = ->
      error_messages = []
      error_message_map =
        'number': 'Must be a numeric value'
        'min': 'Maximum value cannot be less than minimum value'

      angular.forEach modelControllers, (modelController) ->
        angular.forEach modelController.$error, (value, key) ->
          if value
            error_messages.push error_message_map[key]

      _.uniq(error_messages).join ', '

    isModelControllerValid = (modelController) -> modelController.$valid

    if scope.response
      original_responses = [scope.response.numericResponseA, scope.response.numericResponseB]

      $inputs.on 'keydown', _.debounce (-> $timeout(validate)), 500

      scope.$watch 'response.numericResponseA', save
      scope.$watch 'response.numericResponseB', save

  ddWidgetsFactory.getDirectiveConfig('bookendsRw', link)
