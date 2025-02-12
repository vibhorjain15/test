class FundProfileDDQController extends BaseController

  @register 'FundProfileDDQController'

  @inject '$stateParams', 'ModalFactory', '$scope', 'Utils', '$state',
          'DueDiligenceDataservice', 'toaster', 'SweetAlert','angularEnabled'

  initialize: ->
    @fundId = @$stateParams.fundId
    @is_admin = @Utils.isAdmin()
    @is_manager = @Utils.isManager()
    @isFreeSubscription = @Utils.isFreeSubscription()
    @entity_type = @Utils.getEntityType()
    @$scope.getFund().then (fund) =>
      @fund = fund

    @getDDQs()
    @getProfileDDQs()
    @getInvestorDDQs()

  invokeAddDDQDialog: ->
    if !@isFreeSubscription
      @ModalFactory.invokeModal 'add_ddq',
        resolve:
          entity_id: => @fund.id
          entity_type: => 'Fund'
          entity_name: => @fund.name
          type: => 'dd_new'

  invokeAddInvestorDDQDialog: ->
    if !@isFreeSubscription
      @ModalFactory.invokeModal 'add_ddq',
        resolve:
          entity_id: => @fund.id
          entity_type: => 'Fund'
          entity_name: => @fund.name
          type: => 'dd_new'
          source: => 'investor_request'

  invokeAddProfileDDQDialog: ->
    if !@isFreeSubscription
      @ModalFactory.invokeModal 'add_ddq',
        resolve:
          entity_id: => @fund.id
          entity_type: => 'Fund'
          entity_name: => @fund.name
          type: => 'dd_profile'

  getDDQs: ->
    @DueDiligenceDataservice.getDiligences(
      is_internal: true,
      entity_id: @fundId
    ).then (response) =>
      @ddqs = response

  getInvestorDDQs: ->
    @DueDiligenceDataservice.getInvestorDiligenceByFund(@fundId).then (response) =>
      @investorDdqs = response

  getProfileDDQs: ->
    @DueDiligenceDataservice.getProfileDDQ(
      entity_type: 'Fund',
      entity_id: @fundId
    ).then (response) =>
      @profileddqs = response

  getViews: ->
    return unless @is_manager

    @DueDiligenceDataservice.getViews(@fundId, 'Fund').then (response) =>
      @views = response
