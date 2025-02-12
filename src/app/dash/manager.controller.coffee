class DashManagerController extends BaseController

  @register 'DashManagerController'

  @inject '$scope', '$http', 'baseUrl', 'Restangular', 'Utils','DashboardActionsResource', '$state','WorkflowStatusResource', '$timeout','keywordConstants','angularEnabled'

  initialize: ->
    _this = @ #We only have to define this once
    @colorScheme = @Utils.getFirmColorScheme()
    @enabled = false
    @switch_on = 'Live'
    @switch_off = 'Completed'
    @is_manager = @Utils.isManager()
    @projectsTabsArray = ['in-progress' , 'sent', 'invited', 'closed', 'my-projects', 'all']

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
      color: pattern: @colorScheme

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
      color: pattern: @colorScheme

    @Restangular.all('firm_preferences').customGET().then (response) =>
      @customDateFilter = @Utils.getPredefinedDateRanges(response.default_daterange_months)
      @customDateFilter.selectedRange = @Utils.getDateRanges()[response.default_daterange_months].label
      if response.default_daterange_months
        @loadDashboard(@Utils.formatDatetime(@customDateFilter.startDate),@Utils.formatDatetime(@customDateFilter.endDate))
      else
        @loadDashboard(null,null)

      # Fixture Data for the Documents
    @$http.get(@baseUrl + '/attachments?sort_by=as_of_date&sort_direction=Ascending&recordsPerPage=5').then (response) =>
      @docs = response.data.slice(0, 5)

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
        data.name

      # Get the calendar events data
    @$http.get(@baseUrl + '/dashboard/firmcalendar').then (response) =>
      @calendar_data = response.data
      @calendar_events = response.data.eventArray

    # May we have your attention please
    do ->
      width = 960
      height = 150
      svg = d3.select('#circular-attentions').append('svg').attr('width', width).attr('height', height)
      data = 'nodes': [
        {
          'x': 80
          'r': 60
          'label': '17 Live'
          'color': '#e3f4f1'
        }
        {
          'x': 220
          'r': 55
          'label': '10 Due Dates'
          'color': '#F7D5B6'
        }
        {
          'x': 350
          'r': 40
          'label': '4 New Requests'
          'color': '#9CD2D7'
        }
        {
          'x': 440
          'r': 25
          'label': '3 Watchlisted'
          'color': '#D5DDDD'
        }
      ]

      ### Define the data for the circles ###
      elem = svg.selectAll('g myCircleText').data(data.nodes)

      ###Create and place the "blocks" containing the circle and the text ###
      elemEnter = elem.enter().append('g').attr('transform', (d) ->
        'translate(' + d.x + ',80)'
      )

      ###Create the circle for each block ###
      elemEnter
        .append('circle')
        .attr('r', (d) -> d.r)
        .attr('fill', (d) -> d.color)

      ### Create the text for each block ###
      elemEnter
        .append('text')
        .attr('dx', -> -15)
        .attr('dy', -> 8)
        .attr('class', 'circle-text')
        .text((d) -> d.label)

  applyMethod: (startDate,endDate)=>
    @loadDashboard(startDate,endDate)

  getExpiryClass: (expiryDate)=>
     classObject = @Utils.getExpiryClass(expiryDate)
     classObject

  loadDashboardCount: (startDate,endDate)=>
    @diligenceDonutChartConfig.data.columns = []
    @dateRange = {start_date: startDate,end_date: endDate}
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

  loadDashboardStrategy: (startDate,endDate)=>
    # Get the dashboard strategy stats
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

      # Initialising the columns data with the response from json
      @strategyDonutChartConfig.data.columns = @columns_strategy

  loadTeamActivity: (startDate,endDate)=>
    @loading_punchcard = true
    @Restangular.all('team_activities').customGET('',{start_date: startDate,end_date: endDate}).then (response) =>
      punchcard_data = []

      _(response.teamMember).each((name, index) ->
        punchcard_row = [ { name: name } ]

        _(response.grouped_audits).each (audit_info) ->
          date = moment(audit_info.auditDate, 'MM-DD-YYYY')

          punchcard_row.push
            audit_date: date.format('DD MMM')
            count: audit_info.counts[index]

        punchcard_data.push punchcard_row
      )

      @punchcard_data = punchcard_data
      @loading_punchcard = false

  loadDashboard: (startDate,endDate) =>
    @initGridSection = false
    @my_actions = @DashboardActionsResource.$new({start_date: startDate,end_date:endDate})
    @workflow_statuses = @WorkflowStatusResource.$new({start_date: startDate,end_date: endDate})
    @loadTeamActivity(startDate,endDate)
    @loadDashboardStrategy(startDate,endDate)
    @loadDashboardCount(startDate,endDate)
    @$timeout =>
      @initGridSection = true

  performAction: (action) ->
    if action.entity_type == 'Workflow'
      @$state.go 'app.workflow_automation.detail', {Id: action.entity_id, action_id: action.action_id, workflow_steps_actions_id: action.workflow_steps_actions_id}
    else if action.entity_type == 'Response'
      @$state.go 'app.diligence.project.questionnaire', {diligenceId: action.entity_id}
    else
      @redirectToEntityPage(action.entity_type, action.entity_id)


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
        @$state.go 'app.workflow_automation.detail', {Id: entity_id}
      when 'Attachment'
        @$state.go 'app.content.document.detail', {documentId: entity_id}
      when 'FormADV'
        @$state.go 'app.form_adv.firm.filings_history', {firmCRD: entity_id}
      when 'Vehicle'
        @$state.go 'app.vehicles.profile.monitor', {vehicleId: entity_id}

  redirectToProjects: (d, element, chart) ->
    @$timeout =>
      tabId = d.id.toLowerCase()
      indexOfTab = @projectsTabsArray.indexOf(tabId)
      @$state.go 'app.diligence.projects.activity', type: 'in-progress'

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
