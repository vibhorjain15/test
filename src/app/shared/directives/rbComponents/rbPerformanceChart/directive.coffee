angular.module('diligenceVault').directive 'rbPerformanceChart', ($compile, FundDataservice, firmSettingsService, FirmDataservice, $q, BaseDataService) ->
  restrict: 'E'
  template: '<div></div>'
  replace: true
  link: (scope, element) ->

    config =
      {
        data:
          x_format: '%M-%Y'
          names:
            value: ''
          xs:
            value: 'end_date'
          keys:
            value: ['value']
            x: 'end_date'
        color:
          pattern: [scope.component.options.color_one]
        legend:
          show: false
        grid:
          y:
            lines: [
              {value: 0, text: '', class: 'dashed-line'}
            ]
        axis:
          x:
            type: 'timeseries'
            tick:
              rotate: 60
              format: (x) ->
                moment(x).format("MMM-YYYY")
          y:
            tick:
              format: (y) ->
                y = Number(y.toFixed(2))
                "#{y}%"
      }

    getRandomPerformanceChartValues = ->
      response = _([1..10]).map (num) ->
        {
          end_date: moment().subtract(num, 'month')
          value: _.random(-10, 10)
        }

      response = FundDataservice.processDatesAndValues(response)
      deferred = $q.defer()

      deferred.resolve(response)

      deferred.promise

    getRandomTrackRecordTable = ->
      deferred = $q.defer()

      deferred.resolve([{type:'track_record'}])

      deferred.promise

    getDefaultShareClassPerformanceChartValues = (id) ->
      return getRandomPerformanceChartValues() unless id?

      BaseDataService.getShareClassTableValues(id).then FundDataservice.processDatesAndValues

    getShareClassTables = (entity_id, entity_type, parent_entity_id)->
      return getRandomTrackRecordTable() unless entity_id?

      if entity_type == "Fund"
        FundDataservice.getShareClassTables(parent_entity_id, entity_id)
      else
        FirmDataservice.getTables(entity_id)

    displaySpinner = ->
      element.html $compile('<spinner></spinner>')(scope)

    scope.$render = =>
      options = scope.component.options
      template = """
        <h4 class="clear-margin-top">#{options.title}</h4>
        <c3-chart config="performance_chart_config"></c3-chart>
      """

      displaySpinner()

      getShareClassTables(options.entity_id, options.entity_type, options.parent_entity_id).then (response)->
        default_trackrecord = _(response).findWhere(type: 'track_record')
        if default_trackrecord
          getDefaultShareClassPerformanceChartValues(default_trackrecord.id).then (response) ->

            response = _(response).sortBy (fund_return) ->
              (new Date(fund_return.end_date))

            _(response).each (fund_return, idx) ->
              return if idx is 0
              previous_return_value = response[idx - 1].value/100
              value = fund_return.value/100
              fund_return.value = ((1 + previous_return_value) * (1 + value) - 1)*100
              fund_return.value = Number(fund_return.value.toFixed(2))

            options = scope.component.options
            config.data.type = options.type
            config.data.json = response
            config.color.pattern = [scope.component.options.color_one]

            scope.performance_chart_config = config

            element.html $compile(template)(scope)
        else
          options = scope.component.options
          config.data.type = options.type
          config.data.json = []
          config.color.pattern = [scope.component.options.color_one]

          scope.performance_chart_config = config

          element.html $compile(template)(scope)



    scope.$render()
