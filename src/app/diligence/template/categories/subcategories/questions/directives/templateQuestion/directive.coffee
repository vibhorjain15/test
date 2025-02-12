angular.module('diligenceVault').directive 'templateQuestion', (TemplatesDataService, toaster)->
  restrict: 'A'
  controller: ($scope) ->
    $scope.formHolder = {} #http://stackoverflow.com/questions/22436501/simple-angularjs-form-is-undefined-in-scope
    $scope.initialized = true
    $scope.editing_question = false

    $scope.editQuestion = ->
      return unless $scope.question.isEditable

      $scope.editing_question = true
      $scope.question_copy = angular.copy($scope.question)

    $scope.cancelQuestionEdit = ->
      $scope.editing_question = false

    $scope.updateQuestion = ->
      question = undefined
      params = undefined
      if $scope.formHolder.edit_question_form.$valid
        question = $scope.question_copy
        params = _(question).pick('text')
        $scope.updating_question = true

        TemplatesDataService.updateQuestion(question.id, params).then (response) ->
          $scope.updating_question = false
          $scope.question.text = response.text
          toaster.pop 'success', 'Question updated successfully!'
          $scope.cancelQuestionEdit()

    return
