class DashInvestorController extends BaseController

  @register 'DashInvestorController'

  @inject '$http', 'baseUrl', 'Restangular', 'Utils', '$rootScope', 'DashboardActionsResource', '$state', 'ModalFactory', '$q', '$timeout', '$stateParams', 'WorkflowStatusResource', 'FlagScoreResource', 'HeatmapDataService','keywordConstants', 'DueDiligenceInvestor', '$scope'

  initialize: ->
    _this = @
    @loading = false
    @heatmap_options = {}
    @projectsTabsArray = ['in-progress' , 'sent', 'invited', 'closed', 'my-projects', 'all']
    @heatmap_data = undefined
    @invertColor = false
    @heatmap_orientation = "X"
    @colorScheme = @HeatmapDataService.getColorScheme()
    @heatMapChartId = @HeatmapDataService.getHeatmapChartId()
    @heatmapChartContainer = "heatmapChartContainer"
    @chartWidthDiv = "chartWidthDiv"
    @plotWidth = @HeatmapDataService.getPlotWidth()
    @plotHeight = @HeatmapDataService.getPlotHeight()
    @is_manager = @Utils.isManager()

    @cellWidth = @HeatmapDataService.getDefaultCellWidth()
    @cellHeight = @HeatmapDataService.getDefaultCellHeight()

    @filename = "HeatMap"
    @maxScore = undefined
    @SORT_STATE = @HeatmapDataService.getSortState()
    @entity_type = undefined
    @TEXT_DISPLAY_STATE = @HeatmapDataService.getTextDisplayState()
    @RE_INIT_HEATMAP = false
    @eventDateFormat = 'YYYY-MM-DDThh:mm:ssZ'
    @entity_sub_type = @Utils.getEntitySubType()

    @defaultColorScheme = @Utils.getFirmColorScheme()
    @dashType = @$stateParams.dashType || 'Activity'
    @dashFilterMap = ['Activity', 'Monitor']
    @is_freeSubscription = @Utils.isFreeSubscription()
    @selected_rating_scheme_id = undefined
    @heatMapApiData = undefined
    @heatmapResponse = undefined


    @punchcard_options =
      # tooltip method for cells
      tooltipText: (data) ->
        if not data.count
          str = 'No activity'
        else if data.count == 1
          str = 'One activity'
        else
          str = "#{data.count} activities"

        "#{str} on #{data.audit_date}"

      # tooltip method for header label text
      rowHeaderTextToolTip: (data) ->
        data.fullName

    @diligenceDonutChartConfig =
      data:
        columns: []
        type: 'donut'
        empty:
          label:
            text: 'Loading...'
        onclick: (d, element) ->
          _this.redirectToProjects(d, element, @)
      donut:
        title: ''
        label:
          format: ((value) -> value.toString())
      color: pattern: @defaultColorScheme

    @strategyDonutChartConfig =
      data:
        columns: []
        type: 'donut'
        empty:
          label:
            text: 'Loading...'
        onclick: (d, element) ->
          _this.redirectToProjects(d, element, @)
      donut:
        title: ''
        label:
          format: ((value) -> value.toString())
      color: pattern: @defaultColorScheme

    @diligences = @DueDiligenceInvestor.$new(
      type: 'in-progress',
      filters: {},
      include_custom_fields: true,
      )

    @Restangular.all('firm_preferences').customGET().then (response) =>
      if response.enable_yaxis_entity
        @heatmap_orientation = "Y"

      if response.invert_color
        @invertColor = response.invert_color

      if response.set_firm_entity_default and response.set_firm_entity_default.toLowerCase() == @keywordConstants.Firm.toLowerCase()
        @entity_type = "Firm"
      else
        @entity_type = "Fund"

      @customDateFilter = @Utils.getPredefinedDateRanges(response.default_daterange_months)
      @customDateFilter.selectedRange = @Utils.getDateRanges()[response.default_daterange_months].label
      if response.default_daterange_months
        dateRange = {
          startDate : @Utils.formatDatetime(@customDateFilter.startDate)
          endDate : @Utils.formatDatetime(@customDateFilter.endDate)
        }
      else
        dateRange = {
          startDate : null
          endDate : null
        }

      if @dashType == 'Monitor'
        @initMonitor(dateRange.startDate,dateRange.endDate)
        @loadDocs()
        @loadRecentFilings()
        @getCalendarEvents()
      else
        @loadActivityData(dateRange.startDate,dateRange.endDate)

    @$scope.$on 'due_diligence:remove', (events, diligence) =>
      @diligences.removeEntity diligence
      @diligences_grid.grid.options.data = @diligences.data

    @Restangular.all('decline_options').getList().then (response) =>
      @$scope.decline_options = response

    @$scope.dropdownAlignLeft = ($event, action, ID) ->
      $dropdown = $('.dropdown-menu-' + action + '-' + ID)
      $btn_group = $($event.currentTarget)
      offset = $btn_group.offset().left - $dropdown.width() + $btn_group.width()
      $dropdown.css 'left', offset

      return #to ensure no DOM nodes are referenced, https://docs.angularjs.org/error/$parse/isecdom
    @watchForDiligence()

  applyMethod: (startDate,endDate)=>
    if @dashType == 'Monitor'
      @initMonitor(startDate,endDate)
    else
      @loadActivityData(startDate,endDate)

  loadPunchcardData: (startDate,endDate)=>
    @loading_punchcard = true
    @Restangular.all('team_activities').customGET('',{start_date: startDate,end_date:endDate}).then (response) =>
      punchcard_data = []

      _(response.teamMember).each((name, index) ->
        # if length of name is greater than 16 characters then trim it
        if name.length > 16
          trimmedFullName = name.split(" ")
          trimmedFirstName = trimmedFullName[0]
          trimmedLastName = trimmedFullName[1]

          if trimmedFirstName.length > 8
            trimmedFirstName = trimmedFirstName.substring(0,8)
          if trimmedLastName.length > 8
            trimmedLastName = trimmedLastName.substring(0,8)

          trimmedFullName = trimmedFirstName + " " + trimmedLastName
        else
          trimmedFullName = name
        # keep trimmed name in name key and full name in fullName
        punchcard_row = [ { name: trimmedFullName , fullName : name } ]

        _(response.grouped_audits).each (audit_info) ->
          date = moment(audit_info.auditDate, 'MM-DD-YYYY')

          punchcard_row.push
            audit_date: date.format('DD MMM')
            count: audit_info.counts[index]

        punchcard_data.push punchcard_row
      )

      @punchcard_data = punchcard_data
      @loading_punchcard = false

  loadDDActivities: (startDate,endDate)=>
    @loading_activities = true
    @dateRange = {start_date: startDate,end_date: endDate}
    @Restangular.all('dd_activities').getList(start_date: startDate,end_date: endDate).then (response) =>
      @dd_activities = response
      @loading_activities = false

  loadActivityData: (startDate,endDate)=>
    @initGridSection = false
    @dateRange = {start_date: startDate,end_date: endDate}
    @my_actions = @DashboardActionsResource.$new({start_date: startDate,end_date: endDate})
    @workflow_statuses = @WorkflowStatusResource.$new({start_date: startDate,end_date: endDate})
    @loadPunchcardData(startDate,endDate)
    @loadDDActivities(startDate,endDate)
    @$timeout =>
      @initGridSection = true

  getExpiryClass: (expiryDate)=>
     classObject = @Utils.getExpiryClass(expiryDate)
     classObject

  loadDashboardCount: (startDate,endDate)=>
    @diligenceDonutChartConfig.data.columns = []
    @Restangular.one('Dashboard', 'count').all('status').customGET('',{start_date: startDate,end_date: endDate}).then (response) =>
      @dash_live_total = _(response.valueArray).reduce(((result, item) ->
        result + item.value
      ), 0)

      unless @dash_live_total
        @diligenceDonutChartConfig.data.empty.label.text = 'No activity'
        return

      @dash_count_status = response
      @columns_status = []

      _(@dash_count_status.valueArray).each (item) =>
        current_obj = []
        current_obj.push item.label
        current_obj.push item.value
        @columns_status.push current_obj

      # Initialising the colums data with the response from json
      @diligenceDonutChartConfig.data.columns = @columns_status

  loadStrategyData: (startDate,endDate)=>
    # Due Diligence Donut Chart
    @strategyDonutChartConfig.data.columns = []

    @Restangular.one('Dashboard', 'count').all('strategy').customGET('',{start_date: startDate,end_date: endDate}).then (response) =>
      @dash_strategy_total = _(response.valueArray).reduce(((result, item) ->
        result + item.value
      ), 0)

      unless @dash_strategy_total
        @strategyDonutChartConfig.data.empty.label.text = 'No Activity'
        return

      @dash_count_strategy = response
      @columns_strategy = []

      _(@dash_count_strategy.valueArray).each (item) =>
        current_obj = []
        current_obj.push item.label
        current_obj.push item.value
        @columns_strategy.push current_obj

      # Initialising the colums data with the response from json
      @strategyDonutChartConfig.data.columns = @columns_strategy

  loadDocs:=>
    @$http.get(@baseUrl + '/attachments?sort_by=as_of_date&sort_direction=Ascending&recordsPerPage=5').then (response) =>
      @docs = response.data.slice(0, 5)

  loadRecentFilings:=>
    @Restangular.all('formadv_firms').customGET().then (response) =>
      @filings = response
      @recent_filings = @filings.slice(0, 5)

  loadNotes: (startDate,endDate)=>
    @Restangular.one('notes/history').get(
      entity_type: 'Firm'
      entity_id: 0
      start_date: startDate
      end_date: endDate
    ).then (response) =>
      @notes = response

  loadRatingScales:=>
    @Restangular.all('rating_scales').doGET().then (response) =>
      @scales = response.scales_data
      @unrated_color_code = response.unrated_color
      userColorScheme = []
      _(@scales).each((scale)=>
        if scale.color_code
          userColorScheme.push scale.color_code
      )
      if @scales.length == 1
        @maxScore = 5
      else
        @maxScore = @scales.length

      if userColorScheme.length == @maxScore
        @colorScheme = userColorScheme

  initMonitor: (startDate,endDate)=>
    @initGridSection = false
    @dateRange = {start_date: startDate,end_date: endDate}
    @flags_scores = @FlagScoreResource.$new({start_date: startDate,end_date: endDate})
    @loadDashboardCount(startDate,endDate)
    @loadStrategyData(startDate,endDate)
    @loadNotes(startDate,endDate)
    @$timeout =>
      @initGridSection = true

  toggleDashboard: (type) =>
    @$state.go 'app.dash', {dashType: type}

  resetHeatmapDimensions: =>
    @plotWidth = @HeatmapDataService.getPlotWidth()
    @plotHeight = @HeatmapDataService.getPlotHeight()

  loadRatingSchemes: ->
    @Restangular.all('rating_types').getList().then (response) =>
      @rating_types = response
      @selected_rating_scheme_id = response[0].id
      @setEntityType(@entity_type)
      return

  redirectToProjects: (d, element, chart) ->
    @$timeout => #since this event generates from outside the angular
      tabId = d.id.toLowerCase()
      indexOfTab = @projectsTabsArray.indexOf(tabId)
      @$state.go 'app.diligence.projects.activity', type: 'in-progress'

  reloadHeatMap: (rating_scheme_id) ->
      @selected_rating_scheme_id = rating_scheme_id
      @getHeatMapData()
      return

  setEntityType: (entity_type) ->
    @entity_type = entity_type
    @loading = true
    @getHeatMapData()

  addEvent: ->
    @ModalFactory.invokeModal 'manage_event',
      resolve:
        entity_type : => 'Firm'
      success: (event) =>
        @getCalendarEvents()

