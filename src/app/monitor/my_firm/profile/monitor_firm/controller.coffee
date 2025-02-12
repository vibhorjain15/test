class MyFirmProfileMonitorController extends BaseController

  @register 'MyFirmProfileMonitorController'

  @inject 'Restangular', '$q', '$state', '$scope', '$filter', 'toaster', 'SweetAlert', 'Utils', 'BaseDataService', 'ModalFactory', 'MentionsFactory',
    '$timeout', '$tinymceMentionsPlaceholderText', 'FirmDataservice', 'DocumentDataservice','angularEnabled'

  initialize: ->
    @firmId = @Utils.getCurrentFirm().id
    @entity_type = 'Firm'
    @note_id = null
    @FirmIdType = 1220

    @$scope.getFirm().then (firm) =>
      @firm = firm
      @init()
      domain = @firm.website
      @firm.search_web_url = if domain then 'http://google.com/search?q=' + @firm.name + '+' + domain else 'http://google.com/search?q=' + @firm.name

    @is_admin = @Utils.isAdmin()
    @current_user = @Utils.getCurrentUser()
    @is_freeSubscription = @Utils.isFreeSubscription()
    @is_investor = @Utils.isInvestor()
    @investment = {}
    @tag_list = {}
    @notesOptions=
      fullscreen:true
      undoRedo:true
      height:180


    @maxDate = new Date()
    @due_date = new Date()

  init: =>
    functionPromises = []
    @getFirmPref()
    @getProfile(@firmId)
    @getTeamMembers()
    @getHeadquarter(@firmId)
    @getCustomFields()
    @getAssignedFunctions()

    api_callback_map =
      conviction: 'filterConvictionLevels'
      assettype: 'filterAssets'
      thesis: 'filterTheses'
      geography: 'filterGeographies'
      watchlist: 'filterWatchLists'

    promises = _(api_callback_map).each((value, key) =>
      @Restangular.all(key).getList().then((response) =>
        @tag_list[key] = response
        @[value] = @getMatcher(response)
        @setTagsAvailability response
      ).$promise
    )
    @$q.all(promises).then(=> @is_data_loaded = true)

    @Restangular.all('tag_assignments').getList(entity_type: @entity_type, entity_id: @firmId).then (response) =>
      @tags = response
      @sortTags()


    @FirmDataservice.getRelatedContactCount(@firmId).then (response) =>
      @contact_count = response

    @DocumentDataservice.getAttachmentAssignmentCount(@entity_type, @firmId).then (response) =>
      @document_count = response.count

    @FirmDataservice.getRelatedEntities(@firmId).then (response) =>
      @product_count = response.length

  sortTags: () =>
    @tags = _(@tags).sortBy((tag) =>
      tag.name.toLowerCase()
    )

  applyMethod: (startDate,endDate)=>
    @getDiligenceHistory(startDate,endDate)
    @dateRangeForDirectives = {
      startDate: startDate
      endDate: endDate
    }

  getFirmPref: =>
    @loading_prefs = true
    @Restangular.all('firm_preferences').customGET().then (response) =>
      @customDateFilter = @Utils.getPredefinedDateRanges(response.default_daterange_months)
      @customDateFilter.selectedRange = @Utils.getDateRanges()[response.default_daterange_months].label

      if @customDateFilter.selectedRange == 'No Filter'
        @getDiligenceHistory(null,null)
        @dateRangeForDirectives = {
          startDate: null
          endDate: null
        }
      else
        @getDiligenceHistory(@Utils.formatDatetime(@customDateFilter.startDate),@Utils.formatDatetime(@customDateFilter.endDate))
        @dateRangeForDirectives = {
          startDate: @Utils.formatDatetime(@customDateFilter.startDate)
          endDate: @Utils.formatDatetime(@customDateFilter.endDate)
        }
      @loading_prefs = false

  getAssignedFunctions: =>
    @Restangular.all('function_assignments').customGET('', {entity_id : @firmId, entity_type: "Firm"}).then (response) =>
      @assignedFunctions = response

  getCustomFields: =>
    @Restangular.all('service/dvapi_service/get_custom_fields_data').post({entity_id : @firmId, entity_type: @FirmIdType, schema_type: 'firm', sub_entity_id: 0}).then (response) =>
      @customFields = response.data

  getDiligenceHistory: (startDate,endDate)=>
    @loading_history = true
    @Restangular.all('diligences').all('history').getList({entity_id: @firmId, entity_type: @entity_type, start_date: startDate,end_date: endDate}).then (response) =>
      @diligences = response
      @loading_history = false

  getHeadquarter: (id) ->
    @BaseDataService.getAddresses(
      entity_id: id
      entity_type: @entity_type
      is_headquarter: true
    ).then (response) =>
      @address = response[0]
      @getCountries()

  getCountries: =>
    @Restangular.all('country').getList().then (response) =>
      @countries = response
      @address.country_name = @getCountryNameFromId(@address.country)

  getCountryNameFromId: (id) =>
    country = _(@countries).findWhere(id: id)
    return (if country then country.value else '')

  findName: (id) =>
    member = _.findWhere(@teamMembers,{id:id})
    return member.fullname


  setTagsAvailability: (response) ->
    @tagsAvailable ||= !!response.length

  getTeamMembers: () =>
    @BaseDataService.getTeamMembers().then (teamMembers) =>
      @teamMembers = _(teamMembers).map (teamMember) ->
        teamMember.fullname = _([teamMember.firstName, teamMember.lastName]).compact().join(' ')
        teamMember

  addTask: =>
    @ModalFactory.invokeModal 'manage_task',
      resolve:
        task: =>
          entity_type: @entity_type
          entity_id: @firmId
          parent_entity: {entity_id: @firmId, entity_type: 'Firm'}
      success: =>
        @refreshTasksList = !@refreshTasksList

  triggerWorkflow: =>
    @ModalFactory.invokeModal 'trigger_workflow',
      resolve:
        workflow: =>
          entity_type: @entity_type
          entity_id: @firmId
          name: @firm.name

  getProfile: (firmId) =>
    @FirmDataservice.getProfileQuestionnaires(firmId).then (response) =>
      @profiles = response

  addProfile: =>
    @ModalFactory.invokeModal 'add_ddq',
      resolve:
        entity_id: => @firm.id
        entity_type: => @entity_type
        entity_name: => @firm.name
        type: => 'dd_profile'

  addInternalDDQ: =>
    @ModalFactory.invokeModal 'add_ddq',
      resolve:
        entity_id: => @firm.id
        entity_type: => @entity_type
        entity_name: => @firm.name
        type: => 'dd_new'

  filterTeamMembers: (term) =>
    @filteredTeamMembers = @MentionsFactory.getFilteredMembers(term)

  getDisplayName: (user) =>
    @$timeout =>
      @tinymceEditor.insertContent('');
    , 300
    return @MentionsFactory.getDisplayName(user, true)

  openAttachmentModal: (id) ->
    @ModalFactory.invokeModal 'view_attachments',
      resolve:
        email_id : => id

  saveTags: ->
    categories = ['conviction_levels', 'assets', 'theses', 'geographies','watchlists']
    tags = _(categories).reduce(((res, category) =>
      serialized = _(@investment[category] or []).pluck('id')

      _(res).concat serialized
    ), [])
    if @tag_investment_form.$valid and (tags.length or @tags.length)
      @saving_tags = true

      params =
        entity_id: @firmId
        entity_type: @entity_type
        tags: tags
      @Restangular.all('tag_assignments').post(params)
      .then (response) =>
        message = 'Tags have been assigned!'
        @toaster.pop 'success', '', message, 5000
        @saving_tags = false
        @displaySidebarPanel = false
        @tags = response
        @sortTags()
        @investment = {}
      , (error) =>
        @toaster.pop 'error', '', 'Something went wrong. Please try again.'
        @saving_tags = false
        avoid_error_logging_statuses = @BaseDataService.getAvoidErrorLoggingStatusList()
        if !(error.status in avoid_error_logging_statuses)
          delete error.config.data.email_text
          @Utils.logError('Tags assignment failed for firm', error)

  displayTagsController: ->
    value_map =
      'AssetAllocation': 'assettype'
      'Conviction': 'conviction'
      'InvestmentThesis': 'thesis'
      'Geography': 'geography'
      'WatchList': 'watchlist'
    selection_map =
      'AssetAllocation': 'assets'
      'InvestmentThesis': 'theses'
      'Conviction': 'conviction_levels'
      'Geography': 'geographies'
      'WatchList': 'watchlists'

    _(['AssetAllocation', 'InvestmentThesis', 'Geography', 'Conviction', 'WatchList']).each (type) =>
      @investment[selection_map[type]] = _(@tag_list[value_map[type]]).filter((tag) =>
        !!_(@tags).findWhere(id: tag.id)
      )

    @sidebarTemplate = 'firms/profile/monitor/tag/template.html'
    @sidebarTitle = 'Set Tags'
    @sidebarContent = 'tag'
    @displaySidebarPanel = true

  redirectToFirmSettings: ->
    @$state.go 'app.firm.settings.all_tags'

  getMatcher: (collection) ->
    ($query) ->
      return collection unless $query

      regex = new RegExp($query, 'i')

      _(collection).filter((item) -> regex.test item.name)

  editFirm: =>
    @ModalFactory.invokeModal 'manage_firm',
      resolve:
        firm : => @firm
        source: => "my_firm"
        firm_name: => @firm.name
      success: (firm) =>
        @firm = firm
        domain = @firm.website
        @firm.search_web_url = if domain then 'http://google.com/search?q=' + @firm.name + '+' + domain else 'http://google.com/search?q=' + @firm.name
        @getAssignedFunctions()
      dismiss: (dismissObj) =>
        if dismissObj?
          @firm = dismissObj



  deactivateFirm: () =>
    @SweetAlert.confirm({
      title: 'Are you sure you want to deactivate this firm?'
      confirmButtonText: 'Yes, deactivate!'
      focusCancel: true
      showLoaderOnConfirm: true
      preConfirm: =>
        params =
          entity_id: @firmId
          entity_type: @entity_type
        @Restangular.all('firm_relationships').customDELETE(null, params).then =>
          @firm.active = false
          @toaster.pop 'success', '', "Firm marked inactive"
        .finally => swal.close()
    })

  getSummarySnapshot: () =>
    @ModalFactory.invokeModal 'view_summary',
      resolve:
        entity: => @firm
        entity_type: => @entity_type

  addMeeting: ->
    @ModalFactory.invokeModal 'manage_event',
      resolve:
        entity_type : => @entity_type
        entity_id : => @firmId
      success: (event) =>
        @getMeetings()

  displayTagRemovalConfirmation: (tag, index) ->
    @SweetAlert.confirm({
      title: "Are you sure you want to remove \"#{tag.name}\"?"
      confirmButtonText: 'Yes'
      focusCancel: true
    }).then (isConfirm) =>
      @removeTag(tag, index) if isConfirm.value and isConfirm.value == true

  removeTag: (tag, index)->
    @Restangular.all('tag_assignments').remove(entity_type: @entity_type, entity_id: @firmId, tag_id: tag.id).then =>
      @toaster.pop 'success', 'Tag removed successfully!'
      @tags.splice index, 1

  manageCustomfield: =>
    @ModalFactory.invokeModal 'manage_custom_fields',
      resolve:
        entityTypeId: => @FirmIdType
        entityType: => @entity_type
        entityId: => @firmId
        customFields: => angular.copy @customFields
        customUrl: => 'firm_tags'
      success: (response)=>
        @customFields = response.data
