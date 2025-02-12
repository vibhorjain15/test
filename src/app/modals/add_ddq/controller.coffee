class AddDDQController extends ModalController
  @register 'AddDDQController'

  @inject 'entity_id', 'entity_type', 'type', '$state', 'TemplatesDataService', 'DueDiligence', 'toaster','$filter', 'Restangular',
          'DueDiligenceDataservice', 'FundDataservice', 'Utils', 'entity_name','template_id', 'FirmDataservice', 'RestangularHeaderService','keywordConstants','request','source', 'hierarchyConstants'

  initialize: ->
    @global_hierarchy_option = @hierarchyConstants.Strategy

    @current_firm = @Utils.getCurrentFirm()
    @minDate = new Date()
    @maxDate = new Date()
    @maxAsOfDate = @Utils.getMaxAsOfDateDiligence()
    @as_of_date = new Date()
    @suggested_due_date_diff = 45
    @due_at = moment().add(@suggested_due_date_diff, 'days').toDate()
    @is_manager = @Utils.isManager()
    @is_investor = @Utils.isInvestor()

    if @entity_type
      @setEntityType(@entity_type)
    else
      @setEntityType("Fund")

    if @type
      @diligence_type = @type
    else
      @diligence_type = 'dd_new'

    if @source and (@source == 'investor_request' or @source == 'template')
      @showInvestorSelection = true
    else
      @showInvestorSelection = false

    if @request
      @investor_id = @request.investor_id if @request.investor_id
      @entity_id = @request.entity_id if @request.entity_id
      @entity_type = @request.entity_type if @request.entity_type
      @template_id = @request.template_id if @request.template_id
      @name = @request.name if @request.name
      @due_at = @request.due_at if @request.due_at
      @internalOnly = true if not @request.investor_id
      @setDDType(@request.type)

    @getTemplates()
    @getFirms()
    @modalTitle = @getModalTitle()

  getModalTitle: =>
    if @is_manager
      if @diligence_type == 'dd_profile'
        'New Q/A Library Content'
      else if @showInvestorSelection
        'New Investor Request'
      else
        'New Standard DDQ'
    else if @is_investor
      if @diligence_type == 'dd_profile'
        'New Internal Profile'
      else
        'New Internal DDQ'

  setDDType: (type) ->
    if type == 'Shareable_request'
        @diligence_type = 'dd_new'
    else if type == 'preapproved_request'
        @diligence_type = 'dd_profile'

  getFunds: ->
    @FundDataservice.getFunds().then (response) =>
      @funds = response

  getAllStrategies: () ->
    params =
      include_contacts: false,
      include_custom_fields: false,
      include_dates: true,
      is_active: true,
      filters: {}
      search_for: @global_hierarchy_option
    @Restangular.all('service/dvapi_service/product_search').post(params).then (response) =>
        @strategies = angular.copy response.data

  getFirms: ->
    @FirmDataservice.getFirms().then (response) =>
      @firms = response.results

  getTemplates: ->
    @TemplatesDataService.getTemplates(detail: false, is_new_information_request: true).then (response) =>
      @templates = response
      @filterTemplates()

  filterTemplates: =>
    if @diligence_type == "dd_profile"
      @templates = _(@templates).filter((template)=>
        template.type == "dd_profile"
      )
    else
      @templates = _(@templates).filter((template)=>
        template.type != "dd_profile"
      )

  validateDueDate: =>
    @add_ddq_form['due-date'].$setValidity('validDueDate',moment(@due_at).isSameOrAfter(@as_of_date, 'day'))

  setEntityType: (entity_type) =>
    @entity_type = entity_type
    if entity_type.toUpperCase() == "FUND"
      @getFunds()
      return
    if entity_type.toUpperCase() == "FIRM"
      @getFirms()
      return
    if entity_type.toUpperCase() == "STRATEGY"
      @getAllStrategies()
      return

  generatePageUrl: (entity_type)=>
    pageUrl = ""
    if entity_type.toLowerCase() == @keywordConstants.Firm.toLowerCase()
      pageUrl = "app/firms/#{@entity_id}/new_ddq"
    else if entity_type.toLowerCase() == @keywordConstants.Product.toLowerCase()
      fundIndex = _(@funds).findIndex (fund)=>
        fund.id == @entity_id
      firmId = @funds[fundIndex].parentFirm.id
      pageUrl = "app/firms/#{firmId}/funds/#{@entity_id}/new_ddq"
    pageUrl

  submit: =>
    if @add_ddq_form.$valid
      @loading = true

      entity_type = @entity_type

      if @is_firm_dd
        entity_type = 'Firm'
        @entity_id = @current_firm.id

      params =
        'diligence_type': @diligence_type
        'entities': [{'id':@entity_id,'entity_type': entity_type,'template_id': @template_id}]
        'name': @name
        'due_at' : @$filter('date')(@due_at, 'MM-dd-yyyy')
        'as_of_date' : @$filter('date')(@as_of_date, 'MM-dd-yyyy')
        'is_internal': true

      if !@internalOnly and @investor_id
        params.investor_id = @investor_id

      pageUrl = @generatePageUrl(entity_type)

      @RestangularHeaderService.RestangularWithHeader(pageUrl).all('v2/diligences').post(params).then((response) =>
        @updateRequestandRedirect(response)
      ).finally =>
          @loading = false

  updateRequestandRedirect: (response)=>
    if @request and @request.id
      @request.duediligence_id = response.id
      @DueDiligenceDataservice.saveRequest(@request).then (res) =>
        @successHandler(response)
    else
      @successHandler(response)

  successHandler: (response)=>
    @toaster.pop 'success', 'Your project is successfully created'
    @$uibModalInstance.dismiss response
    @$state.go 'app.diligence.project.questionnaire', {diligenceId: response.id}
