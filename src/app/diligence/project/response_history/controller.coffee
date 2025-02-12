class ProjectResponseHistoryController extends BaseController

  @register 'ProjectResponseHistoryController'

  @inject '$stateParams', 'Restangular', '$scope', '$state', 'Utils', 'angularEnabled'

  initialize: ->
    diligenceId = @$stateParams.diligenceId

    @$scope.getDueDiligence().then (diligence) =>
      @diligence = diligence

    @Restangular.one('v2/diligences', diligenceId).all('response_history').getList().then (responses) =>
      grouped_responses = _(responses).groupBy((response) ->
        response.questionID
      )

      @responses_count = responses.length
      @grouped_responses = _(grouped_responses).map((response, questionID) ->
        {
          sectionName: response[0].parentSectionName
          subSectionName: response[0].sectionName
          question_text: response[0].questionText
          responses: response
          responseType: response[0].response_type
        }
      )

  redirectToQuestionnaire: ->
    # '^' means parent state, so here the parent state of this route is project. So goto -> project.questionnaire
    @$state.go '^.questionnaire'

  getResponseText: (parentIndex, index) ->
    @grouped_responses[parentIndex].responses[index].responseDisplay
