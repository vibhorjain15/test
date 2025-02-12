angular.module('diligenceVault').factory 'blankChartUtils', () ->

  new class blankChartUtils

    reformatDataForPieChart: (data) ->
      outputData = []

      _(data).each (row) ->
        outputData.push [ row.name, row.value ]

      return outputData