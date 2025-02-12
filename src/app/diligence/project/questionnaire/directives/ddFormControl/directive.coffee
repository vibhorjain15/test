angular.module('diligenceVault').directive 'ddFormControl', ($compile) ->
  value_property_map =
    'Text': 'textResponse'
    'TextMultiLine': 'textResponse'
    'Numeric': 'numericResponseA'
    'Dropdown': 'listValueID'
    'Boolean': 'booleanResponse'
    'BooleanPlus': 'booleanResponse'
    'NoPlus': 'booleanResponse'
    'TextEmail': 'textResponse'
    'TextPhone': 'numericResponseA'
    'Percentage': 'numericResponseA'
    'Identifier': 'numericResponseA'
    'CheckBox': 'listValueID'
    'Integer': 'numericResponseA'
    'Date': 'dateResponse'

  restrict: 'E'
  replace: true
  require: ['ddFormControl', '^diligenceDetailSection']
  templateUrl: 'diligence/project/questionnaire/directives/ddFormControl/template.html'
  link: (scope, element, attrs, controllers) ->
    controlMode = attrs.controlMode
    childScope = scope.$new()
    response = scope.response
    ddFormControlController = controllers[0]
    diligenceDetailSectionController = controllers[1]

    if controlMode is 'rw'
      controlDirectiveTag = "#{attrs.controlType}-#{controlMode}"
    else
      controlDirectiveTag = 'dd-form-control-static'

    controlDirective = "<#{controlDirectiveTag}></#{controlDirectiveTag}>"
    childScope.response = response

    scope.saveResponse = (response) ->
      diligenceDetailSectionController.saveResponse response

    scope.deleteResponse = (response) ->
      diligenceDetailSectionController.deleteResponse response

    scope.clearResponse = ->
      responseType = response.question.responseType

      if responseType is 'Checkbox'
        response[value_property_map[responseType]] = []
      else if responseType is 'Bookends'
        response.numericResponseA = null
        response.numericResponseB = null
      else
        response[value_property_map[responseType]] = null

      if responseType in ['BooleanPlus', 'NoPlus', 'Dropdown']
        response.textResponse = null

    scope.showTodos = ->
      ddFormControlController.emitEvent 'show:todos'

    scope.showHistory = ->
      if response.id
        ddFormControlController.emitEvent 'show:history'

    scope.showFollowUp = ->
      if response.id
        ddFormControlController.emitEvent 'show:follow_up'

    scope.showNotes = ->
      ddFormControlController.emitEvent 'show:notes'

    ddFormControlController.checkForResponse()
    element.find('.js-control-wrapper').replaceWith $compile(controlDirective)(childScope)

  controller: ($scope) ->
    @checkForResponse = ->
      response = $scope.response
      responseType = response.question.responseType

      if responseType is 'Bookends'
        $scope.has_response = response.numericResponseA isnt null or response.numericResponseB isnt null
      else if responseType in ['Checkbox', 'Dropdown']
        $scope.has_response = if _.isArray(response.listValueID) then !!response.listValueID.length else !!response.listValueID
      else
        responseValue = response[value_property_map[responseType]]
        $scope.has_response = responseValue? and responseValue isnt ''

    @responseDidChange = (modelController, previousValue) ->
      newValue = modelController.$modelValue

      if newValue is null and previousValue is null
        return false

      newValue isnt previousValue

    @saveResponse = (response) ->
      response_attributes = []
      responseType = response.question.responseType

      $scope.loading = true

      @checkForResponse()

      if $scope.has_response
        response_attributes = ['sequenceID', 'question', value_property_map[responseType]]

        if responseType in ['BooleanPlus', 'NoPlus', 'Dropdown', 'CheckBox']
          response_attributes.push 'textResponse'

        if responseType is 'Bookends'
          response_attributes.push 'numericResponseA', 'numericResponseB'

        promise = $scope.saveResponse(_(response).pick(response_attributes)).then((new_response) ->
          _(response).extend new_response
          response
        )
      else
        $scope.display_delete_button = false
        promise = $scope.deleteResponse(response)

      promise.then (new_response) ->
        $scope.loading = false
        new_response

      if !$scope.$$phase and !$scope.$root.$$phase
        # if no digest is already in progress then digest,
        # usually happens during checkbox save as they don't use jquery events
        $scope.$digest()

      promise

    @setErrorMessage = (message) ->
      $scope.$evalAsync ->
        $scope.error_message = message

    @removeErrorMessage = ->
      $scope.$evalAsync ->
        $scope.error_message = ''

    @emitEvent = (event) ->
      $scope.$emit event, $scope.response

    return
