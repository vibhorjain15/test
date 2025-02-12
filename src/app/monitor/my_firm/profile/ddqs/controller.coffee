class MyFirmProfileDDQController extends BaseController

  @register 'MyFirmProfileDDQController'

  @inject 'Utils', 'ModalFactory', '$scope', 'DueDiligenceDataservice','Restangular','RestangularHeaderService','angularEnabled', '$window'

  initialize: ->
    @firmId = @Utils.getCurrentFirm().id
    @pageUrl = "app/firms/#{@firmId}/profile/ddqs"
    @is_admin = @Utils.isAdmin()
    @is_manager = @Utils.isManager()
    @is_freeSubscriber = @Utils.isFreeSubscription()
    @entity_type = @Utils.getEntityType()
    @$scope.getFirm().then (firm) =>
      @firm = firm

    @getDDQs()
    @getProfileDDQs()
    @getInvestorDDQs()
    if !@is_manager
      @$window.history.back()
      return


  invokeAddDDQDialog: ->
    if !@is_freeSubscriber
      @ModalFactory.invokeModal 'add_ddq',
        resolve:
          entity_id: => @firm.id
          entity_type: => 'Firm'
          entity_name: => @firm.name
          type: => 'dd_new'

  invokeAddInvestorDDQDialog: ->
    if !@is_freeSubscriber
      @ModalFactory.invokeModal 'add_ddq',
        resolve:
          entity_id: => @firm.id
          entity_type: => 'Firm'
          entity_name: => @firm.name
          type: => 'dd_new'
          source: => 'investor_request'

  invokeAddProfileDDQDialog: ->
    if !@is_freeSubscriber
      @ModalFactory.invokeModal 'add_ddq',
        resolve:
          entity_id: => @firm.id
          entity_type: => 'Firm'
          entity_name: => @firm.name
          type: => 'dd_profile'

  getDDQs: ->
    @RestangularHeaderService.RestangularWithHeader(@pageUrl).all('diligences').getList(is_internal: true, entity_id: @firmId, entity_type: 'Firm').then ((response) =>
      @ddqs = response
    ),(error) =>
      @ddqs = []

  getInvestorDDQs: ->
    @DueDiligenceDataservice.getInvestorDiligenceByFirm(@firmId).then (response) =>
      @investorDdqs = response

  getProfileDDQs: ->
    @DueDiligenceDataservice.getProfileDDQ({
      entity_type: 'Firm',
      entity_id: @firmId
    },@pageUrl).then (response) =>
      @profileddqs = response

  getViews: ->
    return unless @is_manager

    @DueDiligenceDataservice.getViews(@firmId, 'Firm',@pageUrl).then (response) =>
      @views = response
