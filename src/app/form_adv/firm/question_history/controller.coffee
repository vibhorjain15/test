class FormADVQuestionHistoryController extends BaseController
  @register 'FormADVQuestionHistoryController'

  @inject 'Restangular', '$stateParams'

  initialize: ->
    @firmCrd = @$stateParams.firmCRD

    @loadQuestion(@$stateParams.questionId)

    @dateRange =
      start_at: @$stateParams.start_at
      end_at: @$stateParams.end_at

  loadQuestion: (questionId) ->
    @Restangular.one('Formadv_Questions', questionId).get().then (response) =>
      @question = response
