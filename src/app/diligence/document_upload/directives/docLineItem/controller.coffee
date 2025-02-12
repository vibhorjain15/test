class DocLineItemController extends BaseController
  @register 'DocLineItemController'

  @inject 'DDDocumentUploadDataservice', '$attrs', '$scope',
          'Restangular', 'toaster', 'ModalFactory'

  initialize: ->
    @line_item = @$scope.$eval @$attrs.lineItem
    @template_id = @$scope.$parent.$eval @$attrs.templateId

    deregisterer = @$scope.$parent.$watch @$attrs.responseTypes, (value) =>
      if value?
        @response_types = value
        deregisterer()

    @getQuestionMappings(@line_item.id)

  openAddQuestionsDialog: ->
    question_params =
      text: @line_item.extracted_text

    @ModalFactory.invokeModal 'add_question',
      resolve:
        templateId: => @template_id
        question_params: => question_params
      success: (question) =>
        question.responsetype = question.responseType
        @questions.push(question)
        @line_item.question_id = question.id

        @saveNewMapping()

  getQuestionMappings: (line_item_id) ->
    params =
      doc_lineitem_id: line_item_id

    @DDDocumentUploadDataservice
      .getQuestionMappings(params).then (response) =>
        @questions = response
        @watchForMappingChange()

  watchForMappingChange: ->
    @$scope.$watch 'vm.line_item.question_id', (value) =>
      if value?
        question = _(@questions).findWhere(id: value)

        @mapped_question = question
        @mapped_question_response_type = _(@response_types).findWhere(
          text: question?.responsetype
        )
      else
        @mapped_question_response_type = null

  saveNewMapping: ->
    params =
      question_id: @line_item.question_id

    @DDDocumentUploadDataservice
      .updateLineItem(@line_item.id, params)
      .then (response) =>
        @toaster.pop 'success', '', 'Your mapping has been saved'
