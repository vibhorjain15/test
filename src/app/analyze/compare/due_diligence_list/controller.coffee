class CompareDueDiligenceListController extends BaseController

  @register 'CompareDueDiligenceListController'

  @inject '$scope', 'toaster', 'Restangular', 'Utils', '$window', 'ComparisonDataService', '$timeout', '$rootScope', '$stateParams', '$state', '$location','ratingConstants','$q','angularEnabled'

  initialize: ->
    @getFirmPref()
    @due_diligences = []
    @selectedTemplate = null
    @selectedTemplateName = null
    @filters = {}
    @selectedDueDiligences = []
    @is_manager = @Utils.isManager()
    @is_vendor = @Utils.isVendorSubscription()
    @entity_sub_type = @Utils.getEntitySubType()
    @max_comparisons = 10
    @isLoading = false
    @showPannel = false
    @ratingScheme = null
    @selectedDDsArray = []

    promises = []
    promises.push @Restangular.all('templates').getList(in_use: true).then (response) =>
      @templates = response

    if @is_vendor
      promises.push @Restangular.all('vendor_types').getList().then (response) =>
        @strategies = response
    else
      promises.push @Restangular.all('strategies').getList(in_use: true).then (response) =>
        @strategies = response

    @$q.all(promises).then (response)=>
      # Check if user is returning from track screen
      if @$stateParams.keepData
        # get saved data
        @savedData = @ComparisonDataService.getSelections()
        if @savedData? and @savedData.filters
          # set filters
          @filters = @savedData.filters
          @customDateFilter =
            startDate : moment(@filters.start_date)
            endDate : moment(@filters.end_date)
            selectedRange : @filters.selectedRange
          @setTemplateName(@filters.template_id)
          @fetchDiligences()
          @getRatingScale()
        else
          # if keepdata is true but data is not saved clear params
          @resetUrl()
    if @is_manager
      @$window.history.back()
      return

  getFirmPref: =>
    @loading_prefs = true
    @Restangular.all('firm_preferences').customGET().then (response) =>
      @customDateFilter = @Utils.getPredefinedDateRanges(response.default_daterange_months)
      @customDateFilter.selectedRange = @Utils.getDateRanges()[response.default_daterange_months].label
      @defaultDateRange = angular.copy @customDateFilter
      @loading_prefs = false

  notifyMaxTemplateSelection: ->
    message = 'At most '+@max_comparisons+' projects can be selected for comparison'

    @toaster.clear '*'
    @toaster.pop 'info', '', message

  resetUrl: ->
    @$location.url @$location.path()

  selectedIds: ->
    if @selectedDueDiligences?.length > 1
      _(@selectedDueDiligences).pluck('id').join ','

  setTemplateName: (id) =>
    @selectedTemplate = _(@templates).findWhere(id: id)
    @selectedTemplateName = @selectedTemplate.name

  validateFilters: ->
    validity = true
    if(@filters.start_date > @filters.end_date)
      @toaster.pop 'error', 'Error', 'Please select an end date greater than start date'
      validity = false

    validity

  fetchDiligences: (dates) =>
    if !@filters.template_id
      @toaster.pop 'info', '', "Please Select a template"
      return
    # Assign dates to fitersObj
    if @customDateFilter.selectedRange == 'No Filter'
      @filters.start_date = null
      @filters.end_date   = null
    else
      @filters.start_date = @Utils.formatDatetime(@customDateFilter.startDate)
      @filters.end_date   = @Utils.formatDatetime(@customDateFilter.endDate)
    @filters.selectedRange = @customDateFilter.selectedRange

    # check if dates are valid
    if !@validateFilters()
      return

    @isLoading = true
    @showPannel = true
    @tilesRendered = false
    @selectedDueDiligences = []
    params = _(@filters).pick('start_date','end_date','template_id','strategy_id')
    @Restangular.all('compare').getList(params).then (response) =>
      @due_diligences = response
      @isLoading = false
      if @savedData.selectedDiligences
        @selectedDDsArray = _(@savedData.selectedDiligences).pluck('id')


  searchWithFilters: =>
    @fetchDiligences()
    @getRatingScale()

  getRatingScale: =>
    @Restangular.one('templates',@selectedTemplate.id).one('versions',@selectedTemplate.version).all('TemplateRatingSchemeMappings').getList().then (response)=>
      ratingScheme = response
      if response.length > 0
        @ratingScheme = ratingScheme[0]
        if @ratingScheme.project_level_rating_scale_id
          rating_scale_id = @ratingScheme.project_level_rating_scale_id
          @ratingScheme.primary_rating_scale_mode = @ratingScheme.project_level_rating_scale_mode
        else
          rating_scale_id = @ratingScheme.rating_scale_id
          @ratingScheme.primary_rating_scale_mode = @ratingScheme.rating_scale_mode
        @Restangular.one('v2/rating_scales',rating_scale_id).one('versions',0).getList('rating_scale_definitions').then (rating_scale) =>
          @rating_scales = rating_scale
          noValueIndex = _(@rating_scales).findIndex (scale)=>
            parseInt(scale.value) == @ratingConstants.naValue

          if noValueIndex > -1
            @naValue = @rating_scales[noValueIndex]
            @rating_scales.splice(noValueIndex,1)


  resetDates: =>
    @customDateFilter = angular.copy @defaultDateRange

  clearFiters: =>
    @filters = {}
    @due_diligences = []
    @selectedDDsArray = []
    @showPannel = false
    @selectedDueDiligences = []
    @ComparisonDataService.setSelections({})
    @resetUrl()
    @resetDates()


  # check id dd exist in selection array
  # if exists then click that li
  existInSelectedDDs: (id,index) ->
    found = false
    if id in @selectedDDsArray
      found = true
      @triggerClicks(index)

  # Trigger clicks on list items that are selected
  triggerClicks: (index) ->
    @$timeout =>
      jQuery('#select_li_' + index).click()
    , 1000


  saveSelections: =>
    selections=
      filters: @filters
      selectedDiligences: @selectedDueDiligences
    @ComparisonDataService.setSelections(selections)

  goBack: =>
    @$window.history.back()
