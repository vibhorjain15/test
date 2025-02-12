angular.module('diligenceVault').directive 'checkboxRw', (ddWidgetsFactory, DueDiligenceDataservice) ->
  link = (scope, element, attrs, ddFormControlController) ->
    original_text_response = undefined
    questionID = if scope.response then scope.response.question.id else scope.question.id
    error_message = 'Please provide other value(s)'
    textarea = element.find('textarea')

    validateAndSave = ->
      if _(scope.response.listValueID).contains(scope.otherOption?.id)
        new_text_response = textarea.val().trim()

        unless new_text_response
          ddFormControlController.setErrorMessage error_message
          return

        if original_text_response is new_text_response
          return
      else
        scope.response.textResponse = null
        ddFormControlController.removeErrorMessage()

      ddFormControlController.saveResponse(scope.response).then (response) ->
        original_text_response = response.textResponse

    if scope.response
      scope.validateAndSave = _.debounce validateAndSave, 500
      original_text_response = scope.response.textResponse

      textarea.on 'focus', ddFormControlController.removeErrorMessage
      textarea.on 'blur', validateAndSave
    else # this is required on template preview page
      scope.response = {}

    DueDiligenceDataservice.getList(questionID).then (list) ->
      otherOption = _(list).findWhere(value: 'Other')

      if otherOption?
        # ensuring the other option comes at the end, because if it is somewhere in the middle, clicking it
        # will open a textarea which is rendered at the bottom & might go un-noticed
        list.splice(list.indexOf(otherOption), 1)
        list.push(otherOption)

        scope.$watchCollection 'response.listValueID', (current, old) ->
          if _(current).contains(scope.otherOption.id)
            scope.is_other_option_selected = true
          else if _(old).contains(scope.otherOption.id)
            scope.is_other_option_selected = false

      scope.list = list
      scope.otherOption = otherOption

  ddWidgetsFactory.getDirectiveConfig('checkboxRw', link)
