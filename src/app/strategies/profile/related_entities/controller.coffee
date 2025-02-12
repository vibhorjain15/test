class StrategyProfileEntitiesController extends BaseController
  @register 'StrategyProfileEntitiesController'

  @inject '$stateParams', '$scope', 'Utils', 'StrategyDataservice', 'statusLabel','angularEnabled'

  initialize: ->
    @strategyId = @$stateParams.strategyId
    @is_manager = @Utils.isManager()

    @$scope.getStrategy().then (strategy) =>
      @strategy = strategy

    @getRelatedStrategies()


  getRelatedStrategies: ->

    @StrategyDataservice.getRelatedEntities(@strategyId).then (response) =>
      @related_entities = response
