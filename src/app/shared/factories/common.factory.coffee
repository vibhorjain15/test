angular.module('diligenceVault').factory 'CommonService', () ->
    new class CommonService

        displayOwnerHeaderName: (grid, row, col) ->
            #for i in [0...row.treeNode.aggregations.length]
            agg = row.treeNode.aggregations[row.treeNode.aggregations.length - 1]
            if agg.groupVal and agg.groupVal.length > 0
                return agg.rendered
            else
                return "Ungrouped ("+agg.value+")"