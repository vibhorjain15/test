class BarchartController extends BaseController
  @register 'BarchartController'

  @inject 'options', 'C3ChartFactory', 'Utils'

  initialize: ->
    labelProperty = @options.labelProperty || 'label'
    valueProperty = @options.valueProperty || ['value']
    @colorScheme = @Utils.getFirmColorScheme() or ['#a90e63', '#ffc23f', '#f08700', '#702169','#087e8b']
    barChartConfig =
      data:
        type: 'bar'
      color:
        pattern: @colorScheme

    columns = []
    labels = @options.labels || valueProperty
    data = @options.data

    if @options.displayChartLabels
      barChartConfig.data.labels = true

    if @options.stacked
      barChartConfig.data.groups = [labels]

    columns = _(valueProperty).map (colName, idx) ->
      column = [labels[idx]]

      _(data).each (record) -> column.push(record[colName])

      column

    barChartConfig.data.columns = columns

    if labelProperty?
      barChartConfig.axis =
        x:
          type: 'category'
          categories: _(data).pluck(labelProperty)

    @c3Config = barChartConfig
