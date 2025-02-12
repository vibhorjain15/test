angular.module('diligenceVault').directive 'dashboardColumn', ->
  restrict: 'E'
  templateUrl: 'dashboard/directives/dashboardColumn/template.html'
  scope: true
  replace: true
  link: (scope, element, attrs) ->
    config = scope.$eval(attrs.config)

    _(config.attrs).each (val, key) ->
      element.css(key, val)

    scope.widgets = config.widgets
