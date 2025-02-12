class StrategyProfileDDQController extends BaseController

  @register 'StrategyProfileDDQController'

  @inject '$stateParams', 'ModalFactory', '$scope', 'Utils', '$state',
          'DueDiligenceDataservice', 'toaster', 'SweetAlert','angularEnabled'

  initialize: ->
    @strategyId = @$stateParams.strategyId
    @is_admin = @Utils.isAdmin()
    @is_manager = @Utils.isManager()
    @isFreeSubscription = @Utils.isFreeSubscription()
    @entity_type = 'Strategy'
    @$scope.getStrategy().then (strategy) =>
      @strategy = strategy

    @getDDQs()
    @getProfileDDQs()
    @getInvestorDDQs()

  invokeAddDDQDialog: ->
    if !@isFreeSubscription
      @ModalFactory.invokeModal 'add_ddq',
        resolve:
          entity_id: => @strategy.id
          entity_type: => 'Strategy'
          entity_name: => @strategy.name
          type: => 'dd_new'

  invokeAddInvestorDDQDialog: ->
    if !@isFreeSubscription
      @ModalFactory.invokeModal 'add_ddq',
        resolve:
          entity_id: => @strategy.id
          entity_type: => 'Strategy'
          entity_name: => @strategy.name
          type: => 'dd_new'
          source: => 'investor_request'

  invokeAddProfileDDQDialog: ->
    if !@isFreeSubscription
      @ModalFactory.invokeModal 'add_ddq',
        resolve:
          entity_id: => @strategy.id
          entity_type: => 'Strategy'
          entity_name: => @strategy.name
          type: => 'dd_profile'

  getDDQs: ->
    @DueDiligenceDataservice.getDiligences(
      is_internal: true,
      entity_id: @strategyId,
      entity_type: 'Strategy'
    ).then (response) =>
      @ddqs = response

  getInvestorDDQs: ->
    @DueDiligenceDataservice.getInvestorDiligenceByFund(@strategyId).then (response) =>
      @investorDdqs = response

  getProfileDDQs: ->
    @DueDiligenceDataservice.getProfileDDQ(
      entity_type: 'Strategy',
      entity_id: @strategyId
    ).then (response) =>
      @profileddqs = response

  getViews: ->
    return unless @is_manager

    @DueDiligenceDataservice.getViews(@strategyId, 'Strategy').then (response) =>
      @views = response
