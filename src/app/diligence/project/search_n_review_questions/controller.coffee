class ProjectSearchAndReviewQuestionsController extends BaseController

  @register 'ProjectSearchAndReviewQuestionsController'

  @inject 'DueDiligenceDataservice', '$stateParams', '$scope', '$rootScope', '$http', 'baseUrl', 'Utils', '$state', '$sce', 'angularQuestionnaireEnabled'

  initialize: ->
    is_investor = @Utils.isInvestor()
    @tiggerHighlight = 0

    @options =
      viewMySections: false
      mode: if is_investor then 'investor' else 'manager'

    @search_text = @$stateParams.searchString
    @search_text_new = @$stateParams.searchString

    @sectionFilters = {
      StatusFilter: 'Search'
      q: @search_text
    }

    @$scope.getDueDiligence().then (diligence) =>
      @diligence = diligence
      @sectionFilters =
        StatusFilter: 'Search'
        q: @search_text

    @noResultsPresent = false

    @$rootScope.$on 'questionnaire:no-results', =>
      @noResultsPresent = true

    @$rootScope.$on 'questionnaire:render', =>
      @tiggerHighlight += 1

  searchQuestions: (status) =>
    @noResultsPresent = false
    if @search_text_new
      @$state.go '^.search_n_review_questions', {searchString: @search_text_new}

  goBack: =>
    # '^' means parent state, so here the parent state of this route is project. So goto -> project.questionnaire
    if @noResultsPresent
      @$state.go '^.questionnaire', {status: null, q: null}
    else
      @$state.go '^.questionnaire', {status: 'Search', q: @search_text}
