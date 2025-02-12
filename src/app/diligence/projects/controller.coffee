class DiligenceProjectsController extends BaseController

  @register 'DiligenceProjectsController'

  @inject '$scope', 'Utils', 'Restangular', '$state', 'ChardinService', 'ModalFactory',
          '$q', '$window', 'SweetAlert', 'toaster', '$element','$timeout', 'keywordConstants','RestangularHeaderService', '$rootScope', 'FILTER_TERNARY_OPERATORS', 'keywordConstants','DiligenceDataSaveService','$http','angularEnabled'

  initialize: ->
    if (@$state.params.type.toLowerCase() != 'all' && @$state.params.type.toLowerCase() != 'my projects' && @$state.params.type.toLowerCase() != 'in-progress' && @$state.params.type.toLowerCase() != 'closed' && @$state.params.type.toLowerCase() != 'sent')
      @$state.go 'app.diligence.projects.activity', type: 'in-progress'
      @type = 'in-progress'
    else
      @type = @$state.params.type
    @is_investor = @Utils.isInvestor()
    @is_manager = @Utils.isManager()
    @counts_promise_deferred = @$q.defer()
    @counts_promise = @counts_promise_deferred.promise
    @entity_cta = @Utils.getEntityCTA()
    @current_user = @Utils.getCurrentUser()
    @permissions_enabled = @current_user.firmInfo.hasPermissionEnabled

    @getFiltersModalData()
    @filters_data_loaded = false
    @filterApplied = false
    @global_ternary_operator = @FILTER_TERNARY_OPERATORS.AND

    @filters =
      startDate: null
      endDate: null

    @$scope.$on '$locationChangeStart', (evt, absNewUrl, absOldUrl) =>
      @search_criterias = []
      @filterApplied = false
      @getFiltersModalData()
      @filters_data_loaded = false
      @filterApplied = false
      if absOldUrl.indexOf("login") > -1 && !@Utils.isFirstLogin()
        @showNudges = true
        if @$rootScope.selectedNudge
          @selectedNudge = @$rootScope.selectedNudge
      else
        @showNudges = false
        @selectedNudge = null

    @$scope.$on 'due_diligence_counts:refresh', @fetchNewCounts
    @getFirmPref()

    @$scope.$on '$stateChangeStart', (event, toState, toParams) =>
      if toParams.type
        if (toParams.type.toLowerCase() != 'all' && toParams.type.toLowerCase() != 'my projects' && toParams.type.toLowerCase() != 'in-progress' && toParams.type.toLowerCase() != 'closed' && toParams.type.toLowerCase() != 'sent')
          @$state.go 'app.diligence.projects.activity', type: 'in-progress'
          @type = 'in-progress'
        else
          @type = toParams.type
          @show_bulk_actions = false

    @show_bulk_actions = false
    @$scope.DiligenceProjectsActivityController = {}
    @totalSelectedRecords = 0

    @minDate = moment().subtract(5,'years').toDate()
    @maxDate = new Date()

    @minDateEditSection = moment().add(1,'days').toDate();
    @sent_diligences_as_of_date = null;
    @sent_diligences_due_date = null;
    @show_bulk_edit_actions = false
    @maxAsOfDate = @Utils.getMaxAsOfDateDiligence()

  applyMethod: (startDate,endDate)=>
    @fetchCounts()
    @filters.startDate = startDate
    @filters.endDate = endDate
    @searchByFilters()

  getFirmPref: =>
    @loading_prefs = true
    @Restangular.all('firm_preferences').customGET().then (response) =>
      @customDateFilter = @Utils.getPredefinedDateRanges(response.default_daterange_months)
      @customDateFilter.selectedRange = @Utils.getDateRanges()[response.default_daterange_months].label
      @$scope.DiligenceProjectsActivityController.init(response)
      @fetchCounts()

  fetchCounts: ->
    @is_loading = true
    params = {}
    if @customDateFilter.selectedRange == 'No Filter'
      params.start_date = null
      params.end_date   = null
    else
      params.start_date = @Utils.formatDatetime(@customDateFilter.startDate)
      params.end_date = @Utils.formatDatetime(@customDateFilter.endDate)
    @Restangular.all('diligences').customGET('counts',params).then (response) =>
      @no_dds = not response.has_projects
      @parseCounts response.counts
      @is_loading = false
      @showNudges = false

  parseCounts: (counts) ->
    _(counts).each (count_info) ->
      count_info.type = count_info.id.toLowerCase()
    @counts_promise_deferred.resolve(counts)
    @due_diligence_counts = counts

  showInviteDDHelp: ->
    config =
      reveal_menubar: true
      intros: [
        {
          target: '.js-menu-new-action',
          intro: 'Hover & click "'+@entity_cta+'" to create a new diligence / survey request',
          visible_elements: '.js-navbar-default'
        }
      ]

    @ChardinService.show(config)

    return #because http://errors.angularjs.org/1.4.10/$parse/isecdom?p0=vm.showInviteDDHelp(

  confirmBulkAction: (action) ->
    if action == 'remind'
      custom_class = 'primary'
      confirm_button_text = 'Remind'
    else if action == 'approve'
      custom_class = 'primary'
      confirm_button_text = 'Approve'
    else if action == 'accept'
      custom_class = 'primary'
      confirm_button_text = 'Accept'
    else if action == 'withdraw'
      custom_class = 'danger'
      confirm_button_text = 'Withdraw'
    else if action == 'delete'
      custom_class = 'danger'
      confirm_button_text = 'Delete'

    @SweetAlert.confirm({
        title: "Are you sure you want to #{action} the selected  projects?"
        customClass: custom_class
        confirmButtonText: confirm_button_text
        showLoaderOnConfirm: true
        preConfirm: =>
          @performBulkActions(action)
    })

  remindSelectedProjects: (items) =>
    @Restangular.all('v2/diligences/bulk_remind').customPUT(items)

  unSelectItems: =>
    _(@$scope.DiligenceProjectsActivityController.diligences.data).each (item) =>
      item.is_selected = false
      @$scope.DiligenceProjectsActivityController.diligences_grid.selection.unSelectRow(item)

  performBulkActions: (action) =>
    selected_diligences = []
    request_payload = {}
    toaster_message = ''

    selected_rows = @$scope.DiligenceProjectsActivityController.diligences_grid.selection.getSelectedRows()
    pageUrl = ""
    unless !@permissions_enabled or @Utils.isAdmin() or @Utils.isOwner()
      _(selected_rows).each (row,index)=>
        if row.entity_type.toLowerCase() == @keywordConstants.Product.toLowerCase()          #if diligence type is fund then go to firms.funds route
          pageUrl += "app/diligence/#{row.fromfirm_id}/firms/#{row.tofirm_id}/funds/#{row.entity_id}/projects/#{row.id}"
        else if row.entity_type.toLowerCase() == @keywordConstants.Firm.toLowerCase()        #else if it is a firm diligence then go to firms route
          pageUrl += "app/diligence/#{row.fromfirm_id}/firms/#{row.entity_id}/projects/#{row.id}"
        pageUrl += "," if index != selected_rows.length - 1

    selected_diligences = @$scope.DiligenceProjectsActivityController.diligences_grid.selection.getSelectedRows().map (row) =>
      row.id

    request_payload.entity_ids = selected_diligences
    count = selected_diligences.length
    if count > 1
      toaster_message = count + " projects"
    else
      toaster_message = count + " project"

    if action == 'remind'
      reminded_diligences = []
      _(@$scope.DiligenceProjectsActivityController.diligences_grid.selection.getSelectedRows()).each (item) =>
        if (item.status != 'Completed')
          reminded_diligences.push(item.id)
        else
          @$scope.DiligenceProjectsActivityController.diligences_grid.selection.unSelectRow(item)
      if reminded_diligences.length
        request_payload.entity_ids = reminded_diligences
        request_payload.status = 'Reminded'
        toaster_message = "Reminder sent to " + reminded_diligences.length + " project(s)"
      else
        @$timeout =>
          @toaster.pop 'error', '', 'No projects available for submission in the selection'
          @show_bulk_actions = false
          swal.close()
        return
    else if action == 'withdraw'
      request_payload.status = 'Withdrawn'
      withdrawn_diligences = []
      _(@$scope.DiligenceProjectsActivityController.diligences_grid.selection.getSelectedRows()).each (item) =>
        if (item.status == 'Sent')
          withdrawn_diligences.push(item.id)
        else
          @$scope.DiligenceProjectsActivityController.diligences_grid.selection.unSelectRow(item)
      if withdrawn_diligences.length
        request_payload.entity_ids = withdrawn_diligences
        request_payload.status = 'Withdrawn'
        toaster_message = toaster_message + " withdrawn"
      else
        @$timeout =>
          @toaster.pop 'error', '', 'No projects available for submission in the selection'
          @show_bulk_actions = false
          swal.close()
        return

    else if action == 'accept'
      request_payload.status = 'Started'
      toaster_message = toaster_message + " started"

    else if action == 'decline'
      request_payload.status = 'Declined'
      toaster_message = toaster_message + " declined"

    else if action == 'complete'
      completed_diligences = []
      _(@$scope.DiligenceProjectsActivityController.diligences_grid.selection.getSelectedRows()).each (item) =>
        if (item.status != 'Invited')
          completed_diligences.push(item.id)
        else
          @$scope.DiligenceProjectsActivityController.diligences_grid.selection.unSelectRow(item)
      if completed_diligences.length
        request_payload.entity_ids = completed_diligences
        request_payload.status = 'Completed'
        toaster_message = "Eligible projects (" + completed_diligences.length + ") have been submitted"
      else
        @$timeout =>
          @toaster.pop 'error', '', 'No projects available for submission in the selection'
          @show_bulk_actions = false
          swal.close()
        return

    else if action == 'delete'
      deleted_diligences = []
      _(@$scope.DiligenceProjectsActivityController.diligences_grid.selection.getSelectedRows()).each (item) =>
        if (item.status != 'Sent')
          deleted_diligences.push(item.id)
        else
          @$scope.DiligenceProjectsActivityController.diligences_grid.selection.unSelectRow(item)
      if deleted_diligences.length
        request_payload.status = 'Deleted'
        toaster_message = toaster_message + " deleted"
      else
        @$timeout =>
          @toaster.pop 'error', '', 'No projects available for submission in the selection'
          @show_bulk_actions = false
          swal.close()
        return


    else if action == 'approve'
      approval_diligences = []
      _(@$scope.DiligenceProjectsActivityController.diligences_grid.selection.getSelectedRows()).each (item) =>
        if ((item.status is 'Completed') or (item.status is 'Followup'))
          approval_diligences.push(item.id)
        else
          @$scope.DiligenceProjectsActivityController.diligences_grid.selection.unSelectRow(item)

      if approval_diligences.length
        request_payload.entity_ids = approval_diligences
        request_payload.status = 'Approved'
        toaster_message = "Eligible projects (" + approval_diligences.length + ") have been approved"
      else
        @$timeout =>
          @toaster.pop 'error', '', 'No projects available for approval in the selection'
          @show_bulk_actions = false
          swal.close()
        return

    @RestangularHeaderService.RestangularWithHeader(pageUrl, request_payload.status).all('v2/diligences/bulk_actions').customPUT(request_payload).then ((response)=>
      @$scope.DiligenceProjectsActivityController.refresh()
      @show_bulk_actions = false
      @toaster.pop 'success', '', toaster_message
      swal.close()
    ),(error) =>
      swal.close()
      @toaster.pop 'error', '', error.data.message

  getFiltersModalData: () =>
    @Restangular.all('service/dvapi_service/search_filters').post(entity_type:@keywordConstants.Project.toLowerCase(),type:@type).then (response) =>
      @search_filters_response = response
      @search_criterias = []
      filters = @DiligenceDataSaveService.getProjectsParams()
      if filters
        opportunityFilter = _(@search_filters_response.custom_filters).find (filter)=>
          filter.filter_key == 'inbound_configurations_id'

        for filter in @search_filters_response.default_filters
          newCriteria = {criteria_obj: filter}
          @search_criterias.push newCriteria

        if opportunityFilter
          @search_criterias.push
            advance_filter_value: filters.id
            condition: 'eq'
            criteria_obj: opportunityFilter

        @filterApplied = true

      @filters_data_loaded = true
      for filter,index in  @search_filters_response.default_filters
        if filter.hasOwnProperty('endpoint')
          @getDynamicDefaultFilterOptions(filter,index)
      for filter,index in  @search_filters_response.custom_filters
        if filter.hasOwnProperty('endpoint')
          @getDynamicCustomFilterOptions(filter,index)

  getDynamicCustomFilterOptions:(filter,index) =>
    if filter.method.toLowerCase() == 'get'
      requestPromise = @$http.get(filter.endpoint, filter.request_params)
    else if filter.method.toLowerCase() == 'post'
      requestPromise = @$http.post(filter.endpoint, filter.request_params)
    requestPromise.then (response) =>
      if filter.method.toLowerCase() == 'get'
        @search_filters_response.custom_filters[index].options = response.data
      else if filter.method.toLowerCase() == 'post'
        @search_filters_response.custom_filters[index].options = response.data.data
      for option in @search_filters_response.custom_filters[index].options
        @renameUsenameToValue(option,@search_filters_response.custom_filters[index].display_attribute)

  getDynamicDefaultFilterOptions:(filter,index) =>
    @$http.get(filter.endpoint).then (response) =>
      @search_filters_response.default_filters[index].options = response.data
      for option in @search_filters_response.default_filters[index].options
        @renameUsenameToValue(option,@search_filters_response.default_filters[index].display_attribute)

  renameUsenameToValue: (obj,key) =>
    obj['value'] = obj[key];
    delete obj[key];

  toggleFiltersSection: =>
    @ModalFactory.invokeModal 'manage_custom_search',
      resolve:
        custom_filters_data: =>
          global_ternary_operator: @global_ternary_operator
          search_filters_response : @search_filters_response
          search_criterias:@search_criterias
      success: (response) =>
        @search_criterias = response.search_criterias
        @global_ternary_operator =  response.global_ternary_operator
        if !_.isEmpty response.searchByFiltersParams
          @filterApplied = true
          @applyFiltersSearch(response.searchByFiltersParams)
        else
          @resetFiltersData()

  applyFiltersSearch: (filter_params) =>
    filter_params.include_custom_fields = false
    if @customDateFilter.selectedRange == 'No Filter'
      filter_params.start_date = null
      filter_params.end_date = null
    else
      filter_params.start_date = @Utils.formatDatetime(@customDateFilter.startDate)
      filter_params.end_date = @Utils.formatDatetime(@customDateFilter.endDate)
    @processing_data = true
    @$scope.DiligenceProjectsActivityController.DvGridController.fetchRecords(filter_params)

  resetFiltersData: () =>
    @global_ternary_operator = @FILTER_TERNARY_OPERATORS.AND
    @search_criterias = []
    @filterApplied = false
    @searchByFilters()
    @DiligenceDataSaveService.resetProjectsParams()

  removeFilterCriterion: (index) =>
    if index<@search_filters_response.default_filters.length
      @search_criterias[index].advance_filter_value = ''
    else
      @search_criterias.splice index, 1
    @searchByFilters()
    @DiligenceDataSaveService.resetProjectsParams()

  searchByFilters: ()=>
    searchByFiltersData = []
    for filter,index in @search_criterias
      if filter
        if(filter.hasOwnProperty('condition') && filter.hasOwnProperty('advance_filter_value') && filter.condition != null && filter.advance_filter_value != null && filter.advance_filter_value != "" && filter.advance_filter_value != undefined)
          searchByFiltersData.push(filter)
    if searchByFiltersData.length == 0
      @filterApplied = false
    params =
      include_contacts: true,
      include_custom_fields: true,
      include_dates: true,
      filters: "#{@global_ternary_operator}" : []
    for filter in searchByFiltersData
      filter_params =
        filter_key: filter.criteria_obj.filter_key,
        filter_name: filter.criteria_obj.filter_name,
        type: filter.criteria_obj.type,
        operations: filter.condition,
        filter_value: filter.advance_filter_value
      params.filters[@global_ternary_operator].push(filter_params)
    @applyFiltersSearch(params)

  displayFilter: (criterion) =>
    displayedFilter = ''
    value = ''
    if criterion.criteria_obj.type.toLowerCase() == 'date'
      if criterion.condition == 'between'
        startDate = moment(criterion.advance_filter_value.startDate).format("YYYY-MM-DD")
        endDate = moment(criterion.advance_filter_value.endDate).format("YYYY-MM-DD")
        displayedDate = startDate + ' to '+ endDate
      else
        displayedDate = moment(criterion.advance_filter_value).format("YYYY-MM-DD")
      displayedFilter = "#{criterion.criteria_obj.filter_name} : " + displayedDate
    else
        for filter in @search_filters_response.custom_filters
          if(filter.filter_key == criterion.criteria_obj.filter_key && filter.hasOwnProperty('options'))
            for option in filter.options
              if(option.id == criterion.advance_filter_value)
                value = option.value
        if value != ''
          displayedFilter = "#{criterion.criteria_obj.filter_name} : " + value
        else
          displayedFilter = "#{criterion.criteria_obj.filter_name} : " + criterion.advance_filter_value
    displayedFilter

  editSentdDDBulkActionActive: () ->
    selected_diligences = _(@$scope.DiligenceProjectsActivityController.diligences_grid.selection.getSelectedRows()).pluck('id');
    @show_bulk_edit_actions = true;

  exportSelectedQuestions: () ->
    params = {}
    params.project_ids = _(@$scope.DiligenceProjectsActivityController.diligences_grid.selection.getSelectedRows()).pluck('id');
    params.firm_id = @current_user.firmInfo.id
    params.firm_name = @current_user.firmInfo.name
    params.recipients = [@current_user.userName]
    @Restangular.all('service/excel_services/bulk_word_export').post(params).then =>
      @show_bulk_actions = false
      @show_bulk_edit_actions = false;
      @toaster.pop 'success', '', 'Once the export is finished you will receive an email with all selected projects in a zip file'
      @$scope.DiligenceProjectsActivityController.diligences_grid.selection.clearSelectedRows();
    .finally =>
      @show_bulk_actions = false
      @show_bulk_edit_actions = false;
      @$scope.DiligenceProjectsActivityController.diligences_grid.selection.clearSelectedRows();

  closeQuickActions:() ->
    @show_bulk_actions = false
    @cancelQuickActions()
    @$scope.DiligenceProjectsActivityController.diligences_grid.selection.clearSelectedRows();

  cancelQuickActions:() ->
    @show_bulk_edit_actions = false;
    @sent_diligences_as_of_date = null;
    @sent_diligences_due_date = null;

  showDueDateValidation: () ->
    if @sent_diligences_as_of_date and @sent_diligences_due_date
      !moment(@sent_diligences_due_date).isSameOrAfter(@sent_diligences_as_of_date, 'day')
    else
      false

  checkForValidDates: (diligence)=>
    can_proceed = true
    if @sent_diligences_as_of_date == null or @sent_diligences_due_date == null
      if @sent_diligences_as_of_date and moment(diligence.due_at).isBefore(@sent_diligences_as_of_date, 'day')
        can_proceed = false
      if @sent_diligences_due_date and moment(diligence.as_of_date).isAfter(@sent_diligences_due_date, 'day')
        can_proceed = false
    can_proceed

  editSentDDBulkAction: () ->
    if (@sent_diligences_due_date and @sent_diligences_as_of_date and moment(@sent_diligences_due_date).isSameOrAfter(@sent_diligences_as_of_date, 'day')) or (@sent_diligences_as_of_date and @sent_diligences_due_date == null) or (@sent_diligences_due_date and @sent_diligences_as_of_date == null)
      @loading = true;
      selected_diligences_temp = _(@$scope.DiligenceProjectsActivityController.diligences_grid.selection.getSelectedRows()).pluck('id');
      selected_diligences = []
      removed_diligences = []
      _(@$scope.DiligenceProjectsActivityController.diligences_grid.selection.getSelectedRows()).each (item) =>
        if (item.status == 'Started' || item.status == 'InReview' || item.status == 'Followup' || item.status == 'Sent') && @checkForValidDates(item)
          selected_diligences.push(item)
        else
          removed_diligences.push(item)
          @$scope.DiligenceProjectsActivityController.diligences_grid.selection.unSelectRow(item)
      if selected_diligences.length == 0
        @toaster.pop 'error', '', 'You cannot change dates for these project(s).'
      else if selected_diligences.length < selected_diligences_temp.length
        toaster_err_message = "You cannot change dates for (" + removed_diligences.length + ") project(s)."
        @toaster.pop 'error', '', toaster_err_message

      if selected_diligences.length > 0
        sent_diligences_updated_data = {
          "diligence_ids": _(selected_diligences).pluck('id'),
          "as_of_date": moment(@sent_diligences_as_of_date).format('YYYY-MM-DD') if @sent_diligences_as_of_date
          "due_at": moment(@sent_diligences_due_date).format('YYYY-MM-DD') if @sent_diligences_due_date
        };
        @Restangular.all('diligences/bulk_schedule_diligences').customPUT(sent_diligences_updated_data).then =>
          @show_bulk_actions = false
          @show_bulk_edit_actions = false;
          @$scope.DiligenceProjectsActivityController.refresh()
          toaster_message = "Eligible projects (" + selected_diligences.length + ") have been updated"
          swal.close()
          @toaster.pop 'success', '', toaster_message
        .finally =>
          @show_bulk_actions = false
          @show_bulk_edit_actions = false;
          @sent_diligences_due_date = null;
          @sent_diligences_as_of_date = null;
          @$scope.DiligenceProjectsActivityController.diligences_grid.selection.clearSelectedRows();
          #swal.close()
      else
        @loading = false;
        @show_bulk_actions = false
        @show_bulk_edit_actions = false;
        @sent_diligences_due_date = null;
        @sent_diligences_as_of_date = null;
    # else
    #   @toaster.pop 'error', '', 'Due date should be greater than as of date'
