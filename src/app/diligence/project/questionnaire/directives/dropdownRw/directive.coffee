angular.module('diligenceVault').directive 'dropdownRw', (ddWidgetsFactory, DueDiligenceDataservice) ->
  link = (scope, element, attrs, ddFormControlController) ->
    original_text_response = undefined
    textarea = element.find('textarea')
    error_message = 'Please provide the explanation'
    questionID = if scope.response then scope.response.question.id else scope.question.id

    validateAndSave = ->
      if scope.response.listValueID is scope.otherOption?.id
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
        scope.response.listValueID = if _.isArray(response.listValueID) then response.listValueID[0] else response.listValueID
        original_text_response = response.textResponse
        response

    DueDiligenceDataservice.getList(questionID).then (list) ->
      scope.list = list
      scope.otherOption = _(list).findWhere(value: 'Other')

    if scope.response
      original_text_response = scope.response.textResponse

      if _.isArray(scope.response.listValueID)
        scope.response.listValueID = scope.response.listValueID[0]

      scope.$watch 'response.listValueID', (newValue, oldValue) ->
        if newValue isnt oldValue
          validateAndSave()

      textarea.on 'focus', ddFormControlController.removeErrorMessage
      textarea.on 'blur', validateAndSave

  ddWidgetsFactory.getDirectiveConfig('dropdownRw', link)
