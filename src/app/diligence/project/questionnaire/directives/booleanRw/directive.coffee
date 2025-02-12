angular.module('diligenceVault').directive 'booleanRw', (ddWidgetsFactory) ->
  link = (scope, element, attrs, ddFormControlController) ->
    radio_inputs = element.find('input[type=radio]')
    questionID = if scope.response then scope.response.question.id else scope.question.id

    radio_inputs.attr 'name', "question_#{questionID}"

    if scope.response
      radio_inputs.on 'change', ->
        scope.$evalAsync ->
          ddFormControlController.saveResponse scope.response

  ddWidgetsFactory.getDirectiveConfig('booleanRw', link)
