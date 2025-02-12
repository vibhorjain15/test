angular.module('diligenceVault').directive 'c3Chart', (C3ChartFactory, $timeout, $rootScope) ->
  restrict: 'EA'
  template: "<div><spinner broad-spinner spinner-height='40'></spinner></div>"
  replace: true
  link: (scope, element, attrs) ->
    config = null
    chart = null

    init = ->
      defaults = C3ChartFactory.getDefaultConfig()

      element.empty()

      config.bindto = element[0]

      $timeout ->
        chartConfig = $.extend(true, {}, defaults, config)

        chart = c3.generate chartConfig

        scope.$watch "#{attrs.config}.data.columns", rerenderColumns

    rerenderColumns = (newColumns, oldColumns) ->
      removed_columns = getColumnDifference(oldColumns, newColumns)
      added_columns = getColumnDifference(newColumns, oldColumns)
      options = {}

      if added_columns.length
        options.columns = added_columns

      if removed_columns.length
        options.unload = _(removed_columns).map((column) -> column[0])

      chart.load(options)

    areSameColumns = (colA, colB) ->
      return false unless colA? and colB?

      return false unless colA.length is colB.length

      _.all colA, (value, idx) -> value is colB[idx]

    getColumnDifference = (columns1, columns2) ->
      column_proxy = []

      _(columns2).each (column, idx) ->
        similar_column = _(columns1).find (col) -> areSameColumns(column, col)

        if similar_column?
          column_proxy.push(similar_column)
        else
          column_proxy.push(column)

      _.difference(columns1, column_proxy)

    deregisterer = scope.$watch attrs.config, (value) ->
      if value?
        config = value
        init()
        deregisterer()

    scope.$on 'fullscreen:on', ->
      chart.resize
        width: window.innerWidth
        height: window.innerHeight - 100

    scope.$on 'fullscreen:off', init
