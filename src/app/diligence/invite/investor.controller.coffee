class DiligenceInviteInvestorController extends BaseController

  @register 'DiligenceInviteInvestorController'

  @inject 'WizardHandler', 'angularEnabled' , 'ModalFactory', '$filter', '$http', 'baseUrl', '$q', 'toaster', '$state','$location',
    'SweetAlert', '$scope', 'DueDiligence', 'Restangular', 'Utils', '$stateParams',
    'ScheduledDiligenceResource', '$rootScope', '$timeout', 'uibButtonConfig', 'BaseDataService',
    'DueDiligenceDataservice','keywordConstants', '$tinymceToolbar1', '$tinymceToolbar2', '$tinymcePlugins','$tinymceStatusbar', 'hierarchyConstants','FILTER_TERNARY_OPERATORS','FILTER_TYPES','SelectedEntitiesResource', '$window'

  initialize: ->

    @assignedApprovers = []
    @assignedApproversList = []
    @nextBtnText = 'Send Request'
    @saveAsDraft = false
    @isPendingOrDraftRequestSelected = false
    @is_pending_data_loaded = true
    @selectedRequestDraftId = null
    @currentUserId = @Utils.getCurrentUser().id
    @currentUserIsApprover = false
    @display_wizard_top_back_button = false

    @email_templates = []
    promises = []
    @internalSubscribers = []
    @review_entity_type = "All"
    @review_diligence_templates = []
    @resetStepsArray = false
    @selected_entities = []
    @selected_funds = []
    # @showProjectsSelection = false
    @combinedDiligences = []
    @filters_section = {}
    @filter = {}
    @selected_vehicles = []
    @showReviewDDFlow = false
    @sender_emails = []
    @selection_list = []
    @cc_emails = []
    @bcc_emails = []
    @use_email_templates = false
    @disallow_custom_edits = false
    @email_text = ''
    @due_date_map =
      'dd_new': 45
      'dd_review': 45
      'dd_ongoing': 30
      'dd_event_related': 10
    @request =
      'all_entity_flag': false
      'diligence_reason': null
      'duediligence_type': null
      'as_of_date': new Date()
      'due_at': null
      'template_id': []
      'entity_id': null
      'review_template': []
    @minDate = new Date()
    @maxAsOfDate = @Utils.getMaxAsOfDateDiligence()
    @is_data_loaded = false
    @is_admin = @Utils.isAdmin()
    @entity_type = @Utils.getEntityType()
    @currentUser = @Utils.getCurrentUser()
    @permissions_enabled = @currentUser.firmInfo.hasPermissionEnabled
    @selected_sender_email = ""
    @selected_cc_email_list = []
    @selected_bcc_email_list = []
    @showAdvanceOptions = false
    @show_bulk_edit_actions = false
    @minDateEditSection = moment().add(1,'days').toDate();
    @scheduled_diligences_scheduled_date = @minDateEditSection;
    @scheduled_diligences_due_date = @minDateEditSection;
    @loading = false;
    @maxSelectedTemplates = 10000
    @maxSelectedVehicleTemplates = 10000
    @selectedFilters = []
    @selectedSubFilters = []
    @selectedGlobalTernaryOperator = @FILTER_TERNARY_OPERATORS.AND
    @selectedSubGlobalTernaryOperator = @FILTER_TERNARY_OPERATORS.AND

    @allFilterTemplateId = null
    @allSubFilterTemplateId = null
    @filterApplied = false
    @subFilterApplied = false
    @unfilteredSelectedEntities = null
    @unfilteredSelectedSubEntities = null
    @entitySearchMap = {}
    @subEntitySearchMap = {}
    @showMainFilterBasedSelection = false
    @showSubFilterBasedSelection = false
    @mainFilterSelectionValid = true
    @subFilterSelectionValid = true
    @subdd_for = ""
    @selectedSubEntities = []

    @$scope.$watch 'vm.selectedFilters', (value)=>
      @entitySearchMap = {}
      @allFilterTemplateId = null
    , true

    @$scope.$watch 'vm.selectedGlobalTernaryOperator', (value)=>
      @entitySearchMap = {}
      @allFilterTemplateId = null

    @$scope.$watch 'vm.selectedSubFilters', (value)=>
      @subEntitySearchMap = {}
      @allSubFilterTemplateId = null
    , true

    @$scope.$watch 'vm.selectedSubGlobalTernaryOperator', (value)=>
      @subEntitySearchMap = {}
      @allSubFilterTemplateId = null

    @dd_for = 'Product'
    @tinymceOptions =
      skin_url: '/assets/stylesheets/tinymce/skins/tinymce-dv'
      browser_spellcheck: true
      height: 250
      plugins: @$tinymcePlugins
      custom_undo_redo_levels: 10
      toolbar1: @$tinymceToolbar1
      toolbar2: @$tinymceToolbar2
      menubar: false
      statusbar: @$tinymceStatusbar
      branding: false
      resize: false
      elementpath: false
      image_dimensions: false
      forced_root_block : ""
      content_css : 'assets/stylesheets/tiny_mce_custom.css'
      table_toolbar: ""
      render: (editor) =>
        @$timeout => #since this comes from a event handler in tinymce
          @ModalFactory.invokeModal 'questionnaire_upload_image',
            resolve:
              editor: -> editor


    promises.push @Restangular.all('events').getList().then (response) =>
      @events = response

    promises.push @Restangular.one('firm_preferences').customGET().then (response) =>
      @firm_preferences = response

      @assignedApprovers = response.approver_list_for_information_request

      @getTeamMembers()
      @getFunctions()

      @default_email_template_message_id = response.default_email_template_message_id
      if response.disallow_custom_email_template_edit
        @disallow_custom_edits = true
        @use_email_templates = true

      if response.customize_intro
        @use_email_templates = true

      if response.set_firm_entity_default and response.set_firm_entity_default.toLowerCase() == @keywordConstants.Firm.toLowerCase()
        @setDDFor("Firm")
      else
        @setDDFor("Product")

      if response.sender_email
        @sender_emails = response.sender_email.replace(/\s/g,'').split(",")
        @selected_sender_email = @sender_emails[0] if @sender_emails.length > 0 and @firm_preferences.add_sender_email

      if response.cc_email
        @cc_emails = response.cc_email.replace(/\s/g,'').split(",")
        @selected_cc_email_list.push @cc_emails[0] if @cc_emails.length > 0 and @firm_preferences.add_cc_email

      if response.bcc_email
        @bcc_emails = response.bcc_email.replace(/\s/g,'').split(",")
        @selected_bcc_email_list.push @bcc_emails[0] if @bcc_emails.length > 0 and @firm_preferences.add_cc_email

    promises.push @Restangular.one('EmailTemplateMessages').customGET().then (response) =>
      @email_templates = response

    promises.push @Restangular.all('templates').getList({detail: false, is_new_information_request: true}).then (response) =>
      response = @filterbyStandardTemplate(response)
      @templates = response

      if @$stateParams.templateId?
        template = _(response).findWhere({id: Number(@$stateParams.templateId)})
        @request.template = [template] if template
        @request.review_template = template
      if @$stateParams.type == "pending_requests"
        @setDDType('dd_pending')
        if @$stateParams.requestId
          @goToRequestDetailPage(@$stateParams.requestId)


    @$q.all(promises).then (=>
      @is_data_loaded = true
      if @default_email_template_message_id and @use_email_templates
        @renderEmailTemplate(@default_email_template_message_id)
    )

    @dateFiltersMap = [
      {
        name: 'Current Month'
        value: 'current-month'
      }
      {
        name: 'Next Month'
        value: 'next-month'
      }
      {
        name: 'Next Three Months'
        value: 'next-three-months'
      }
      {
        name: 'Show All'
        value: 'show-all'
      }
    ]

    @dateRangeValue = [undefined, undefined]

    @activeDateRange = null

    @scheduled_diligences = @ScheduledDiligenceResource.$new(type: 'scheduled', start_date: @dateRangeValue[0], end_date: @dateRangeValue[1])

    @temp_diligences_obj = null

    @$rootScope.$on 'grid:loaded', =>
      # if @temp_diligences_obj
      #   @$timeout =>
      #     _(@temp_diligences_obj.data).each (item) =>
      #       if item.is_selected
      #         _(@scheduled_diligences.data).each (scheduled_item) =>
      #           if scheduled_item.id == item.id
      #             scheduled_item.is_selected = true
      #             @toggleSelection(scheduled_item)
      #     @is_loading_scheduled_dds = false
      #   , 500
      # else
      @is_loading_scheduled_dds = false
      @isManager = @Utils.isManager()
      if @isManager
        @$window.history.back()
        return

  beforeLoadingQuestionnaireSelect: =>
    @getSelectedEntitiesCount()
    @searchByFiltersData = []
    @selected_entities = _(@selected_entities).filter (entity) ->
      entity.notification_contacts.length

    for filter,index in @selectedFilters
      if filter
        if(filter.hasOwnProperty('condition') && filter.hasOwnProperty('advance_filter_value') && filter.condition != null && filter.advance_filter_value != null && filter.advance_filter_value != "" && filter.advance_filter_value != undefined)
          @searchByFiltersData.push(filter)
    if @searchByFiltersData.length == 0
      @filterApplied = false
      @showMainFilterBasedSelection = false
    else
      @filterApplied = true

    @searchBySubFiltersData = []
    for filter,index in @selectedSubFilters
      if filter
        if(filter.hasOwnProperty('condition') && filter.hasOwnProperty('advance_filter_value') && filter.condition != null && filter.advance_filter_value != null && filter.advance_filter_value != "" && filter.advance_filter_value != undefined)
          @searchBySubFiltersData.push(filter)
    if @searchBySubFiltersData.length == 0
      @subFilterApplied = false
      @showSubFilterBasedSelection = false
    else
      @subFilterApplied = true

    if @dd_for == 'Product' && @showVehicles
      @selectedSubEntities = @selected_vehicles
      @subdd_for = 'Vehicle'
    else if @dd_for == @hierarchyConstants.Title && @showFunds
      @selectedSubEntities = @selected_funds
      @subdd_for = 'Product'

  getSelectedEntitiesCount: =>
    if @dd_for == 'Product' and @showVehicles
      @maxSelectedTemplates = 1
      @maxSelectedVehicleTemplates = 1
      @request.template = [@request.template[0]] if @request.template and @request.template.length > 0
      @request.vehicleTemplate = [@request.vehicleTemplate[0]] if @request.vehicleTemplate and @request.vehicleTemplate.length > 0
    else if @dd_for == @hierarchyConstants.Title and @showFunds
      @maxSelectedTemplates = 1
      @maxSelectedVehicleTemplates = 1
      @request.template = [@request.template[0]] if @request.template and @request.template.length > 0
      @request.productsTemplate = [@request.productsTemplate[0]] if @request.productsTemplate and @request.productsTemplate.length > 0
    else
      @maxSelectedTemplates = 10000
      @maxSelectedVehicleTemplates = 10000

  onSelectedEntityChanged: =>
    selected_entities = {}
    entityKeys = Object.keys(@entitySearchMap)
    _(entityKeys).each (entityKey)=>
      _(@entitySearchMap[entityKey].data).each (entity)=>
        if entity.selected
          selected_entities[entity.id] = entity

    if @unfilteredSelectedEntities
      _(@unfilteredSelectedEntities.data).each (entity)=>
        selected_entities[entity.id] = entity

    selected_entities = _(Object.values(selected_entities)).pluck('id')
    if @dd_for == 'Product' && @showVehicles
      @selectedSubEntities = _(@selected_vehicles).filter (vehicle)=>
        _(selected_entities).indexOf(vehicle.fund_id) > -1
    else if @dd_for == @hierarchyConstants.Title && @showFunds
      @selectedSubEntities = _(@selected_funds).filter (fund)=>
        _(selected_entities).indexOf(fund.parent_id) > -1


  canProceedToTemplateStep: =>
    can_proceed = @areSelectedEntitiesValid() || @request.all_entity_flag
    bouncedEntitiesList = []
    allEntitiesList = @selected_entities
    bouncedEmailsList = []
    allEmailsList = []
    _(@selected_entities).each (entity) =>
      bouncedContactsCount = 0
      notification_contacts = []
      _(entity.notification_contacts).each (contact) =>
        allEmailsList.push contact if !contact.is_removed
        notification_contacts.push contact if !contact.is_removed
        if contact.has_bounce_history && !contact.is_removed
          bouncedContactsCount++
          bouncedEmailsList.push contact
      if (bouncedContactsCount == notification_contacts.length && notification_contacts.length > 0) || notification_contacts.length == 0
        bouncedEntitiesList.push entity
    if bouncedEmailsList.length > 0 || bouncedEntitiesList.length > 0
      modalInstance = @ModalFactory.invokeModal 'alert_bounced_contacts',
        resolve:
          entitiesList: =>
            bounced: bouncedEntitiesList
            all: allEntitiesList
            entity_type: @dd_for
          contactsList: =>
            bounced: bouncedEmailsList
            all: allEmailsList
      modalInstance.result.then (response) =>
        if response == 'closed'
          unless can_proceed
            @display_entity_selection_error = true
            deregisterer = @$scope.$watch 'vm.selected_entities.length', (value) =>
              if @areSelectedEntitiesValid()
                @display_entity_selection_error = false
                deregisterer()
                deregistererTwo()
            deregistererTwo = @$scope.$watch 'vm.request.all_entity_flag', (value) =>
              if value == true
                @display_entity_selection_error = false
                deregisterer()
                deregistererTwo()
          can_proceed
    else
      unless can_proceed
        @display_entity_selection_error = true
        deregisterer = @$scope.$watch 'vm.selected_entities.length', (value) =>
          if @areSelectedEntitiesValid()
            @display_entity_selection_error = false
            deregisterer()
            deregistererTwo()
        deregistererTwo = @$scope.$watch 'vm.request.all_entity_flag', (value) =>
          if value == true
            @display_entity_selection_error = false
            deregisterer()
            deregistererTwo()
      can_proceed

  getDiligenceTemplates: ->
    arr = []
    dupes = []
    for diligence in @diligences
      if dupes.indexOf(diligence.template_id) == -1
        arr.push {id: diligence.template_id, name: diligence.template_name}
        dupes.push diligence.template_id
    arr

  getFunctions: =>
    @Restangular.all('function_assignments').getList({entity_id:@currentUser.firmInfo.id,entity_type:'Firm'}).then (response)=>
      @functions = response

  getTeamMembers: () =>
    @BaseDataService.getTeamMembers().then (teamMembers) =>
      @teamMembers = _(teamMembers).map (teamMember) ->
        teamMember.fullName = _([teamMember.firstName, teamMember.lastName]).compact().join(' ')
        teamMember
      @$timeout =>
        currentUser = angular.copy @currentUser
        currentUser.type = 'user'
        @teamMembers.push currentUser
        @internalSubscribers.push currentUser
      for member in @teamMembers
        for assignedApprover in @assignedApprovers
          if member.id == assignedApprover
            @assignedApproversList.push member

  showProjectsSelection: (template) =>
    ids = _(@review_diligence_templates).pluck 'id'
    if ids.indexOf(template.id) > -1
      return true
    else
      return false

  getDataForSteps: =>
    @getDiligences()

  clearEntityFilter: =>
    @setEntityType(@review_entity_type)

  validateDueDate: =>
    @template_selection_form['due-date'].$setValidity('validDueDate',moment(@request.due_at).isSameOrAfter(@request.as_of_date, 'day'))

  validateDueDateReview: ()=>
    @review_template_selection_form['due-date'].$setValidity('validDueDate',moment(@request.due_at).isSameOrAfter(@request.as_of_date, 'day'))

  getDiligences: =>
    if @request.review_template and @request.review_template.mapped_templates
      params = {}
      params.template_ids = _(@request.review_template.mapped_templates).pluck 'id'
      params.start_date = null
      params.end_date = null
      # if @customDateFilter.selectedRange != 'No Filter'
      #   params.start_date = @Utils.formatDatetime(@customDateFilter.startDate)
      #   params.end_date = @Utils.formatDatetime(@customDateFilter.endDate)
      params.include_custom_review_diligences = true
      params.include_inprogress_diligences = true
      @review_diligence_templates = []
      @show_review_step = false
      @resetStepsArray = false
      @diligences = []
      @review_diligence_templates = []
      @diligencesCopy = []
      @display_wizard_footer = false
      @toaster.pop 'wait', '', 'Fetching projects , please wait..', 500000
      @show_dilignece_zero_text = false
      @Restangular.all('diligences/GetByTemplate').post(params).then ((response) =>
        @diligences = response
        @toaster.clear()
        if @diligences.length
          @display_wizard_footer = true
        else
          @show_dilignece_zero_text = true
        @diligencesCopy = angular.copy response
        @request.is_internal = true
        @review_diligence_templates = @getDiligenceTemplates()
        if @review_diligence_templates and @review_diligence_templates.length
          for row in @review_diligence_templates
            row.selection_list = []
      ), (error) =>
        @toaster.clear()

  toggleFiltersSection: =>
    @filters_section.show = !@filters_section.show

  entryExists: (step)=>
    ids = _(@review_diligence_templates).pluck 'id'
    if ids.length > 0 and ids.indexOf(step) > -1
      return true
    else
      return false

  reviewIsAlive: (step)=>
    @show_review_step and Number(step) == @request.review_template.id

  canProceedToDiligenceSelection: =>
    can_proceed = false
    @filter.diligence_entity = null
    if @diligences and @diligences.length and @request.due_at
      can_proceed = true
      # @show_review_step = true
    can_proceed

  canProceedToReviewOpinionDiligenceNext: =>
    selectedDiligences = []
    can_proceed = false
    for entry in @review_diligence_templates
      for diligence in entry.selection_list
        selectedDiligences.push diligence
    if selectedDiligences.length > 0
      can_proceed = true
    if !can_proceed
      message = 'Please select at least one project!'
      @toaster.pop 'error', '', message
    can_proceed

  markSelection: (diligences) ->
    ids = _(@selection_list).pluck('id')

    _(diligences).filter (diligence) ->
      diligence.is_selected = _(ids).contains(diligence.id)

  selectAll: ->
    _(@diligences).each (diligence) =>
      @addToSelection(diligence)

    @select_all_entities = false
    @disable_select_all = true

  addToSelection: (entry, diligence) ->
    if @review_diligence_templates.length <= 1 and @review_diligence_templates[entry.rowIndex].selection_list.length >= 5
      @toaster.pop 'error', '', 'Maximum limit reached'
      return
    if @review_diligence_templates.length > 1 and @review_diligence_templates[entry.rowIndex].selection_list.length >= 1
      @toaster.pop 'error', '', 'Maximum limit reached'
      return

    ids = _(@review_diligence_templates[entry.rowIndex].selection_list).pluck('id')
    unless _(ids).contains(diligence.id)
      diligence.is_selected = true
      @review_diligence_templates[entry.rowIndex].selection_list.push diligence

    # @review_diligence_templates[entr]
    # if @review_diligence_templates.length <= 1 and @selection_list.length > 5
    #   @toaster.pop 'error', '', 'Maximum limit reached'
    #   return
    # if @review_diligence_templates.length <= 1 and @selection_list.length > 5
    #   @toaster.pop 'error', '', 'Maximum limit reached'
    #   return
    #
    # ids = _(@selection_list).pluck('id')
    # unless _(ids).contains(diligence.id)
    #   diligence.is_selected = true
    #   @selection_list.push(diligence)

  removeFromSelection: (entry, diligence) ->
    @setEntityType(diligence.entity_type)
    @$timeout =>
      @handleDeselection([diligence])
      entry.selection_list.splice(entry.selection_list.indexOf(diligence), 1)

  clearSelectionList: (entry) ->
    @handleDeselection(entry.selection_list)
    entry.selection_list.length = 0
    @disable_select_all = false

  handleDeselection: (diligences) ->
    _(diligences).each (diligence) =>
      diligence_from_main_list = _(@diligences).findWhere(id: diligence.id)

      diligence_from_main_list.is_selected = false if diligence_from_main_list

    @select_all_entities = false

  canExitVehiclesStep: =>
    if @selected_vehicles.length > 0
      @show_vehicles_selection_error = false
      true
    else
      @show_vehicles_selection_error = true
      false

  canExitProductsStep: =>
    selected_funds_valid_arr = []
    if @selected_funds.length > 0
      _(@selected_funds).each (fund) =>
        entity_item =
          id: fund.id
          notification_contacts: []
        _(fund.notification_contacts).each (contact) =>
          if !contact.is_removed
            entity_item.notification_contacts.push contact
        if entity_item.notification_contacts.length > 0
          selected_funds_valid_arr.push entity_item
      if selected_funds_valid_arr.length > 0
        @show_funds_selection_error = false
        true
      else
        @show_funds_selection_error = true
        false
    else
      @show_funds_selection_error = true
      false

  getDiligenceFunds: ->
    if @active_step_template and @active_step_template.id
      arr = []
      dupes = []
      for diligence in @diligences
        if diligence.entity_type == 'Fund' and diligence.template_id == @active_step_template.id and dupes.indexOf(diligence.entity_id) == -1
          arr.push diligence
          dupes.push diligence.entity_id
      arr

  getDiligenceFirms: ->
    if @active_step_template and @active_step_template.id
      arr = []
      dupes = []
      for diligence in @diligences
        if diligence.entity_type == 'Firm' and diligence.template_id == @active_step_template.id and dupes.indexOf(diligence.entity_id) == -1
          arr.push diligence
          dupes.push diligence.entity_id
      arr

  getDiligenceStrategies: () ->
    if @active_step_template and @active_step_template.id
      arr = []
      dupes = []
      for diligence in @diligences
        if diligence.entity_type == 'Strategy' and diligence.template_id == @active_step_template.id and dupes.indexOf(diligence.entity_id) == -1
          arr.push diligence
          dupes.push diligence.entity_id
      arr

  getDiligenceVehicles: () ->
    if @active_step_template and @active_step_template.id
      arr = []
      dupes = []
      for diligence in @diligences
        if diligence.entity_type == 'Vehicle' and diligence.template_id == @active_step_template.id and dupes.indexOf(diligence.entity_id) == -1
          arr.push diligence
          dupes.push diligence.entity_id
      arr

  sendReviewDDRequest: =>
    if @project_name and @combinedDiligences.length
      params = {}
      params.name = @project_name
      params.due_date = @request.due_at
      params.as_of_date = @request.as_of_date
      params.review_template_id = @request.review_template.id
      params.mapped_diligence_ids = _(@combinedDiligences).pluck "id"
      params.entity_ids = _(@combinedDiligences).pluck "entity_id"
      @Restangular.all('review_projects').post(params).then (response) =>
        @toaster.pop 'success', 'New request has been successfully added', '', 3000
        @$state.go 'app.diligence.project.questionnaire', diligenceId: response.id
    else
      if @project_name and @combinedDiligences.length == 0
        message = 'Please select at least one project!'
        @toaster.pop 'error', '', message

  projectsSelectionBeforeEnter: (template, index) =>
    @active_step_template = template
    @filterByEntity(@review_entity_type)
    @diligence_funds = @getDiligenceFunds()
    @diligence_firms = @getDiligenceFirms()
    @diligence_strategies = @getDiligenceStrategies()
    @diligence_vehicles = @getDiligenceVehicles()
    @filter.diligence_entity = null

  combineSelectedDiligences: =>
    # dupes = _(@combinedDiligences).pluck 'id'
    @combinedDiligences = []
    for entry in @review_diligence_templates
      for diligence in entry.selection_list
        @combinedDiligences.push diligence
        # if dupes.indexOf(diligence.id) == -1

  getDefaultEmailTemplate: (use_email_template) =>
    if use_email_template
      @renderEmailTemplate(@default_email_template_message_id)
    else
      @email_text = ""

  setEntityType: (entity_type) =>
    @review_entity_type = entity_type
    @filter.diligence_entity = null
    @filterByEntity(entity_type)
    @diligence_funds = @getDiligenceFunds()
    @diligence_firms = @getDiligenceFirms()
    @diligence_strategies = @getDiligenceStrategies()
    @diligence_vehicles = @getDiligenceVehicles()
    @filters_section.show = false

  filterDiligences: (value, type) =>
    if (type == "Fund" or type == "Firm" or type == "Strategy" or type == "Vehicle") and (@active_step_template and @active_step_template.id)
      @diligences = _(@diligencesCopy).filter (diligence) => diligence.entity_id == value.entity_id and diligence.template_id == @active_step_template.id

  filterByEntity: (type) =>
    if @active_step_template and @active_step_template.id
      if type == 'Firm'
        @diligences = _(@diligencesCopy).filter (diligence) => diligence.entity_type == "Firm" and diligence.template_id == @active_step_template.id
      else if type == 'Strategy'
        @diligences = _(@diligencesCopy).filter (diligence) => diligence.entity_type == "Strategy" and diligence.template_id == @active_step_template.id
      else if type == 'Fund'
        @diligences = _(@diligencesCopy).filter (diligence) => diligence.entity_type == "Fund" and diligence.template_id == @active_step_template.id
      else if type == "Vehicle"
        @diligences = _(@diligencesCopy).filter (diligence) => diligence.entity_type == "Vehicle" and diligence.template_id == @active_step_template.id
      else if type == "Custom" || type == "Review"
        @diligences = _(@diligencesCopy).filter (diligence) => diligence.entity_type == "Review" and diligence.template_id == @active_step_template.id
      else if type == "All"
        @diligences = _(@diligencesCopy).filter (diligence) => diligence.id and diligence.template_id == @active_step_template.id

  filterbyStandardTemplate:(templates) =>
    return _(templates).filter((template)=>
        template.type != "dd_profile"
    )

  areSelectedEntitiesValid: () =>
    all_selected_entities_arr = []
    _(@selected_entities).each (entity) =>
      entity_item = {
        id: entity.id
        notification_contacts: []
      }
      _(entity.notification_contacts).each (contact) =>
        if !contact.is_removed
          entity_item.notification_contacts.push(contact.id)
      if entity_item.notification_contacts.length
        all_selected_entities_arr.push(entity_item)
    return all_selected_entities_arr.length

  formatTooltip: (list) =>
    return list.join(', ')

  setSuggestedDueDate: ->
    @request.due_at = @getSuggestedDueDate()


  renderEmailTemplate: (id) ->
    template = _(@email_templates).findWhere({id: id})
    if template
      @email_text = template.content
    else
      @email_text =  ""


  getSuggestedDueDate: (purpose) ->
    moment().add(@due_date_map[purpose or @request.duediligence_type], 'days').toDate()

  canExitQuestionnaireStep: =>
    @setEntities()
    return @template_selection_form.$valid && (!@showMainFilterBasedSelection || @mainFilterSelectionValid) && (!@showSubFilterBasedSelection || @subFilterSelectionValid) && @selected_entity_grid.length > 0

  setEntities: =>
    if @dd_for == 'Product'
      entity_type = 'Fund'
    else if @dd_for == 'Firm'
      entity_type = 'Firm'
    else if @dd_for == @hierarchyConstants.Title
      entity_type = 'Strategy'
    else
      entity_type = 'Vehicle'

    @selected_entities_temp = []
    @all_selected_entities_arr = []
    @all_selected_entities_contacts_arr = []
    @selected_entity_grid = []
    if @showMainFilterBasedSelection
      if @selectedGlobalTernaryOperator == @FILTER_TERNARY_OPERATORS.AND
        keys = Object.keys(@entitySearchMap)
        searchMap = if keys.length > 0 then [@entitySearchMap[keys[0]]] else []
      else
        searchMap = @entitySearchMap
      _(searchMap).each (filter)=>
        if !filter.hasDuplicate
          if @selectedGlobalTernaryOperator == @FILTER_TERNARY_OPERATORS.AND
            template = @allFilterTemplateId
          else
            template = filter.template_id
          _(filter.data).each (entity)=>
            if entity.selected
              gridItem =
                id: entity.id
                name: entity.display_name
                template: _(template).pluck 'name'
                notification_contacts: []
              @generateRequestList(entity, template, entity_type, gridItem)
              @selected_entity_grid.push gridItem


      if @unfilteredSelectedEntities and @unfilteredSelectedEntities.data.length > 0
        _(@unfilteredSelectedEntities.data).each (entity)=>
          gridItem =
            id: entity.id
            name: entity.display_name
            template: _(@unfilteredSelectedEntities.template_id).pluck 'name'
            notification_contacts: []
          @generateRequestList(entity, @unfilteredSelectedEntities.template_id, entity_type, gridItem)
          @selected_entity_grid.push gridItem


    else
      _(@selected_entities).each (entity) =>
        gridItem =
          id: entity.id
          name: entity.display_name
          template: _(@request.template).pluck 'name'
          notification_contacts: []
        @generateRequestList(entity, @request.template, entity_type, gridItem)
        @selected_entity_grid.push gridItem

    if @selected_entities_temp.length > @firm_preferences.threshold_for_approval_flow && @firm_preferences.enable_approval_flow_information_request && @request.DDTypeDisplayName != "Pending Requests"
      @nextBtnText = 'Send Request for Approval'
    else
      @nextBtnText = 'Send Request'

    @generateSubEntityRequestList()

  loadGrid:=>
    @loading_grid = true
    @selectedGridResource = @SelectedEntitiesResource.$new(
      {
        options: {
          entities: @selected_entity_grid
        }
      }
    )
    @$timeout =>
      @loading_grid = false

  generateSubEntityRequestList: =>
    if @showSubFilterBasedSelection
      if @selectedSubGlobalTernaryOperator == @FILTER_TERNARY_OPERATORS.AND
        keys = Object.keys(@subEntitySearchMap)
        searchMap = if keys.length > 0 then [@subEntitySearchMap[keys[0]]] else []
      else
        searchMap = @subEntitySearchMap
      _(searchMap).each (filter)=>
        if !filter.hasDuplicate
          if @selectedSubGlobalTernaryOperator == @FILTER_TERNARY_OPERATORS.AND
            template = @allSubFilterTemplateId
          else
            template = filter.template_id
          _(filter.data).each (entity)=>
            if entity.selected
              contacts = []
              _(entity.notification_contacts).each (contact) =>
                  if !contact.is_removed
                    if contact.name.trim() != ''
                      contacts.push contact.name
                    else
                      contacts.push contact.email
              @selected_entity_grid.push
                id: entity.id
                name: entity.display_name
                template: _(template).pluck 'name'
                notification_contacts: contacts

      if @unfilteredSelectedSubEntities and @unfilteredSelectedSubEntities.data.length > 0
        _(@unfilteredSelectedSubEntities.data).each (entity)=>
          contacts = []
          _(entity.notification_contacts).each (contact) =>
            if !contact.is_removed
              if contact.name.trim() != ''
                contacts.push contact.name
              else
                contacts.push contact.email
          @selected_entity_grid.push
            id: entity.id
            name: entity.display_name
            template: _(@unfilteredSelectedSubEntities.template_id).pluck 'name'
            notification_contacts: contacts

    else
      selected_entities = []
      if @dd_for == 'Product' && @showVehicles
        selected_entities = @selected_vehicles
        dd_for = 'Vehicle'
        template = @request.vehicleTemplate
      else if @dd_for == @hierarchyConstants.Title && @showFunds
        selected_entities = @selected_funds
        dd_for = 'Product'
        template = @request.productsTemplate

      _(selected_entities).each (entity) =>
        contacts = []
        _(entity.notification_contacts).each (contact) =>
          if !contact.is_removed
            if contact.name.trim() != ''
              contacts.push contact.name
            else
              contacts.push contact.email
        @selected_entity_grid.push
          id: entity.id
          name: entity.display_name
          template: _(template).pluck 'name'
          notification_contacts: contacts


  generateRequestList: (entity, template, entity_type, gridItem)=>
    entity_item = {
      id: entity.id
      notification_contacts: []
      entity_type: entity_type
      template_id: null
    }
    _(entity.notification_contacts).each (contact) =>
      if !contact.is_removed && !contact.has_bounce_history
        entity_item.notification_contacts.push(contact.id)
        if contact.name.trim() != ''
          @all_selected_entities_contacts_arr.push(contact.name)
          gridItem.notification_contacts.push contact.name
        else
          @all_selected_entities_contacts_arr.push(contact.email)
          gridItem.notification_contacts.push contact.email

    if entity_item.notification_contacts.length
      _(template).each (template)=>
        request = angular.copy entity_item
        request.template_id = template.id
        @selected_entities_temp.push(request)
      @all_selected_entities_arr.push(entity.name)

  toggleSelectAll: (gridApi,rows) =>
    #ui-grid handles the selectall
    #method recieves all the selected rows, loop through all the rows and check all of them group header rows
    angular.forEach rows, (row) =>
      if row.treeNode.parentRow && row.treeNode.parentRow.internalRow
        row.treeNode.parentRow.isSelected = row.isSelected

    #get total selected rows from the grid api
    selectedCount = gridApi.selection.getSelectedRows().length
    selectAll = selectedCount > 0
    @show_bulk_actions = selectAll
    @totalSelectedRecords = selectedCount


  toggleAllItemsSelection: (grid, val) =>

    if val
      @scheduled_diligences_grid.selection.selectAllVisibleRows()
      items_arr = @scheduled_diligences_grid.selection.getSelectedRows()

      _(items_arr).each (item) =>
        item.is_selected = val
        @scheduled_diligences_grid.selection.selectRow(item)

      @show_bulk_actions = true
      message = ''+items_arr.length+' scheduled diligence projects have been selected'
      @toaster.pop 'success', '', message

    else
      @scheduled_diligences_grid.selection.clearSelectedRows()
      items_arr = @scheduled_diligences.data

      _(items_arr).each (item) =>
        item.is_selected = val
        @scheduled_diligences_grid.selection.unSelectRow(item)

      @show_bulk_actions = false

    @temp_diligences_obj = jQuery.extend(true, {}, @scheduled_diligences)

  toggleSelection: (entity) =>
    if entity.is_selected
      @scheduled_diligences_grid.selection.selectRow(entity)
    else
      @scheduled_diligences_grid.selection.unSelectRow(entity)

    @show_bulk_actions = false
    i = 0
    while i < @scheduled_diligences.data.length
      if @scheduled_diligences.data[i].is_selected
        @show_bulk_actions = true
        break
      i++

    @temp_diligences_obj = jQuery.extend(true, {}, @scheduled_diligences)

  toggleButtonClick: (grid,row) =>
    #Normal row selection is handled by ui grid
    #But grouped rows we have to handle. Following conditions are for that.
    if row.internalRow
      angular.forEach row.treeNode.children,(children) =>     #loop over all the rows inside this group
        children.row.isSelected = false
        #select only visible rows
        if children.row.visible and row.isSelected
          children.row.isSelected = true             #and select all the rows inside that group

    #Below logic is used to select the group header row if all items inside the group are selected.
    else if row.treeNode.parentRow                            #if the row is a child inside a group
      row.treeNode.parentRow.isSelected = true                #Check the group header row
      angular.forEach row.treeNode.parentRow.treeNode.children,(children) =>
        if !children.row.isSelected                           #if any of the group's children are not checked
          row.treeNode.parentRow.isSelected = false           #then uncheck the group header row

    #Get the number of selected rows
    @totalSelectedRecords = grid.api.selection.getSelectedRows().length


    #Show/hide bulk actions depending on the number of selected rows.
    if @totalSelectedRecords > 0
      @show_bulk_actions = true
    else
      @show_bulk_actions = false

  clearDateRange: =>
    @activeDateRange = undefined
    @getDataForDateRange([undefined, undefined])

  getDataForDateRange: (date_range) =>
    @show_bulk_actions = false
    @scheduled_diligences.params.start_date = if date_range[0] then moment(date_range[0]).format('M-D-YYYY') else undefined
    @scheduled_diligences.params.end_date = if date_range[1] then moment(date_range[1]).format('M-D-YYYY') else undefined
    @scheduled_diligences.refresh()

  filterByDateRange: (date_range) =>
    if date_range.value == 'show-all'
      @clearDateRange()
    else
      if date_range.value == 'current-month'
        dateRangeValue = [moment().startOf('month'), moment()]
      else if date_range.value == 'next-month'
        dateRangeValue = [moment().add(1, 'months').startOf('month'), moment().add(1, 'months').endOf('month')]
      else if date_range.value == 'next-three-months'
        dateRangeValue = [moment().add(1, 'months').startOf('month'), moment().add(3, 'months').endOf('month')]

      if (dateRangeValue[0].diff(@dateRangeValue[0], 'days') != 0) || (dateRangeValue[1].diff(@dateRangeValue[1], 'days') != 0)
        @activeDateRange = date_range
        @dateRangeValue = dateRangeValue
        @getDataForDateRange(@dateRangeValue)

  performScheduledDDBulkActions: (action) =>
    selected_diligences = _(@scheduled_diligences_grid.selection.getSelectedRows()).pluck('id')

    if action == 'delete'
      @Restangular.all('v2/diligences/bulk_delete').customPUT(selected_diligences).then =>
        @scheduled_diligences.refresh()
        @show_bulk_actions = false
        @select_all = false
        @toaster.pop 'success', '', 'All the selected scheduled diligence projects have been deleted'

  confirmScheduledDDBulkAction: (action) ->
    if action == 'pause'
      custom_class = 'warning'
      confirm_button_text = 'Pause'
    else if action == 'delete'
      custom_class = 'danger'
      confirm_button_text = 'Delete'
    @SweetAlert.confirm({
        title: "Are you sure you want to #{action} the selected scheduled diligence projects?"
        showLoaderOnConfirm: true
        customClass: custom_class
        focusCancel: true
        confirmButtonText: confirm_button_text
        preConfirm: =>
          @performScheduledDDBulkActions(action)
          swal.close()
      })

  editScheduledDDBulkAction: () ->
    @loading = true;
    selected_diligences = _(@scheduled_diligences_grid.selection.getSelectedRows()).pluck('id');
    scheduled_diligences_updated_data = {
      "diligence_ids": selected_diligences,
      "scheduled_at": moment(@scheduled_diligences_scheduled_date).format('YYYY-MM-DD'),
      "due_at": moment(@scheduled_diligences_due_date).format('YYYY-MM-DD');
    };
    if @scheduled_diligences_scheduled_date && @scheduled_diligences_due_date
      @Restangular.all('diligences/bulk_schedule_diligences').customPUT(scheduled_diligences_updated_data).then =>
        @scheduled_diligences.refresh()
        @show_bulk_actions = false
        @select_all = false
        @show_bulk_edit_actions = false;
        @loading = false;
        @toaster.pop 'success', '', 'All the selected scheduled diligence projects have been updated'

  editScheduledDDBulkActionActive: () ->
    selected_diligences = _(@scheduled_diligences_grid.selection.getSelectedRows()).pluck('id');
    @show_bulk_edit_actions = true;

  closeQuickActions:() ->
    @show_bulk_edit_actions = false;
    @scheduled_diligences_grid.selection.clearSelectedRows();

  canProceedToScheduledDDReviewStep: =>
    can_proceed = false
    @final_schedule_diligences_list = @scheduled_diligences_grid.selection.getSelectedRows()
    # _(@scheduled_diligences.data).each (item) =>
    #   if item.is_selected
    #     @final_schedule_diligences_list.push(item)
    can_proceed = @final_schedule_diligences_list.length > 0

    if !can_proceed
      message = 'Please select at least one diligence project!'
      @toaster.pop 'error', '', message

    can_proceed

  getReviewTemplates: =>
    @diligences = []
    @review_diligence_templates = []
    @request.review_template = {}
    @diligencesCopy = []
    @Restangular.all('review_templates').getList().then (response) =>
      @review_templates = response
      @display_wizard_footer = false
      if @$stateParams.templateId?
        @request.review_template = _(@review_templates).findWhere({id: Number(@$stateParams.templateId)})
        @getDiligences()

  shouldFooterBeVisible: =>
    if @diligences and @diligences.length
      @display_wizard_footer = true
    else
      @display_wizard_footer = false

  setDDType: (type) ->
    if @request.DDTypeDisplayName = 'Pending Requests'
      @all_selected_entities_arr = []
      @all_selected_entities_contacts_arr = []
      @selected_entities = []
    if type == 'dd_scheduled'
      wizard = @WizardHandler.getWizard('new-request-investor-scheduled')
      @request.DDTypeDisplayName = 'Scheduled Requests'
    else if type == 'dd_review'
      @getReviewTemplates()
      wizard = @WizardHandler.getWizard('new-request-review')
      @request.DDTypeDisplayName = 'Analyst Evaluation Project'
    else if type == 'dd_pending'
      wizard = @WizardHandler.getWizard('new-request-investor-pending')
      @request.DDTypeDisplayName = 'Pending Requests'
    else
      wizard = @WizardHandler.getWizard('new-request-investor')
      dd_type_map =
        'dd_scheduled': 'Scheduled Requests'
        'dd_new': 'Pre-investment'
        'dd_ongoing': 'Ongoing Monitoring'
        'dd_event_related': 'Adhoc / Event Related'
        'dd_review': 'Review Diligence'
        'dd_pending': 'Pending Requests'
      @request.DDTypeDisplayName = dd_type_map[type]

    @request['duediligence_type'] = type
    wizard.goToNextStep()
    if @request.DDTypeDisplayName != 'Pending Requests'
      wizard.setFooterVisibility true
    else
      wizard.setFooterVisibility false

  setDDFor: (entity) =>
    if entity != @dd_for
      @selected_entities = []
      @selectedFilters.length = 0
      @selectedSubFilters.length = 0
      @selectedGlobalTernaryOperator = @FILTER_TERNARY_OPERATORS.AND
      @selectedSubGlobalTernaryOperator = @FILTER_TERNARY_OPERATORS.AND
      @display_entity_selection_error = false
      @request.all_entity_flag = false
      @dd_for = entity
      @showVehicles = false
      @showFunds = false
      @resetFilterBasedSelectionAttributes()

  resetFilterBasedSelectionAttributes: =>
    @allFilterTemplateId = null
    @allSubFilterTemplateId = null
    @filterApplied = false
    @subFilterApplied = false
    @unfilteredSelectedEntities = null
    @unfilteredSelectedSubEntities = null
    @entitySearchMap = {}
    @subEntitySearchMap = {}
    @showMainFilterBasedSelection = false
    @showSubFilterBasedSelection = false

  sendScheduledDDRequest: ->
    return unless @scheduled_dd_project_name_form.$valid

    data =
      'email_text': @email_text
      'name': @project_name

    data.entity_ids = _(@final_schedule_diligences_list).pluck('id')
    @Restangular.all('v2/diligences/bulk_invite').customPUT(data)
    .then =>
      @toaster.pop 'success', 'New request has been successfully added', '', 3000
      @$state.go 'app.diligence.projects.activity', type: 'sent'
    , (error) =>
      avoid_error_logging_statuses = @BaseDataService.getAvoidErrorLoggingStatusList()
      if !(error.status in avoid_error_logging_statuses)
        delete error.config.data.email_text
        @Utils.logError('Scheduled request (invite) failed', error)

  getAllProductEntities: =>
    @$http.get("#{@baseUrl}/investments", {params: {
      skip_pagination: true
    }}).then (response) =>
      # response = response
      return response

  getAllFirmEntities: =>
    @Restangular.all('firms/monitor').customGET('', {
      include_contacts: true
      pageNumber: 1
      recordsPerPage: @total_entity_records
    }).then (response) =>
      response = response.results
      return response

  fetchAllEntities: =>
    entities = []
    switch @dd_for
      when 'Product'
        entities = @getAllProductEntities()
      when 'Firm'
        entities = @getAllFirmEntities()
    return entities

  formJSONForEntities: (entities,entity_type) ->
    entities = _(entities).filter (entity) ->
      entity.notification_contacts.length

    entities_temp = []
    _(entities).each (entity) =>
      entity_item = {
        id: entity.id
        notification_contacts: []
        entity_type: entity_type
      }
      _(entity.notification_contacts).each (contact) =>
        entity_item.notification_contacts.push(contact.id)
      if entity_item.notification_contacts.length
        entities_temp.push(entity_item)
    return entities_temp

  generatePageUrl: =>
    pageUrl = ""
    if @dd_for == 'Firm'
      _(@selected_entities).each (entity,index)=>
        pageUrl += "app/firms/#{entity.id}/invite"
        pageUrl += "," if index != @selected_entities.length - 1
    else if @dd_for == 'Product'
      #loop over each response and generate the url for each selected fund
      _(@selected_entities).each (entity,index)=>
        pageUrl += "app/firms/#{entity.firm_id}/funds/#{entity.id}/invite"
        pageUrl += "," if index != @selected_entities.length - 1
      if @showVehicles
        _(@selected_vehicles).each (entity,index)=>
          pageUrl += ",app/firms/#{entity.firm_id}/funds/#{entity.fund_id}/vehicles/#{entity.id}/invite"
      if @showFunds
        _(@selected_funds).each (entity,index)=>
          pageUrl += ",app/firms/#{entity.firm_id}/strategies/#{entity.parent_id}/funds/#{entity.id}/invite"
    pageUrl

  generateVehicleRequest:(vehicles,entity,templates)=>
    entity_item = {
      id: entity.id
      notification_contacts: []
      entity_type: 'Vehicle'
    }
    _(templates).each (template)=>
      vehicleRequest = angular.copy entity_item
      vehicleRequest.template_id = template.id
      vehicles.push(vehicleRequest)

  formVehiclesArray : =>
    vehicles = []
    if @showSubFilterBasedSelection
      if @selectedSubGlobalTernaryOperator == @FILTER_TERNARY_OPERATORS.AND
        keys = Object.keys(@subEntitySearchMap)
        searchMap = if keys.length > 0 then [@subEntitySearchMap[keys[0]]] else []
      else
        searchMap = @subEntitySearchMap
      _(searchMap).each (filter)=>
        if !filter.hasDuplicate
          if @selectedSubGlobalTernaryOperator == @FILTER_TERNARY_OPERATORS.AND
            template = @allSubFilterTemplateId
          else
            template = filter.template_id
          _(filter.data).each (entity)=>
            @generateVehicleRequest(vehicles, entity, template) if entity.selected

      if @unfilteredSelectedSubEntities and @unfilteredSelectedSubEntities.data.length > 0
        _(@unfilteredSelectedSubEntities.data).each (entity)=>
          @generateVehicleRequest(vehicles, entity, @unfilteredSelectedSubEntities.template_id)

    else
      _(@selected_vehicles).each (vehicle) =>
        @generateVehicleRequest(vehicles, vehicle, @request.vehicleTemplate)
    vehicles

  generateFundRequest:(funds,entity,templates)=>
    entity_item = {
      id: entity.id
      notification_contacts: []
      entity_type: 'fund'
    }
    angular.forEach entity.notification_contacts, (contact) =>
      if !contact.is_removed
        entity_item.notification_contacts.push contact.id
    _(templates).each (template)=>
      fundRequest = angular.copy entity_item
      fundRequest.template_id = template.id
      funds.push(fundRequest)

  formFundsArray : =>
    funds = []
    if @showSubFilterBasedSelection
      if @selectedSubGlobalTernaryOperator == @FILTER_TERNARY_OPERATORS.AND
        keys = Object.keys(@subEntitySearchMap)
        searchMap = if keys.length > 0 then [@subEntitySearchMap[keys[0]]] else []
      else
        searchMap = @subEntitySearchMap
      _(searchMap).each (filter)=>
        if !filter.hasDuplicate
          if @selectedSubGlobalTernaryOperator == @FILTER_TERNARY_OPERATORS.AND
            template = @allSubFilterTemplateId
          else
            template = filter.template_id
          _(filter.data).each (entity)=>
            @generateFundRequest(funds, entity, template) if entity.selected

      if @unfilteredSelectedSubEntities and @unfilteredSelectedSubEntities.data.length > 0
        _(@unfilteredSelectedSubEntities.data).each (entity)=>
          @generateFundRequest(funds, entity, @unfilteredSelectedSubEntities.template_id)

    else
      _(@selected_funds).each (fund) =>
        @generateFundRequest(funds, fund, @request.productsTemplate)

    funds

  sendDueDiligenceRequest: ->
    return unless @project_name_form.$valid

    unless @accept_confidential_agreement
      @SweetAlert.error
        'title': 'Confidentiality Agreement'
        'text': 'Please agree with the binding conditions by clicking the checkbox before you can send this request'
      return

    data =
      'diligence_reason': (@request.event_trigger or {}).id
      'diligence_type': @request.duediligence_type
      'as_of_date' : @$filter('date')(@request.as_of_date, 'MM-dd-yyyy')
      'due_at': @$filter('date')(@request.due_at, 'MM-dd-yyyy')
      'email_text': @email_text
      'is_internal': @request.is_internal
      'touser_id': (@request.fund or {}).userID
      'name': @project_name
      'from_email': @selected_sender_email if not @request.is_internal
      'cc_emails': @selected_cc_email_list.join(',') if not @request.is_internal
      'bcc_emails': @selected_bcc_email_list.join(',') if not @request.is_internal
      'enable_presubmission_review': @firm_preferences.enable_Review_Workflow
      'enable_postsubmission_review': @firm_preferences.enable_Review_Workflow
      'internal_notification_contacts': []

    data.assign_owner_contacts = false
    if @selected_entities_temp.length > @firm_preferences.threshold_for_approval_flow && @firm_preferences.enable_approval_flow_information_request
      data.approver_ids = @assignedApprovers
      data.is_approval_required = true
    else
      data.approver_ids = []
      data.is_approval_required = false

    if @saveAsDraft
      data.is_draft = true
      @saveAsDraft = false
    else
      data.is_draft = false

    if !@request.is_internal
      data.internal_notification_contacts = _(@internalSubscribers).chain().filter((subscriber)=>
        subscriber.type == 'user'
      ).pluck('id')
      data.function_ids = _(@internalSubscribers).chain().filter((subscriber)=>
        subscriber.type == 'function'
      ).pluck('id')

      if @autoSubscribeOwners
        data.assign_owner_contacts = true

    # if @dd_for == 'Product' and @showVehicles
    #   data.sub_template_id = @request.vehicleTemplate.id

    if !@request.all_entity_flag

      data.entities = @selected_entities_temp
      data.entities = data.entities.concat(@formVehiclesArray()) if @dd_for == 'Product' and @showVehicles
      data.entities = data.entities.concat(@formFundsArray()) if @dd_for == @hierarchyConstants.Title and @showFunds

      @postDueDiligenceRequest(data)

    else if @request.all_entity_flag
      @fetchAllEntities().then (response) =>
        if @dd_for == 'Product'
          entity_type = 'Fund'
        else if @dd_for == @hierarchyConstants.Title
          entity_type = 'Strategy'
        else if @dd_for == 'Firm'
          entity_type = 'Firm'
        else
          entity_type = 'Vehicle'
        data.entities = @formJSONForEntities(response,entity_type)
        data.entities = data.entities.concat(@formVehiclesArray()) if @dd_for == 'Product' and @showVehicles
        data.entities = data.entities.concat(@formFundsArray()) if @dd_for == @hierarchyConstants.Title and @showFunds

        @postDueDiligenceRequest(data)

  aprrovePendingRequest: ->
    unless @accept_confidential_agreement
      @SweetAlert.error
        'title': 'Confidentiality Agreement'
        'text': 'Please agree with the binding conditions by clicking the checkbox before you can send this request'
      return

    @ModalFactory.invokeModal 'confirm_pending_request',
      success: (message) =>
        @requestAuthorJsonData.is_approval_required = false
        @requestAuthorJsonData.draft_id = @selectedRequestDraftId
        @requestAuthorJsonData.approver_notes = message
        @requestAuthorJsonData.draft_status = 'Approved'
        @postDueDiligenceRequest(@requestAuthorJsonData)


  rejectPendingRequest: ->
    @ModalFactory.invokeModal 'reject_pending_request',
      success: (message) =>
        @requestAuthorJsonData.is_approval_required = false
        @requestAuthorJsonData.draft_id = @selectedRequestDraftId
        @requestAuthorJsonData.approver_notes = message
        @requestAuthorJsonData.draft_status = 'Rejected'
        @postDueDiligenceRequest(@requestAuthorJsonData)

  postDueDiligenceRequest: (data) ->
    @toastInstance = @toaster.pop({type: 'info', title: 'Processing Request...', body: 'Please wait while the request is being processed.', timeout: 0})
    pageUrl = @generatePageUrl() if not (!@permissions_enabled or @Utils.isAdmin() or @Utils.isOwner())
    @DueDiligenceDataservice.createNewDDV2(data,pageUrl)
    .then (response) =>
      @toaster.clear(@toastInstance)
      if @request.is_internal && !data.is_draft && !data.is_approval_required && data.draft_status != 'Rejected'
        @toaster.pop 'success', 'New request has been successfully added', '', 3000
        @$state.go 'app.diligence.project.questionnaire', diligenceId: response.id
      else if (data.is_draft || data.is_approval_required) && data.draft_status != 'Rejected'
        @toaster.pop 'success', 'New request has been successfully added', '', 3000
        if @$stateParams.type == "pending_requests"
          @$state.reload()
        else
          @$state.go '.', { type: 'pending_requests' },{ reload: true }
        # @getReviewTemplates()
        # wizard = @WizardHandler.getWizard('new-request-investor-pending')
        # @request.DDTypeDisplayName = 'Pending Requests'
        # @request['duediligence_type'] = 'dd_pending'
        # wizard.goToNextStep()
      else if data.draft_status == 'Rejected'
        @toaster.pop 'success', 'New request has been successfully rejected', '', 3000
        wizard = @WizardHandler.getWizard('new-request-investor-pending')
        wizard.goToPreviousStep()
      else
        @toaster.pop 'success', 'New request has been successfully added', '', 3000
        @$state.go 'app.diligence.projects.activity', type: 'sent'
    , (error) =>
      @toaster.clear(@toastInstance)
      avoid_error_logging_statuses = @
      .getAvoidErrorLoggingStatusList()
      if !(error.status in avoid_error_logging_statuses)
        delete error.config.data.email_text
        @Utils.logError('Information request (invite) failed', error)

  clearSelection: (grid,column) =>
    grid.api.selection.clearSelectedRows() if grid.api.selection

  clearGrouping: (grid,column)=>
    grid.api.grouping.clearGrouping()
    @clearSelection(grid,column) if @clearSelection

  onRowSelect: (request_data) =>
    @goToRequestDetailPage(request_data.row.entity.id)

  goToRequestDetailPage: (requestId)=>
    @isPendingOrDraftRequestSelected = true
    @is_pending_data_loaded = false
    @selectedRequestDraftId = requestId
    @Restangular.one('duediligence_drafts/pending_requests/'+requestId).customGET().then (response) =>
      @requestDataById = response
      if @requestDataById.approver_ids.indexOf(@currentUserId) != -1
        @currentUserIsApprover = true
      else
        @currentUserIsApprover = false
      for entity,eIndex in @requestDataById.entities
        @requestDataById.entities[eIndex]['templates_list'] = []
        @requestDataById.entities[eIndex]['contacts_list'] = []
        for template,index in @requestDataById.entities[eIndex].templates
          @requestDataById.entities[eIndex].templates_list.push template.name
        for contact,index in @requestDataById.entities[eIndex].contacts
          @requestDataById.entities[eIndex].contacts_list.push contact.fullName
      @is_pending_data_loaded = true
      author_json = response.author_json
      @requestAuthorJsonData = JSON.parse(author_json)
      for key of @requestAuthorJsonData
        if key.toLowerCase() != key
          @requestAuthorJsonData[key.toLowerCase()] = @requestAuthorJsonData[key]
          delete @requestAuthorJsonData[key]
      if response.approver_json
        approver_json = response.approver_json
        @requestApproverJsonData = JSON.parse(approver_json)
        for key of @requestApproverJsonData
          if key.toLowerCase() != key
            @requestApproverJsonData[key.toLowerCase()] = @requestApproverJsonData[key]
            delete @requestApproverJsonData[key]
      entities = JSON.stringify(response.entities)
      entities = entities.replace(/\"contacts\":/g, "\"notification_contacts\":")
      @selected_entities = JSON.parse(entities)
      wizard = @WizardHandler.getWizard('new-request-investor-pending')
      wizard.goToNextStep()
      wizard.setFooterVisibility false
      @setEntities()

  getFormattedDate: (date)=>
    return new Date(date)

  goBackToRequestsList:()->
    wizard = @WizardHandler.getWizard('new-request-investor-pending')
    wizard.goToPreviousStep()

  getRequestStatus:(status) =>
    if @currentUserIsApprover && status == 'InProgress'
        return 'Pending approval'
    else if !@currentUserIsApprover  && status == 'InProgress'
        return 'Waiting for approval'
    else if status == 'Rejected'
        return 'Rejected'

  viewDisclaimer: =>
    @ModalFactory.invokeModal 'view_approver_notes',
      resolve:
        approver_notes: =>  @requestApproverJsonData.approver_notes

  formatTagsTooltip: (list) ->
    if list and list.length > 1
      return _(list).tail().join(', ')
