class DiligenceInviteManagerController extends BaseController

  @register 'DiligenceInviteManagerController'

  @inject '$http', 'baseUrl', 'DueDiligenceDataservice', '$q', 'ModalFactory', '$scope', 'toaster', '$state',
          'SweetAlert', 'DueDiligence', 'Utils', 'Restangular', '$stateParams', 'BaseDataService'

  initialize: ->
    promises = []

    @selected_investors = []
    @request = {}
    @is_data_loaded = false
    @is_admin = @Utils.isAdmin()
    @is_freeSubscription = @Utils.isFreeSubscription()
    @entity_type = @Utils.getEntityType()

    promises.push @Restangular.all('funds', null).getList().then (response) =>
      @funds = response

    promises.push @Restangular.all('strategies').getList().then (response) =>
      @strategies = response

    @$q.all(promises).then(=> @is_data_loaded = true)

  createUser: (deferred) ->
    data = _(_(@investor).omit('type')).extend(ToFirmTypeID: @investor.type.id)

    @$http.post(@baseUrl + '/Users', data).then ((response) =>
      @request.ToUserID = response.data.userID
      deferred.resolve true
    ), ->
      deferred.resolve false

  canProceedToFundStep: =>
    can_proceed = @selected_investors.length > 0 || @request.all_investor_flag

    unless can_proceed
      @display_investor_selection_error = true
      deregisterer = @$scope.$watch 'vm.selected_investors.length', (value) =>
        if value > 0
          @display_investor_selection_error = false
          deregisterer()
          deregistererTwo()

      deregistererTwo = @$scope.$watch 'vm.request.all_investor_flag', (value) =>
        if value == true
          @display_investor_selection_error = false
          deregisterer()
          deregistererTwo()

    can_proceed

  canProceedToReviewStep: =>
    can_proceed = @selected_entities.length > 0 || @request.all_entity_flag

    unless can_proceed
      @display_entity_selection_error = true
      deregisterer = @$scope.$watch 'vm.selected_entities.length', (value) =>
        if value > 0
          @display_entity_selection_error = false
          deregisterer()
          deregistererTwo()

      deregistererTwo = @$scope.$watch 'vm.request.all_entity_flag', (value) =>
        if value == true
          @display_entity_selection_error = false
          deregisterer()
          deregistererTwo()

    can_proceed

  sendDueDiligenceRequest: ->
    return unless @project_name_form.$valid

    if !@accept_confidential_agreement
      @SweetAlert.error 'Confidentiality Agreement', 'Please agree with the binding conditions by clicking the checkbox before you can send this request'
      return

    data =
      'diligence_type': 'dd_new'
      'all_investor_flag': @request.all_investor_flag
      'all_entity_flag': @request.all_entity_flag
      'entity_type': 'Fund'
      'name': @project_name

    unless data.all_investor_flag
      data.investor_ids = _(@selected_investors).pluck('id')
      if data.investor_ids.length
        selected_id = data.investor_ids[0]
        selected_entity_type = 'Firm'

    unless data.all_entity_flag
      data.entity_ids = _(@selected_entities).pluck('id')
      if data.entity_ids.length
        selected_id = data.entity_ids[0]
        selected_entity_type = 'Fund'

    @Restangular.all('diligences').post(data)
    .then =>
      @toaster.pop 'success', 'Your request is a success', '', 3000
      if @request.internalOnly
        @$state.go 'app.diligence.projects.activity', type: 'in-progress'
      else
        @$state.go 'app.diligence.projects.activity', type: 'sent'
    , (error) =>
      avoid_error_logging_statuses = @BaseDataService.getAvoidErrorLoggingStatusList()
      if !(error.status in avoid_error_logging_statuses)
        @Utils.logError('Investor outreach (invite) request failed', error)
