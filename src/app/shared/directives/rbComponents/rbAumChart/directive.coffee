angular.module('diligenceVault').directive 'rbAumChart', ($compile, FundDataservice, $q, firmSettingsService, FirmDataservice, BaseDataService) ->
  restrict: 'E'
  template: '<div></div>'
  replace: true
  link: (scope, element) ->
    config =
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
    scope.aum_chart_config = config

    getRandomAUMValues = ->
      response = _([1..10]).map (num) ->
        {
          end_date: moment().subtract(num, 'month')
          value: _.random(1, 1000)
        }

      response = FundDataservice.processDatesAndValues(response)
      deferred = $q.defer()

      deferred.resolve(response)

      deferred.promise
    
    getRandomAumTable = ->
      deferred = $q.defer()

      deferred.resolve([{type:'aum'}])

      deferred.promise

    getDefaultShareClassAUMValues = (id) ->
      return getRandomAUMValues() unless id?

      BaseDataService.getShareClassTableValues(id).then FundDataservice.processDatesAndValues

    displaySpinner = ->
      element.html $compile('<spinner></spinner>')(scope)

    getShareClassTables = (entity_id, entity_type, parent_entity_id)->
      return getRandomAumTable() unless entity_id?

      if entity_type == "Fund"
        FundDataservice.getShareClassTables(parent_entity_id, entity_id)
      else
        FirmDataservice.getTables(entity_id)

    scope.$render = ->
      options = scope.component.options

      config.data.type = options.type
      config.color.pattern = [scope.component.options.color_one]
      template = """
        <h4 class="clear-margin-top">#{options.title}</h4>
        <c3-chart config="aum_chart_config"></c3-chart>
      """

      displaySpinner()
      
      getShareClassTables(options.entity_id, options.entity_type, options.parent_entity_id).then (response)->
        default_aum = _(response).findWhere(type: 'aum')
        if default_aum
          getDefaultShareClassAUMValues(default_aum.id).then (response) ->

            config.data.json = response

            element.html $compile(template)(scope)
        else
          config.data.json = []

          element.html $compile(template)(scope)


    scope.$render()
