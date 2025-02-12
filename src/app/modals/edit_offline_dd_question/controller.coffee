class EditOfflineDDQuestionController extends ModalController
  @register 'EditOfflineDDQuestionController'

  @inject 'question_params', 'Restangular', '$scope', 'response_types', 'toaster'

  initialize: ->
    @question = @question_params
    @templateId = @question_params.templateId

  onCancel: (question) =>
    @close(question)

  onSave: (question) =>
    question.responseTypeDescription = (_(@response_types).findWhere(
      text: question.response_type
    ))?.description
    @toaster.pop 'success', '', 'Question successfully updated', 5000
    @close(question)

