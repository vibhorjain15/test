angular.module('diligenceVault').directive 'wizardStep', ->
  restrict: 'E'
  require: '^formWizard'
  transclude: true
  templateUrl: 'shared/directives/wizardStep/template.html'
  scope:
    title: '=stepTitle'
    beforeEnter: '&'
    contentTitle: '=stepContentHeaderTitle'
    contentTitleType: '=stepContentHeaderType'
    contentTitleTooltip: '=stepContentHeaderTooltip'
    canExit: '='
    previousButtonLabel: '@'
    nextButtonLabel: '@'
    draftButtonLabel: '@'
    nextButtonType: '@'
    nextButtonIsFloating: '@'
    stepShow: '='           #dont use this with stepName, stepIsAlive and stepSelectionControl options
    stepSelectionControl: '='
    stepIsAlive: '&'
    level:'='
    stepName: '='
    backButtonLabel: '@'
    onBackButtonClick: '&'
  link: ($scope, element, attrs, formWizardController) ->
    $scope.triggerFormSubmission = ->
      angular.forEach element.find('form'), (form) ->
        controller = angular.element(form).controller('form')

        if angular.isDefined(controller)
          controller.$setSubmitted true

    # formWizardController.initialiseStep $scope

    if $scope.level
      formWizardController.initialiseSubStep $scope
    else
      formWizardController.initialiseStep $scope

    if attrs.stepSelectionControl
      $scope.$watch 'stepSelectionControl',(value)=>
        formWizardController.removeDeadSteps()

    if attrs.stepShow == undefined
      formWizardController.registerStep $scope
    else
      $scope.$watch 'stepShow',(value)=>
        if value == true
          formWizardController.addStep($scope)
        else if value == false
          formWizardController.removeStep($scope)
