class QuestionnaireTextResponseAnalysisController extends BaseController
  @register 'QuestionnaireTextResponseAnalysisController'
  @inject '$scope', '$attrs', 'ResponseDataservice', 
          'ResponseAnalysisFactory','$stateParams','$state'

  initialize: ->
    deregisterer = @$scope.$parent.$watchGroup [@$attrs.question, @$attrs.templateId,@$attrs.customDateFilter], (values) =>
      if values[0] && values[1]
        @question = values[0]
        @templateId = values[1]
        @customDateFilter = {
          start_date: @$state.params.start_date
          end_date: @$state.params.end_date
        }
        @tagId = @$stateParams.tagId
        @getResponseAggregations(@templateId, @question.id, @tagId, @customDateFilter)
        deregisterer()

  getResponseAggregations: (template_id, question_id, tag_id, customDateFilter) ->
    @ResponseDataservice.getAggregations({
      template_id: template_id,
      question_id: question_id,
      tag_id: tag_id
      start_date: customDateFilter.start_date
      end_date: customDateFilter.end_date
    }).then (response) =>
      @aggregations = response.results
