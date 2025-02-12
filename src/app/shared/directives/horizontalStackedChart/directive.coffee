angular.module('diligenceVault').directive 'horizontalStackedChart', ->
  restrict: 'A'
  templateUrl: 'shared/directives/horizontalStackedChart/template.html'
  scope:
    onSelect: '&'
    horizontalStackedChart: '='
    selectedRowId: '='
  link: ($scope, element, attrs) ->
    key = attrs.key or 'value'
    data = []

    $scope.$watch 'horizontalStackedChart', (value) ->
      if value
        selectedRowId = $scope.selectedRowId
        config = $scope.horizontalStackedChart
        total = _(config.data).reduce(((res, item) ->
          res + item[key]
        ), 0)

        _(config.data).each (item) ->
          return unless item[key]

          serialized = _(item).pick('label', key, 'completionText', 'id')
          serialized.percent = item[key] * 100 / total
          serialized.progressBarStyle =
            'background-color': item.color
            'width': "#{serialized.percent}%"
          serialized.legendStyle = _(serialized.progressBarStyle).pick('background-color')
          serialized.displayCompletionText = serialized.percent is 100

          if serialized.percent isnt parseInt(serialized.percent, 10)
            serialized.percent = serialized.percent.toFixed(2)

          data.push serialized

        $scope.selectedRow = _(data).findWhere(id: selectedRowId)
        $scope.data = data

    $scope.selectRow = (row) ->
      if $scope.selectedRow is row
        $scope.selectedRow = null
      else
        $scope.selectedRow = row

      $scope.onSelect
        id: ($scope.selectedRow or {}).id
        percent: ($scope.selectedRow or {}).percent
