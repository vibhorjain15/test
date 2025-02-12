class CompareDueDiligencesController extends BaseController

  @register 'CompareDueDiligencesController'

  @inject 'DueDiligenceDataservice', '$stateParams', '$state', 'ComparisonDataService', 'toaster', '$window', 'TemplatesDataService','Restangular','ratingConstants','$timeout','Utils','angularEnabled'

  initialize: ->
    @tilesRendered = false
    @copyOfOriginalData = []
    @selectedDueDiligences = []
    @max_comparisons = 10
    @removedDdIds = []
    @compareResults = []
    @fundNames = []
    @allComparisonIds = []
    @flaggedIds = []
    @isLoading = true
    @activeTab = 'showAll'
    @headersRow = "headersRow"
    @headersRowBody = "headersRowBody"
    @currentPage = 0
    @totalItemsPerPage = 10
    @currentIndex = 0
    @compareResponsesPaged = []

    @TemplatesDataService.getTemplate(@$stateParams.template_id).then (template)=>
      @Restangular.one('templates',template.templateInfo.id).one('versions',template.templateInfo.version).all('TemplateRatingSchemeMappings').getList().then (response)=>
        ratingScheme = response
        if response.length > 0
          @ratingScheme = ratingScheme[0]
          @ratingScheme.primary_rating_scale_mode = @ratingScheme.rating_scale_mode
          @Restangular.one('v2/rating_scales',ratingScheme[0].rating_scale_id).one('versions',0).getList('rating_scale_definitions').then (rating_scale) =>
            @rating_scales = rating_scale
            noValueIndex = _(@rating_scales).findIndex (scale)=>
              parseInt(scale.value) == @ratingConstants.naValue

            if noValueIndex > -1
              @naValue = @rating_scales[noValueIndex]
              @rating_scales.splice(noValueIndex,1)

            unless @ratingScheme.project_level_rating_scale_id
              @secondary_rating_scales = @rating_scales
              @secondaryNaValue = @naValue

          if @ratingScheme.project_level_rating_scale_id
            @ratingScheme.primary_rating_scale_mode = @ratingScheme.project_level_rating_scale_mode
            @Restangular.one('v2/rating_scales',@ratingScheme.project_level_rating_scale_id).one('versions',0).getList('rating_scale_definitions').then (rating_scale) =>
              @secondary_rating_scales = rating_scale
              noValueIndex = _(@secondary_rating_scales).findIndex (scale)=>
                parseInt(scale.value) == @ratingConstants.naValue

              if noValueIndex > -1
                @secondaryNaValue = @secondary_rating_scales[noValueIndex]
                @secondary_rating_scales.splice(noValueIndex,1)

    # @compare_dates = @ComparisonDataService.getComparisonDates()
    if @activeTab is  'showAll'
      @ComparisonDataService.setComparisonIds(@$stateParams.ids.split(','))

    @DueDiligenceDataservice.compare(@$stateParams.ids).then (response) =>
      @isLoading = false
      if response.length
        @ComparisonDataService.setComparisonData(response)
        @copyOfOriginalData = @ComparisonDataService.getComparisonData()
        @compareResults = response
        @loadSeletables(@compareResults)


  getHeight: (cls) ->
    $('.' +cls).height $(window).height() - 260

  loadSeletables: (response) ->
    @fundNames = []
    @allComparisonIds = []
    @flaggedIds = []
    @selectedDueDiligences = []
    _(response[0].response).each (item, i) =>
      if item.total_flags
        @flaggedIds.push item.id
      @allComparisonIds.push item.id
      @fundNames.push { "name" : item.fundName, "created_at" : item.created_at, "lastupdate_at" : item.lastupdate_at, "id": item.id, "aggregate_score" : item.aggregate_score, "aggregate_total" :  item.aggregate_total , "total_flags" : item.total_flags , "idx" : i , "aggregate_rating": item.aggregate_rating}
    if @allComparisonIds.length is 2
      @selectedDueDiligences = @allComparisonIds


  filterFlagged: ->
    @compareResults = @ComparisonDataService.getComparisonData()
    protoArray = []
    _(@compareResults).each (item,idx) ->
      found = false
      _(item.response).each (innerResponse,idx2) ->
        if innerResponse.is_flagged is true
          found = true
          return false
      if found is true
        protoArray.push item
    @compareResults = protoArray

  filterScored: ->
    @compareResults = @ComparisonDataService.getComparisonData()
    protoArray = []
    _(@compareResults).each (item,idx) ->
      found = false
      _(item.response).each (innerResponse,idx2) ->
        if innerResponse.score
          found = true
          return false
      if found is true
        protoArray.push item
    @compareResults = protoArray


  loadTrackChanges: ->
    compareResults = @ComparisonDataService.getComparisonData()
    if @removedDdIds.length > 0
      compareResults = @ComparisonDataService.filterRemoved(@removedDdIds , compareResults)
    @compareResults = @ComparisonDataService.sortByLastUpdated(compareResults)
    @ComparisonDataService.setComparisonData(compareResults)
    @loadSeletables(compareResults)
    compareResults

  loadShowAll: ->
    @compareResults = []
    @compareResults = @ComparisonDataService.getComparisonData()
    if @removedDdIds.length > 0
      @compareResults = @ComparisonDataService.filterRemoved(@removedDdIds , @compareResults)
    @loadSeletables(@compareResults)
    @ComparisonDataService.setComparisonData(@compareResults)
    @compareResults

  toggleComparisonTab: (tab) ->
    if (@activeTab != 'trackChanges' and tab is 'trackChanges' and @selectedDueDiligences.length != 2)
      return
    if (tab is 'trackChanges' and @selectedDueDiligences.length != 2)
      return
    @compareResults = []
    @isLoading = true
    if tab is 'trackChanges' and @selectedDueDiligences.length is 2
      @compareResults = @loadTrackChanges()
    if (tab is 'showAll')
      @loadShowAll()
    if (tab is 'showFlagged')
      @filterFlagged()
    if (tab is 'showScoreMap')
      @filterScored()
    @activeTab = tab
    @$timeout =>
      @currentPage = 0
      @totalItemsPerPage = 10
      @currentIndex = 0
      @compareResponsesPaged = []
      @isLoading = false


  selectedIds: ->
    if @selectedDueDiligences?.length > 1
      @selectedDueDiligences.join ','

  notifyMaxTemplateSelection: ->
    message = 'At most '+@max_comparisons+' projects can be selected for comparison'

    @toaster.clear '*'
    @toaster.pop 'info', '', message

  returnToDDList: ->
    state_params =
      keepData: true
    @$state.go 'app.analyze.compare.due_diligence_list' , state_params

  removeSelectedItem: (id, idx) ->
    indexToRemove = null
    removedId = null
    _(@compareResults[0].response).each (innerRes, i) =>
      if innerRes.id == id
        removedId = id
        indexToRemove = i
        return false
    _(@compareResults).each (item, i) =>
      item.response.splice(indexToRemove,1)

    if removedId
      @removedDdIds.push removedId
    if @activeTab is "showAll"
      @ComparisonDataService.setComparisonData(@compareResults)

    @loadSeletables(@compareResults)
    @compareResults

  getResponses: =>
    @currentPage += 1
    while @currentIndex < @totalItemsPerPage * @currentPage and @currentIndex < @compareResults.length
      if @compareResults[@currentIndex]
        @compareResponsesPaged.push @compareResults[@currentIndex]
      @currentIndex++
