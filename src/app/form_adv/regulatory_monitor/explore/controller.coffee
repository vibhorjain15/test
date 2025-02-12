class FormADVExploreTrackController extends BaseController
  @register 'FormADVExploreTrackController'

  @inject 'FirmCRDMappingResource', 'toaster', 'Restangular', 'SweetAlert', '$timeout', 'ModalFactory', 'Utils', 'BaseDataService','$state'

  initialize: ->
    @username = @Utils.getCurrentUser().userName
    @resource = @FirmCRDMappingResource.$new()
    @showingFilingsResults = true
    @filterSummary = {}
    @showingSearchResults = false
    @toggleSearchPanel()
    @getCriteriaList()
    @global_ternary_operator = 'or';
    @activeTeamMember_name = null
    @activeTeamMember_id = 0

    @BaseDataService.getTeamMembers().then (response) =>
      @teamMembers = response

    @search_criterias = [{}]

  getCriteriaList: () =>
    @Restangular.all('formadv_filings/criteria').getList().then (response) =>
      @criteria_options = response

  toggleSearchPanel: =>
    $panel = $('.js-search-panel')
    @is_collapsed = not @is_collapsed
    $panel.find('.panel-body').slideToggle()
    return true

  resetFilingsFiltersData: () =>
    @search_criterias = [{}]
    @search_filings_form.$setPristine()

  clearFilters: () =>
    @resetFilingsFiltersData()
    @showingFilingsResults = false
    @showingSearchResults = false
    @questions = @FirmCRDMappingResource.$new() # what is this line? why questions?
    @$timeout (=>
      @showingFilingsResults = true
    ), 1000

  selectCriteria: (criteria, index) =>
    @search_criterias[index].value = ''
    
 
  addNewCriteria: =>
    @search_criterias.push({})
    @search_filings_form.$setPristine()

  removeCriteria: () =>
    @search_criterias.splice(@search_criterias.length-1, 1)
    @search_filings_form.$setPristine()

  compileFilterSummary: () =>
    @filterSummary =
      global_operator: @global_ternary_operator,
      criterias: []

    _(@search_criterias).each((criteria) =>
      criteria_obj = {}
      criteria_obj.label = criteria.criteria_obj.label
      criteria_obj.value = []
      if criteria.criteria_obj.value == 'not_updated_since'
        criteria_obj.value.push(moment(criteria.value).format("DD-MMMM-YYYY"))
      else
        criteria_obj.value.push(criteria.value)
      @filterSummary.criterias.push(criteria_obj)
    )

  searchFilings: =>
    return unless @search_filings_form.$valid
    @showingFilingsResults = false

    params=
      global_operator: @global_ternary_operator,
      criterias: []

    _(@search_criterias).each((criteria) ->
      criteria_obj = {}
      criteria_obj.criteria_label = criteria.criteria_obj.value
      if criteria.criteria_obj.value == 'not_updated_since'
        criteria_obj.value = moment(criteria.value).format("DD-MMMM-YYYY")
      else
        criteria_obj.value = criteria.value
      params.criterias.push(criteria_obj)
    )

    @compileFilterSummary()
    @showingSearchResults = true

    @toggleSearchPanel()

    delete @resource
    @resource = @FirmCRDMappingResource.$new(params)

    @$timeout (=>
      @showingFilingsResults = true
    ), 1000

  filterByTeamMember: (user) =>  
    @activeTeamMember_name = user.fullName
    @activeTeamMember_id = user.id
    @loading_grid = true
    @$timeout =>
      @resource = @FirmCRDMappingResource.$new(user_id: @activeTeamMember_id)
      @loading_grid = false
    , 500

  clearTeamMember: =>
    @activeTeamMember_name = null
    @activeTeamMember_id = 0
    @loading_grid = true
    @$timeout =>
      @resource = @FirmCRDMappingResource.$new()
      @loading_grid = false
    , 500

  openBulkModal: =>
     @ModalFactory.invokeModal 'upload_crd',
      resolve:
        selectedUser: => @activeTeamMember_id
      success: () =>
        @loading_grid = true
        @$timeout =>
          if @activeTeamMember_id
            @resource = @FirmCRDMappingResource.$new(user_id: @activeTeamMember_id)
          else
            @resource = @FirmCRDMappingResource.$new()
          @loading_grid = false
        , 500
    
  downloadSearchResultsToExcel: () =>
    firm_arr = []
    _(@resource.data).each((firm) =>
      firm_arr.push(firm.firmCRD)
    )
    @toaster.pop 'info','','Request being processed. You will receive an email with the excel'
    @Restangular.all('formadv_firms/export').customGET('', {
      firmCRDs: firm_arr.join(",")
      recipients: @username
    }).then (response) =>
      @toaster.pop 'success','','Request processed. Please check your email for the search results'

  addFirmCRD: (firm) =>
    firm.adding_mapping = true

    params =
      firmCrd: firm.entity.firmCRD

    params.assigned_to = if @activeTeamMember_id then @activeTeamMember_id else null
    @Restangular.all('Firm_FirmCRD_Mappings').post(params).then((response) =>
      firm.entity.is_tracking = true
      @toaster.pop 'success', '', "Tracking added for CRD ##{firm.entity.firmCRD}"
    ).finally(=>
      firm.adding_mapping = false
    )

  confirmMappingRemoval: (firm) =>
    @SweetAlert.confirm({
        title: "Are you sure you want to stop tracking this firm?"
        showLoaderOnConfirm: true
        focusCancel : true
        preConfirm: =>
          firm.removing_mapping = true
          params =
            firmCrd: firm.entity.firmCRD
          params.assigned_to = if @activeTeamMember_id then @activeTeamMember_id else null
          @Restangular.all('Firm_FirmCRD_Mappings').customDELETE(null, params)
          .finally(=>
            swal.close()
          ).then(=>
            firm.removing_mapping = false
            firm.entity.is_tracking = false
            @toaster.pop 'success', '', "Tracking removed for CRD ##{firm.entity.firmCRD}"
          )
      })

  clearGrouping: (grid,column)=>
    grid.api.grouping.clearGrouping()