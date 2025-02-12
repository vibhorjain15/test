###*
 * @ngdoc directive
 * @name barChart
 * @restrict A
 *
 * @param {expression} config Angular expression which returns bar chart config
 *
 * @description
 * Renders [c3js](http://c3js.org/) based bar chart based on provided config
 * Use {@link c3Chart `c3Chart`} instead
 * @deprecated
 ###

angular.module('diligenceVault').directive 'barChart', ($timeout) ->
  restrict: 'A'
  scope:
    title: '@'
    config: '='
  link: ($scope, element) ->
    bar_chart = undefined
    defaults =
      bindto: element[0]
      donut: title: $scope.title

    # watch for changes and re render the chart
    # TODO : change this to data load and unload methods if there is performance problem
    $scope.$watch 'config.data.json', ->
      # Rerender the chart after the configs have changed
      $timeout ->
        config = _.omit($scope.config, 'groups', 'columns')
        defaults.size = width: element.parent().width()
        bar_chart = c3.generate(angular.extend({}, defaults, config))

        if config.groups
          $timeout (->
            # I don't know why we need a timeout here, need to be fixed
            bar_chart.groups config.groups
          ), 1000

        if config.columns
          $timeout (->
            # I don't know why we need a timeout here, need to be fixed
            bar_chart.load
              unload: true
              columns: config.columns
          ), 1000

    $scope.$watch 'config.data.groups', ->
      # Rerender the chart after the configs have changed
      $timeout ->
        config = _.omit($scope.config, 'groups', 'columns')
        defaults.size = width: element.parent().width()
        bar_chart = c3.generate(angular.extend({}, defaults, config))

        if config.groups
          bar_chart.data.groups config.groups

        if config.columns
          bar_chart.load
            unload: true
            columns: config.columns

    $scope.$watch 'config.data.empty.label.text', ->
      $timeout ->
        defaults.size = width: element.parent().width()
        bar_chart = c3.generate(angular.extend({}, defaults, $scope.config))
