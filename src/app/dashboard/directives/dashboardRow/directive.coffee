angular.module('diligenceVault').directive 'dashboardRow', ->
  restrict: 'E'
  templateUrl: 'dashboard/directives/dashboardRow/template.html'
  scope: true
  replace: true
  link: (scope, element, attrs) ->
    config = scope.$eval(attrs.config)

    _(config.attrs).each (value, key) ->
      element.attr(key, value)

    colSpanCount = _(config.columns).reduce (sum, column) ->
      sum + (column.colSpan || 1)
    , 0

    _(config.columns).each((column) ->
      column.attrs ||= {}

      return if column.attrs.width?

      column.attrs.width = ((column.colSpan || 1) * 100)/colSpanCount + '%'
    )

    scope.config = config
