angular.module('diligenceVault').directive 'commentSection', () ->
  restrict: 'E'
  require: [ '^questionnaireFormControl', '?^questionnaire' ]
  templateUrl: 'diligence/project/questionnaire/other_directives/comment_section/template.html'
  scope: true
  controller: 'ProjectCommentsController'
  controllerAs: 'vm'
  link: (scope, element, attrs, controllers) ->
    questionnaireFormControlController = controllers[0]
    questionnaireController = controllers[1]

    scope.response = questionnaireFormControlController.response
    scope.isEditable = questionnaireFormControlController.isEditable
    scope.printPreview = questionnaireController.printPreview
    scope.isInternal = questionnaireController.diligence.is_internal

    scope.hideCommentSection = () =>
      questionnaireFormControlController.hideCommentSection()

    scope.updateComment = (comment) =>
      scope.response.attributes.textResponse = comment
      questionnaireFormControlController.updateQuestionnaireComment()

    scope.deleteComment = () =>
      scope.response.attributes.textResponse = ''
      questionnaireFormControlController.hideCommentSection()
      questionnaireFormControlController.updateQuestionnaireComment()

    scope.closeComment = () =>
      questionnaireFormControlController.hideCommentSection()
