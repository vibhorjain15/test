angular.module('diligenceVault').directive 'donutChart', ($timeout) ->
  restrict: 'A'
  scope:
    title: '@'
    config: '='
  link: ($scope, element) ->
    donut_chart = undefined
    defaults =
      bindto: element[0]
      donut: title: $scope.title

    # TODO :  change this to data unload option and load new data
    $scope.$watch 'config.data.columns', ->
      if donut_chart
        donut_chart.load
          unload: true
          columns: $scope.config.data.columns
      else
        $timeout ->
          defaults.size = width: element.parent().width()
          donut_chart = c3.generate(angular.extend({}, defaults, $scope.config))

    # I know this is ugly but once we get a generic directive for c3 chart we'll have it in one place
    $scope.$watch 'config.data.empty.label.text', ->
      $timeout ->
        defaults.size = width: element.parent().width()
        donut_chart = c3.generate(angular.extend({}, defaults, $scope.config))

