registerBooleanPlusWidget = (type) ->
  directiveFn = (ddWidgetsFactory, $timeout) ->
    "ngInject"

    link = (scope, element, attrs, ddFormControlController) ->
      skip_text_response_watch = false
      radio_inputs = element.find('input[type=radio]')
      textarea = element.find('textarea')
      error_message = 'Please provide the explanation'
      questionID = if scope.response then scope.response.question.id else scope.question.id

      radio_inputs.attr 'name', "question_#{questionID}"

      hasExplanation = ->
        if type is 'booleanplusRw' then scope.response.booleanResponse else !scope.response.booleanResponse

      save = ->
        if hasExplanation()
          return unless scope.response.textResponse
        else
          scope.response.textResponse = null
          skip_text_response_watch = true #to ensure two requests are not made, the other one triggered by watcher

        ddFormControlController.saveResponse scope.response

      validate = ->
        if hasExplanation() and !scope.response.textResponse
          ddFormControlController.setErrorMessage error_message
          false
        else
          ddFormControlController.removeErrorMessage()
          true

      validateAndSave = _.debounce (-> save() if validate()), 500

      if scope.response
        radio_inputs.on 'change', validateAndSave
        textarea.on 'focus keydown', _.debounce (-> $timeout(validate)), 500

        scope.$watch 'response.textResponse', (newValue, oldValue) ->
          if skip_text_response_watch
            skip_text_response_watch = false
            return

          validateAndSave() if newValue isnt oldValue

    ddWidgetsFactory.getDirectiveConfig(type, link)

  angular.module('diligenceVault').directive type, directiveFn


registerBooleanPlusWidget 'booleanplusRw'
registerBooleanPlusWidget 'noplusRw'
