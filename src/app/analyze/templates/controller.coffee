class AnalyzeTemplatesController extends BaseController
  @register 'AnalyzeTemplatesController'
  @inject 'TemplatesDataService', '$state', '$scope', '$window', 'Restangular','Utils','angularEnabled'

  initialize: ->
    @isManager = @Utils.isManager()
    @filters =
      template_id: @$state.params.templateId,
      tag_id: @$state.params.tagId

    if @$state.params.selectedRange == 'No Filter'
      @customDateFilter = {
        startDate: null
        endDate: null
        selectedRange : @$state.params.selectedRange
      }
    else if @$state.params.start_date and @$state.params.end_date
      @customDateFilter = {
        startDate: moment(@$state.params.start_date)
        endDate: moment(@$state.params.end_date)
        selectedRange : @$state.params.selectedRange
      }
    @getFirmPref()
    @getTemplates()
    @getTags()
    @getAnalytics()
    @watchForRouteChange()
    if @isManager
      @$window.history.back()
      return
      
  getFirmPref: =>
    @loading_prefs = true
    @Restangular.all('firm_preferences').customGET().then (response) =>
      @predefinedDate = @Utils.getPredefinedDateRanges(response.default_daterange_months)
      @predefinedDate.selectedRange = @Utils.getDateRanges()[response.default_daterange_months].label
      if not @customDateFilter
        @customDateFilter = @predefinedDate
      @loading_prefs = false

  getAnalytics: ->
    @benchmark_form.$setSubmitted true if @benchmark_form
    if @filters.template_id?
      @gotoTemplateResponseAnalysisRoute()
    else
      @gotoTemplateSelectionRoute()

  reset: ->
   @filters = {}
   @customDateFilter = @predefinedDate
   @$state.go 'app.analyze.templates' , {} , reload : true

  watchForRouteChange: ->
    # basically when user reloads the page which has templateId in the
    # route params, we need to show that template as preselected in the
    # dropdown
    @$scope.$watch 'vm.$state.params.templateId', (value) =>
      value = value and Number(value)

      if @filters.template_id isnt value
        @filters.template_id = value

    @$scope.$watch 'vm.$state.params.tagId', (value) =>
      value = value and Number(value)

      if @filters.tag_id isnt value
        @filters.tag_id = value

    @$scope.$watch 'vm.$state.params.start_date', (value) =>

      if @customDateFilter and @customDateFilter.startDate isnt moment(value)
        @customDateFilter.startDate = moment(value)

    @$scope.$watch 'vm.$state.params.end_date', (value) =>

      if @customDateFilter and @customDateFilter.endDate isnt moment(value)
        @customDateFilter.endDate = moment(value)

  gotoTemplateResponseAnalysisRoute: () ->
    if @filters.tag_id
      @tagId = @filters.tag_id

    if @customDateFilter.selectedRange == 'No Filter'
      @start_date = null
      @end_date = null
    else
      @start_date = @Utils.formatDatetime(@customDateFilter.startDate)
      @end_date = @Utils.formatDatetime(@customDateFilter.endDate)

    @$state.go 'app.analyze.templates.categories', {
      templateId: @filters.template_id,
      tagId: @tagId
      start_date: @start_date
      end_date: @end_date
      selectedRange: @customDateFilter.selectedRange
    }

  gotoTemplateSelectionRoute: ->
    @$state.go 'app.analyze.templates'

  getTemplates: ->
    @TemplatesDataService.getTemplates(in_use: true).then (response) =>
      @templates = response

  getTags: ->
    @Restangular.all('tags').getList(in_use: true).then (response) =>
      @tags = response

  goBack: =>
    @$window.history.back()
