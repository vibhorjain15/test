angular.module('diligenceVault').directive 'spreadsheetPreview', ->
  restrict: 'E'
  templateUrl: 'shared/directives/spreadsheetPreview/template.html'
  scope: true
  link: (scope, element, attrs) ->
    initRows = (rows) ->
      rows = _(rows).pluck(attrs.rowLabelName) if attrs.rowLabelName?

      scope.rows = rows

      makeDynamicSettings()

    initColumns = (columns) ->
      columns = _(columns).pluck(attrs.columnLabelName) if attrs.columnLabelName?
      columns.unshift('')

      scope.columns = columns

      makeDynamicSettings()

    scope.$watch attrs.rows, (value) ->
      initRows(value) if value?
    , true

    scope.$watch attrs.columns, (value) ->
      initColumns(value) if value?
    , true

    scope.$watch attrs.dynamicElement, (newValue, oldValue) ->
      if newValue != oldValue
        initRows(scope.$eval(attrs.rows))
        initColumns(scope.$eval(attrs.columns))

    makeDynamicSettings = =>
      scope.dynamicElement = scope.$eval(attrs.dynamicElement)
      if scope.rows && scope.columns && scope.dynamicElement

        if scope.dynamicElement == 'Row'
          scope.rows = ['1']

        else if scope.dynamicElement == 'Column'
          scope.columns = ['', '1']
