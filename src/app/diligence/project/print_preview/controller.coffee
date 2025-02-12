class ProjectPrintPreviewController extends BaseController

  @register 'ProjectPrintPreviewController'

  @inject 'DueDiligenceDataservice', '$state', '$stateParams', '$scope', '$rootScope', '$http', 'baseUrl'

  initialize: ->
    @statusFilter = @$stateParams.status
    @$scope.getDueDiligence().then (diligence) =>
      fund_name = diligence.entity_name
      today = moment().format('MMM_DD_YYYY').toLowerCase()
      filename = "Questionnaire (#{fund_name})"

      @diligence = diligence
      @getQuestionCounts(@diligence.id)
      @printOptions = pageTitle: filename

      @$rootScope.title = filename #http://stackoverflow.com/questions/26905908/chrome-save-to-pdf-custom-filename

      @sectionFilters =
        StatusFilter: @statusFilter

      @disable_print = true

    @$rootScope.$on '$stateChangeSuccess', (event, toState, toParams, fromState, fromParams) =>
      @disable_print = true

    @$rootScope.$on 'questionnaire:render', =>
      @disable_print = false

  getSections: (status) =>
    # '^' means parent state, so here the parent state of this route is project. So goto -> project.print_preview
    if @statusFilter is status
      @$state.go '.', {status: null}
    else
      @$state.go '.', {status: status}

  getQuestionCounts: (id) =>
    @DueDiligenceDataservice.getQuestionCounts(id).then (response) =>
      _(response).each (count_info) =>
        switch count_info.id
          when 'AnsweredTotal'
            @answeredCount = count_info.value
          when 'UnAnsweredTotal'
            @unansweredCount = count_info.value
