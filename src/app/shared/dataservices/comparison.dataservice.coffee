angular.module('diligenceVault').factory 'ComparisonDataService', (Utils, Restangular , $http) ->

  new class ComparisonDataService

    comparison_dates = {}
    selections = {}
    comparison_ids = []
    comparison_data = []

    setComparisonDates:(dates) ->
      comparison_dates = dates

    getComparisonDates:(dates) ->
      comparison_dates

    setComparisonIds:(ids) ->
      comparison_ids = ids

    getComparisonIds: ->
      comparison_ids

    setComparisonData: (data) ->
      comparison_data = JSON.parse(JSON.stringify(data))

    removeFromArr: (index,arr) ->
      arr.splice(index,1)
      arr

    filterRemoved: (ids, data) ->
      _(data).each (item) =>
        protoArr = []
        _(item.response).each (innerRes) =>
          if innerRes.id not in ids
            protoArr.push innerRes
        item.response = protoArr

      data

    setSelections: (data) ->
      selections = data

    getSelections: ->
      selections

    getComparisonData: ->
      comparison_data

    sortByLastUpdated: (array) ->
      _(array).each (item) ->
        item.response.sort (a, b) ->
          new Date(a.lastupdate_at) - (new Date(b.lastupdate_at))
