angular.module('diligenceVault').directive 'rbValuationChart', ($compile, FundDataservice, firmSettingsService, $q, Utils) ->
  restrict: 'E'
  template: '<div></div>'
  replace: true
  link: (scope, element) ->
    colorScheme = Utils.getFirmColorScheme() or ['#a90e63', '#ffc23f', '#f08700', '#702169','#087e8b']

    _firmSettingsService = firmSettingsService.$new({colorScheme: colorScheme})

    scope.colorMap = _firmSettingsService.getColorsMap()

    config =
      data:
        type: 'donut'
        ###colors: {
          'Level I': scope.component.options.color_one
          'Level II': scope.component.options.color_two
          'Level III': scope.component.options.color_three
        }###
      interaction: {
        enabled: false
      }
      donut: {
        expand: false
      }
      legend: {
        position: 'right'
      }
      color: pattern: colorScheme
    scope.valuation_chart_config = config

    getRandomChartValues = ->
      response = [
        ['Asset I', 8],
        ['Asset II', 5],
        ['Asset III', 2]
      ]

      deferred = $q.defer()
      deferred.resolve(response)
      deferred.promise

    getChartData = (fund_id) ->
      return getRandomChartValues()
      ###return getRandomChartValues() unless fund_id?

      FundDataservice.getValuationChartValues(fund_id)###

    displaySpinner = ->
      element.html $compile('<spinner></spinner>')(scope)

    scope.$render = ->
      options = scope.component.options

      ###config.data.colors = {
        'Level I': scope.component.options.color_one
        'Level II': scope.component.options.color_two
        'Level III': scope.component.options.color_three
      }###

      template = """
        <h4 class="clear-margin-top">#{options.title}</h4>
        <c3-chart config="valuation_chart_config"></c3-chart>
      """

      displaySpinner()

      getChartData(options.entity_id).then (response) ->
        scope.valuation_chart_config.data.columns = response

        element.html $compile(template)(scope)

    scope.$render()
