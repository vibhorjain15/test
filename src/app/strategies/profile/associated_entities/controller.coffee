class StrategyAssociatedEntitiesController extends BaseController
  @register 'StrategyAssociatedEntitiesController'

  @inject '$stateParams', '$scope', 'Utils', 'StrategyDataservice', 'ModalFactory', 'statusLabel','angularEnabled'


  initialize: ->
    @strategyId = @$stateParams.strategyId
    @firmId = @$stateParams.firmId
    @is_manager = @Utils.isManager()

    @$scope.getStrategy().then (strategy) =>
      @strategy = strategy
      @associated_products = strategy.associated_products

    # @getAssociatedEntities()

  addNewProductModal: =>
    @ModalFactory.invokeModal 'manage_fund',
      resolve:
        entity_id : => @firmId
        parent_strategy: =>@strategy.id
      success: (fund) =>
        if fund
          @associated_products.push fund

  # getAssociatedEntities: ->
  #   @StrategyDataservice.getAssociatedEntities(@strategyId,@firmId).then (response) =>
  #     @associated_entities = response.result
