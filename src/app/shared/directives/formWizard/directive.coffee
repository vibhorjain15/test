angular.module('diligenceVault').directive 'formWizard', (WizardHandler, $q) ->
  restrict: 'E'
  templateUrl: 'shared/directives/formWizard/template.html'
  transclude: true
  scope:
    'displayFooter': '='
    'name': '@'
    'onFinish': '&'
    'onChange': '&'
    'startStep': '='
  controller: ($scope) ->
    $scope.steps = []
    $scope.stepCount = 0

    unless $scope.displayFooter?
      $scope.displayFooter = true

    WizardHandler.addWizard $scope.name or WizardHandler.defaultName, this

    $scope.$on '$destroy', ->
      WizardHandler.removeWizard $scope.name or WizardHandler.defaultName

    setCurrentStep = (step) ->
      if $scope.currentStep
        $scope.currentStep.active = false

      if step.beforeEnter
        step.beforeEnter()

      if $scope.onChange
        $scope.onChange({$step_index: step.index})

      step.active = true
      $scope.currentStep = step

    canExit = (step) ->

      if _.isUndefined(step.canExit)
        return true

      if _.isBoolean(step.canExit)
        return step.canExit

      if _.isFunction(step.canExit)
        result = step.canExit()

        if angular.isFunction(result?.then)
          $scope.loading = true
          deferred = $q.defer()

          result.then (response) -> deferred.resolve(response)

          result.finally(-> $scope.loading = false)

          return deferred.promise
        else
          return result

    $scope.goToNextStep = ->
      if $scope.currentStep.index is $scope.steps.length - 1
        result = $scope.onFinish()

        if angular.isFunction(result and result.then)
          $scope.loading = true

          result.finally ->
            $scope.loading = false
        return

      $scope.currentStep.triggerFormSubmission()

      $q.all([ canExit($scope.currentStep) ]).then (data) ->
        if data[0]
          $scope.currentStep.done = true
          setCurrentStep $scope.steps[$scope.currentStep.index + 1]
        if $scope.name == 'new-request-investor-pending' && $scope.currentStep.index == 2
            $scope.displayFooter = false

    $scope.goToDraftsStep = ->

      $scope.$parent.vm.saveAsDraft = true

      if $scope.currentStep.index is $scope.steps.length - 1
        result = $scope.onFinish()

        if angular.isFunction(result and result.then)
          $scope.draft_loading = true

          result.finally ->
            $scope.draft_loading = false

        return

      $scope.currentStep.triggerFormSubmission()

      $q.all([ canExit($scope.currentStep) ]).then (data) ->
        if data[0]
          $scope.currentStep.done = true
          setCurrentStep $scope.steps[0]

    $scope.setExistInArray = (step) ->
      return true

    $scope.goToPreviousStep = ->
      return if $scope.currentStep.index is 0

      previousStep = $scope.steps[$scope.currentStep.index - 1]
      previousStep.done = false

      setCurrentStep previousStep

    @setFooterVisibility = (value) ->
      $scope.displayFooter = value

    @registerStep = (step) ->
      step.index = $scope.steps.length
      step.active = false
      step.originalStepName = step.stepName

      $scope.steps.push step

      if $scope.startStep?
        if $scope.steps.length is $scope.startStep
          setCurrentStep step
        else if $scope.steps.length < $scope.startStep
          step.done = true
      else
        if $scope.steps.length is 1
          setCurrentStep step

    @goToNextStep = ->
      $scope.goToNextStep()

    @goToDraftsStep = ->
      $scope.goToDraftsStep()

    @goToPreviousStep = ->
      $scope.goToPreviousStep()

    @initialiseStep = (step)=>
      $scope.stepCount++
      step.active = false
      step.stepIndex = $scope.stepCount

    @initialiseSubStep = (step)=>
      $scope.stepCount = step.level + 1
      step.active = false
      step.stepIndex = step.level

    @addStep = (step)=>
      step.index = step.stepIndex - 1
      _($scope.steps).each (item)=>
        if item.stepIndex > step.stepIndex
          item.index++
      $scope.steps.splice(step.index,0,step)

    @removeStep = (step)=>
      if step.index
        $scope.steps.splice(step.index,1)

        _($scope.steps).each (item)=>
          if item.stepIndex > step.stepIndex
            item.index--

    @removeDeadSteps = =>
      stepsToBeRemoved = []
      _($scope.steps).each (step,index)=>
        if step and step.stepName and step.stepIsAlive and !step.stepIsAlive({results: step.originalStepName})
          stepsToBeRemoved.push step

      _(stepsToBeRemoved).each (step)=>
        stepIndex = _($scope.steps).indexOf(step)
        $scope.steps.splice(stepIndex,1)

    return
