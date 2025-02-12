class AddTemplateQuestionsController extends ModalController

  @register 'AddTemplateQuestionsController'

  @inject '$stateParams', 'parentName', 'existingQuestions', 'TemplatesDataService', '$rootScope', '$scope', 'toaster', '$timeout'

  initialize: ->
    @subcategoryId = @$stateParams.subcategoryId
    @templateId = @$stateParams.templateId
    @useSingleQuestionMode = false
    @newQuestions = []
    @responseTypesForBulk = []
    @selectedResponseType = {}
    @savingQuestion = false
    @getResponseTypes()

    @$scope.$on 'errorWhileSaving', (ev, error) =>
      @savingQuestion = false


  getResponseTypes: ->
    @TemplatesDataService.getResponseTypes().then (responseTypes) =>
      @responseTypes = responseTypes
      @responseTypesForBulk = responseTypes


  # checkboxValueChanged: (useSingleMode) =>
  #   if useSingleMode and @newQuestions.length
  #     preview = true
  #     @saveBulkQuestions(preview)

  onAdd: (questions) ->
    @allQuestions = questions

  onSave: (questions) ->
    @close(questions)
