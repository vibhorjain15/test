class AddQuestionController extends ModalController
  @register 'AddQuestionController'

  @inject 'templateId', 'question_params'

  onSave: (question) ->
    @close(question)
