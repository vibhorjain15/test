angular.module('diligenceVault').directive 'rbBlankChart', ($compile, blankChartUtils, Utils)->
  restrict: 'E'
  template: '<div></div>'
  replace: true
  link: (scope, element) ->

    colorScheme = Utils.getFirmColorScheme() or ['#a90e63', '#ffc23f', '#f08700', '#702169','#087e8b']

    pieChartConfig =
      data: {}
      interaction:
        enabled: false
      legend:
        position: 'right'
      color: pattern: colorScheme

    chartConfig =
      data:
        names:
          value: ''
        xs:
          value: 'name'
        keys:
          value: ['value']
          x: 'name'
      interaction:
        enabled: false
      legend:
        show: false
      axis:
        x:
          type: 'category'
          label:
            position: 'outer-center'
        y:
          label:
            position: 'outer-middle'
      color: pattern: colorScheme

    displaySpinner = ->
      element.html $compile('<spinner></spinner>')(scope)

    scope.$render = ->
      options = scope.component.options
      if options.chartData
        chartData = JSON.parse options.chartData

      template = """
          <h4 class="clear-margin-top text-center text-uppercase">#{options.title}</h4>
          <c3-chart config="chartConfig"></c3-chart>
      """

      displaySpinner()

      scope.chartConfig = {}

      if chartData == undefined
        return

      if (options.chartType == 'pie' or options.chartType == 'donut')
        scope.chartConfig = pieChartConfig
        scope.chartConfig.data.columns = blankChartUtils.reformatDataForPieChart(chartData.items)
      else
        scope.chartConfig = chartConfig
        scope.chartConfig.axis.x.label.text = options.xAxisLegend
        scope.chartConfig.axis.y.label.text = options.yAxisLegend
        scope.chartConfig.data.json = chartData.items

      scope.chartConfig.data.type =  options.chartType

      element.html $compile(template)(scope)

    scope.$render()
