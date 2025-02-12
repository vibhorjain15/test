class QuestionnaireResponseAnalysisController extends BaseController
  @register 'QuestionnaireResponseAnalysisController'
  @inject '$scope', '$attrs', 'ResponseDataservice', '$timeout', 'Utils',
          'ResponseAnalysisFactory','$stateParams','$state'

  initialize: ->
    @colorScheme = @Utils.getFirmColorScheme()

    deregisterer = @$scope.$parent.$watchGroup [@$attrs.question, @$attrs.templateId], (values) =>
      if values[0] && values[1]
        @question = values[0]
        @questionId = @question.id
        @templateId = values[1]
        @customDateFilter = {
          start_date: @$state.params.start_date
          end_date: @$state.params.end_date
        }
        @tagId = @$stateParams.tagId
        @initResponseAnalysis()
        deregisterer()

    @closeSidebarOnExit()

  initResponseAnalysis: =>
    _this = @

    responseType = @question.attributes.responseType
    if responseType in ['Grid']
      @is_grid = true

    @getResponseAggregations(@templateId, @questionId, @tagId, @is_grid,@customDateFilter).then (response) =>
      @aggregations = response
      type = 'bar'

      if responseType in ['Boolean', 'BooleanPlus', 'NoPlus']
        type = 'pie'
      else if responseType in ['Grid']
        type = 'stackedbar'
      @chart_type = type

      chartConfig =
        data:
          type: type
          selection:
            enabled: true
            multiple: false
          onclick: (d, element) ->
            _this.onclick(d, element, @)
          empty:
            label:
              text: 'Chart not available'
        color: pattern: @colorScheme

      if type is 'bar'
        @setBarConfig(chartConfig, response)
      else if type is 'pie'
        chartConfig.data.columns = @getPieColumns(response)
      else if type is 'stackedbar'
        @setStackedBarConfig(chartConfig, response)
      @chartConfig = chartConfig


  closeSidebarOnExit: ->
    @$scope.$on '$destroy', =>
      @sidebar?.close()

  getSelectedAggregate: (chart, d) ->
    if @chart_type is 'bar'
      category = chart.categories()[d.index]
      aggregate = _(@aggregations).findWhere({
        response_display: category,
        count: d.value
      })
    else if @chart_type is 'pie'
      _(@aggregations).findWhere(
        response_display: d.id
        count: d.value
      )

  onclick: (d, element, chart) ->
    @$timeout => #since this event generates from outside the angular
      aggregate = @getSelectedAggregate(chart, d)

      @sidebar = @ResponseAnalysisFactory.openDiligenceSidebar(aggregate, @questionId, @templateId, @tagId, @customDateFilter)

      @sidebar.result.finally =>
        chart.unselect([d.id])
        @sidebar = null

  setBarConfig: (chartConfig, response) ->
    chartConfig.data.json = response
    chartConfig.data.keys =
      x: 'response_display'
      value: ['count']

    bar_width = 30
    data_count = response.length

    chart_height = (data_count * bar_width) + (data_count - 1) * (bar_width*0.6)
    chart_height = Math.max(chart_height, 420)

    chartConfig.size =
      height: chart_height
    chartConfig.bar =
      width: bar_width
    chartConfig.axis =
      rotated: true
      x:
        type: 'category'

  setStackedBarConfig: (chartConfig, response) ->
    chartConfig.data.groups = [ if response.yaxis then response.yaxis else [] ]
    chartConfig.data.columns = if response.valueArray then response.valueArray else []
    chartConfig.data.type = 'bar'
    chartConfig.data.labels = true    
    chartConfig.tooltip =
      grouped = true
    # later this can be assigned as average value so user can view below/above average results
    chartConfig.grid = y: lines: [ { value:  0} ]
    bar_width = 30
    data_count = if response.yaxis then response.yaxis.count else 0

    chart_height = (data_count * bar_width) + (data_count - 1) * (bar_width * 0.6)
    chart_height = Math.max(chart_height, 420)

    chartConfig.size =
      height: chart_height
    chartConfig.bar =
      width: bar_width
    chartConfig.axis =
      rotated: false
      x:
        type: 'category',
        categories : if response.yaxis then response.yaxis else [] 

  getPieColumns: (response) ->
    _(response).map (result) ->
      [result.response_display, result.count]

  getBarColumns: (response) ->
    columns = []

    columns.push(['x'])
    columns.push(['count'])

    _(response).each (result) ->
      columns[0].push(result.response_display)
      columns[1].push(result.count)

    columns
  
  getStackedBarColumns: (response) ->
    _(response).map (result) ->
        [result.xLabel, result.valueArray]

  getResponseAggregations: (template_id, question_id, tag_id, is_grid,customDateFilter) ->
    if is_grid
      @ResponseDataservice.getGridResponseAggregations({
        template_id: template_id,
        question_id: question_id,
        tag_id : tag_id
        start_date: customDateFilter.start_date
        end_date: customDateFilter.end_date
      }).then (response) =>
        @total_count = if response.project_count then response.project_count else 0
        response
    else
      @ResponseDataservice.getAggregations({
        template_id: template_id,
        question_id: question_id,
        tag_id : tag_id
        start_date: customDateFilter.start_date
        end_date: customDateFilter.end_date
      }).then (response) =>
        @total_count = response.meta.total_count

        response.results