###
  Usage
  <div line-chart="vm.columns"></div>
###
angular.module('diligenceVault').directive 'lineChart', ($timeout) ->
  restrict: 'A'
  link: (scope, element, attrs) ->
    config =
      bindto: element[0]
      data: {}

    initChart = (columns) ->
      config.data.columns = columns

      $timeout ->
        config.size = width: element.parent().width()
        c3.generate config

    scope.$watch attrs.lineChart, (columns) ->
      initChart(columns) if columns