# calendar configuration will go here
  # Get the calendar events data
  getCalendarEvents: () =>
    @loadingCalendar = true
    @$http.get(@baseUrl + '/dashboard/firmcalendar').then (response) =>
      @loadingCalendar = false
      _(response.data.eventArray).each ((event)=>
        event.start = @Utils.getLocalDateTime(event.start)
        event.end = @Utils.getLocalDateTime(event.end)
      )
      @calendar_events = response.data.eventArray

  performAction: (action) ->
    if action.entity_type == 'Workflow'
      @$state.go 'app.workflow_automation.detail', {Id: action.entity_id, action_id: action.action_id, workflow_steps_actions_id: action.workflow_steps_actions_id}
    else if action.entity_type == 'Response'
      @$state.go 'app.diligence.project.questionnaire', {diligenceId: action.entity_id}
    else
      @redirectToEntityPage(action.entity_type, action.entity_id)

  redirectToDetail: (note) =>
    @redirectToEntityPage(note.entity_type, note.entity_id)

  redirectToEntityPage: (entity_type, entity_id) =>
    switch entity_type
      when 'Duediligence'
        @$state.go 'app.diligence.project.notes', {diligenceId: entity_id}
      when 'Fund'
        @$state.go 'app.funds.profile.monitor', {fundId: entity_id}
      when 'Firm'
        @$state.go 'app.firms.profile.monitor', {firmId: entity_id}
      when 'User'
        @$state.go 'app.contacts', {Id: entity_id}
      when 'Workflow'
        @$state.go 'app.workflow_automation.detail.detail', {Id: entity_id}
      when 'Attachment'
        @$state.go 'app.content.document.detail', {documentId: entity_id}
      when 'FormADV'
        @$state.go 'app.form_adv.firm.filings_history', {firmCRD: entity_id}
      when 'Meeting'
        @$state.go 'app.monitor.meetings.detail',{Id: entity_id}
      when 'Vehicle'
        @$state.go 'app.vehicles.profile.monitor', {vehicleId: entity_id}

  goToTrackingPage: =>
    @$state.go 'app.form_adv.regulatory_monitor.explore'


  getMaxHeaderLength: (arr) ->
    if @heatmap_orientation == "X"
      maxlen = 0
      i = 0
      while i < arr.length
        tmplen = arr[i].length * 10
        if tmplen > maxlen
          maxlen = tmplen
        i++
      Math.floor maxlen + 30
    else
      maxlen = 0
      i = 0
      while i < arr.length
        tmplen = arr[i].length * 8
        if tmplen > maxlen
          maxlen = tmplen
        i++
      Math.floor maxlen + 30

  setDirectiveFn: (drawHeatMapSvg) ->
    @$scope.drawHeatMapSvg = drawHeatMapSvg

  # Heatmap Code
  getHeatMapData:  =>
    @loading = true
    if @entity_type
      params =
        rating_scheme_id : @selected_rating_scheme_id
        entity_type : @entity_type
    else
      params =
        rating_scheme_id : @selected_rating_scheme_id

    if @customDateFilter.selectedRange == 'No Filter'
      params.start_date = null
      params.end_date   = null
    else
      params.start_date = @Utils.formatDatetime(@customDateFilter.startDate)
      params.end_date   = @Utils.formatDatetime(@customDateFilter.endDate)

    @resetHeatmapDimensions()
    @Restangular.all('ratings/analytics').getList(params).then (response) =>
      @loading = false
      @heatmapResponse = response
      # get plotwidth from heatmap container div
      @plotWidth = document.getElementById(@chartWidthDiv).offsetWidth
      if @heatmapResponse.length > 0
        @predictedHeight = @heatmapResponse.length * @cellHeight
        if @heatmap_orientation != "X" and @heatmapResponse.length > 9
          @plotHeight = @predictedHeight

        heatMapObj =
          members: []
          textleftcol: []

        i = 0
        while i < @heatmapResponse.length
          protoObj = {}
          protoObj.name = @heatmapResponse[i].entity_name
          protoObj.total_score = @heatmapResponse[i].total_score
          protoObj.rating = @heatmapResponse[i].ratings
          protoObj.is_highlighted = false
          heatMapObj.members.push protoObj
          i++

        @heatMapApiData = heatMapObj
        @heatmap_options.managerAxis = @heatmap_orientation
        @heatmap_options.textColLength = @heatMapApiData.textleftcol.length
        @heatmap_options.plotHeight = @plotHeight
        @heatmap_options.plotWidth = @plotWidth
        @heatmap_options.max_score = @maxScore
        @heatmap_options.invertColor = @invertColor
        @heatmap_options.sortState = @SORT_STATE
        @heatmap_options.colorScheme = @colorScheme
        @heatmap_options.textDisplayState = @TEXT_DISPLAY_STATE
        @heatmap_options.heatmapChartContainer = @heatmapChartContainer
        @heatmap_options.unrated_color_code = @unrated_color_code
        @$scope.drawHeatMapSvg @heatmap_options, @heatMapApiData, @heatmapChartContainer

        # @$rootScope.$broadcast('reInitHeatMap', @heatmap_options , @heatMapApiData, @heatmapChartContainer)

  svg_to_pdf: () =>
    svgAsPngUri document.getElementById(@heatMapChartId), {canvg:window.canvg}, (svg_uri) =>
      image = document.createElement('img')
      image.src = svg_uri
      image.onload = =>
        canvas = document.createElement('canvas')
        context = canvas.getContext('2d')
        # doc = new jsPDF('landscape', 'px', 'letter')
        canvas.width = image.width
        canvas.height = image.height
        canvas.style.display = 'block'
        if canvas.width > canvas.height
          doc = new jsPDF('l', 'mm', [canvas.width, canvas.height])
        else
          doc = new jsPDF('p', 'mm', [canvas.height, canvas.width])
        context.drawImage image, 0, 0, image.width, image.height
        doc.addImage canvas, 'PNG', 10, 10, (canvas.width), (canvas.height), 'NONE' , 'FAST'
        doc.save @filename + '.pdf'

  saveAsPng: () =>
    saveSvgAsPng document.getElementById(@heatMapChartId), @filename + '.png' , {canvg:window.canvg}

  sortHeatmap: (sortBy) =>
    if @SORT_STATE isnt sortBy
      @SORT_STATE = sortBy
      @getHeatMapData()

  toggleTextDisplay: (mode) =>
    @TEXT_DISPLAY_STATE = if @TEXT_DISPLAY_STATE is true then false else true
    @getHeatMapData()

  watchForDiligence: =>
    @$scope.$watch 'vm.diligences.data.length', (value) =>
      if value > 0
        data = _(@diligences.data).filter (dd) ->
          dd.type is 'shared_profile'
        @diligences_grid.grid.options.data = data

  openMyActionsRow:(row,col)=>
    if !row.internalRow && col.field != "selectionRowHeaderCol"
      @performAction(row.entity)

  clearGrouping: (grid,column)=>
    grid.api.grouping.clearGrouping()

  getEntityTypeName: (entity_type) =>
    display_name = @Utils.getDisplayEntityType(entity_type)
    if @is_manager and display_name == @keywordConstants.Firm
        display_name = 'Investor'
    display_name

  getEntityGroupHeaderName: (grid, row, col)=>
    enity_name = ""
    #get group name from the aggregations list.
    for i in [0...row.treeNode.aggregations.length]
      agg = row.treeNode.aggregations[i]
      if agg.groupVal and agg.groupVal.length > 0
        entity_name = agg.groupVal

    #if we find the group name from the aggregations list, get its appropriate label name, otherwise show 'Ungrouped'
    if entity_name != ""
      entity_name = @getEntityTypeName(entity_name)
    else
      entity_name = "Ungrouped"
    entity_name + "(#{row.treeNode.children.length})"
