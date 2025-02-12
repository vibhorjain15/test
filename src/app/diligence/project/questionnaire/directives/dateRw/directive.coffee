angular.module('diligenceVault').directive 'dateRw', (ddWidgetsFactory) ->
  link = (scope, element, attrs, ddFormControlController) ->
    dateFormat = 'MM-DD-YYYY'

    saveResponse = (newValue, oldValue) ->
      response_copy = angular.copy(scope.response)

      if newValue == null and oldValue == null
        return

      if newValue != null
        newValue = if _.isDate(newValue) then moment(newValue) else moment(newValue, dateFormat)

      if oldValue != null
        oldValue = if _.isDate(oldValue) then moment(oldValue) else moment(oldValue, dateFormat)

      # when someone sets the date to null || someone picked/changed a date
      if newValue is null and newValue isnt oldValue or newValue.format(dateFormat) isnt (oldValue and oldValue.format(dateFormat))
        response_copy.dateResponse = newValue and newValue.format(dateFormat)

        ddFormControlController.saveResponse(response_copy).then (response) ->
          scope.response.id = response.id
          scope.response.dateResponse = serializeResponse(response).dateResponse

    serializeResponse = (response) ->
      if response.dateResponse
        response.dateResponse = moment(response.dateResponse, dateFormat).toDate()

      response

    if scope.response
      serializeResponse scope.response
      scope.$watch 'response.dateResponse', saveResponse

  ddWidgetsFactory.getDirectiveConfig('dateRw', link)
