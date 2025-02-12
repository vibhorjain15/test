angular.module('diligenceVault').directive 'pieChart', ($timeout, Utils) ->
  restrict: 'A'
  scope:
    title: '@'
    config: '='
  link: ($scope, element) ->
    defaultColorScheme = Utils.getFirmColorScheme()
    defaults =
      bindto: element[0]
      data:
        type: 'pie'
        columns: [
          ['100 Answered', 100]
          ['75 Unanswered', 75]
          ['10 N/A', 10]
          ['20 Todos', 20]
        ]
      pie:
        expand: false
        label: show: false
      color: pattern: defaultColorScheme
      legend: position: 'right'

    $timeout ->
      defaults.size = height: 100
      c3.generate defaults
