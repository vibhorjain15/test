class DonutChartController extends BaseController
  @register 'DonutChartController'

  @inject 'options', 'C3ChartFactory', 'Utils'

  initialize: ->
    labelProperty = @options.labelProperty || 'label'
    valueProperty = @options.valueProperty || 'value'
    @colorScheme = @Utils.getFirmColorScheme() or ['#a90e63', '#ffc23f', '#f08700', '#702169','#087e8b']
    donutChartConfig =
      data:
        type: 'donut'
      color:
        pattern: @colorScheme

    columns = _(@options.data).map (record) ->
      [record[labelProperty], record[valueProperty]]

    donutChartConfig.data.columns = columns

    @c3Config = donutChartConfig
