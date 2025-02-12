angular.module('diligenceVault').factory 'ResponseDataservice', (Restangular)->
  new class ResponseDataservice
    getAggregations: (params) ->
      promise = Restangular.all('response_aggregations').getList(params)

      promise.then (aggregations) ->
        response =
          meta: 
            total_count: 0
          results: aggregations

        _(aggregations).each (aggregation) ->
          response.meta.total_count += (aggregation.count || 0)
        response

    getGridResponseAggregations: (params) ->
      Restangular.all('response_aggregations').customGET('', params).then (response) ->

        response
