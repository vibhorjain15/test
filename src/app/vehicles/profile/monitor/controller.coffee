class VehicleProfileMonitorController extends BaseController

  @register 'VehicleProfileMonitorController'

  @inject '$interval', '$stateParams', 'Restangular', 'previousState', '$q', '$state', '$scope', '$filter', 'toaster',
    'SweetAlert', 'Utils', 'BaseDataService', 'VehicleDataService', 'ModalFactory', '$timeout', 'MentionsFactory', 'DocumentDataservice','keywordConstants', 'statusLabel','angularEnabled'

  initialize: ->
    @vehicleId = @$stateParams.vehicleId
    @entity_type = @Utils.getDisplayEntityType(@keywordConstants.Vehicle)
    @is_manager = @Utils.isManager()
    @is_investor = @Utils.isInvestor()
    @is_admin = @Utils.isAdmin()
    @VehicleIdType = 1217
    @$scope.getVehicle().then (vehicle) =>
      @vehicle = vehicle
      @init()

    @current_user = @Utils.getCurrentUser()
    @is_freeSubscription = @Utils.isFreeSubscription()

    if @previousState.name?
      @previousUrl = @$state.href(@previousState.name, @previousState.params)
    else
      @previousUrl = @$state.href('app.home')

    @investment = {}
    @tag_list = {}

    @maxDate = new Date()
    @due_date = new Date()

    @notesOptions=
      fullscreen:true
      undoRedo:true
      height:180


    #@Restangular.all('share_classes').getList(vehicleId: @vehicleId).then (response) =>
    #  @share_classes = response

  init: =>
    @getFirmPref()
    #@getProfile(@vehicleId)
    @getTeamMembers()
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

    @Restangular.all('tag_assignments').getList(entity_type: @entity_type, entity_id: @vehicleId).then (response) =>
      @tags = response
      @sortTags()

    @DocumentDataservice.getAttachmentAssignmentCount(@entity_type, @vehicleId).then (response) =>
      @document_count = response.count

  applyMethod: (startDate,endDate)=>
    @getDiligenceHistory(startDate,endDate)
    @dateRangeForDirectives = {
      startDate: startDate
      endDate: endDate
    }

  getAssignedFunctions: =>
    @Restangular.all('function_assignments').customGET('', {entity_id : @vehicleId, entity_type: "Vehicle"}).then (response) =>
      @assignedFunctions = response

  getCustomFields: =>
    @Restangular.all('service/dvapi_service/get_custom_fields_data').post({entity_id : @vehicleId, entity_type: @VehicleIdType, schema_type: 'vehicle', sub_entity_id: 0}).then (response) =>
      @customFields = response.data

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

  getDiligenceHistory: (startDate,endDate)=>
    @loading_history = true
    @Restangular.all('diligences').all('history').getList({entity_id: @vehicleId, entity_type: @entity_type, start_date: startDate,end_date: endDate}).then (response) =>
      @diligences = response
      @loading_history = false

  sortTags: () =>
    @tags = _(@tags).sortBy((tag) =>
      tag.name.toLowerCase()
    )

  addTask: =>
    @ModalFactory.invokeModal 'manage_task',
      resolve:
        task: =>
          entity_type: @entity_type
          entity_id: @vehicleId
      success: =>
        @refreshTasksList = !@refreshTasksList

  editVehicle: =>
    @ModalFactory.invokeModal 'manage_vehicle',
      resolve:
        vehicle: => @vehicle
        edit_mode: true
      success: (response) =>
        @vehicle = response
        @getAssignedFunctions()

  findName: (id) =>
    member = _.findWhere(@teamMembers,{id:id})
    return member.fullname

  setActionType: (index) =>
    @selected_action_type = @action_types[index]
    @initAddActivityForm()

  setTagsAvailability: (response) ->
    @tagsAvailable ||= !!response.length

  getTeamMembers: () =>
    @BaseDataService.getTeamMembers().then (teamMembers) =>
      @teamMembers = _(teamMembers).map (teamMember) ->
        teamMember.fullname = _([teamMember.firstName, teamMember.lastName]).compact().join(' ')
        teamMember

  activityAdditionSuccessful: (message) =>
    @saving_activity = false
    @toaster.pop 'success', '', message
    @initAddActivityForm()

  getMatcher: (collection) ->
    ($query) ->
      return collection unless $query

      regex = new RegExp($query, 'i')

      _(collection).filter((item) -> regex.test item.name)



  saveTags: ->
    categories = ['conviction_levels', 'assets', 'theses', 'geographies','watchlists']
    tags = _(categories).reduce(((res, category) =>
      serialized = _(@investment[category] or []).pluck('id')

      _(res).concat serialized
    ), [])

    if @tag_investment_form.$valid and (tags.length or @tags.length)
      @saving_tags = true

      params =
        entity_id: @vehicleId
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
          @Utils.logError('Tags assignment failed for funds', error)

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

    @sidebarTemplate = 'funds/profile/monitor/tag/template.html'
    @sidebarTitle = 'Set Tags'
    @sidebarContent = 'tag'
    @displaySidebarPanel = true

  filterTeamMembers: (term) =>
    @filteredTeamMembers = @MentionsFactory.getFilteredMembers(term)

  redirectToFirmSettings: ->
    @$state.go 'app.firm.settings.all_tags'

  getDisplayName: (user) =>
    @$timeout =>
      @tinymceEditor.insertContent('');
    , 300
    return @MentionsFactory.getDisplayName(user, true)

  deactivateVehicle: () =>

    @SweetAlert.confirm({
      title: 'Are you sure you want to deactivate this vehicle?'
      confirmButtonText: 'Yes, deactivate!'
      showLoaderOnConfirm: true
      focusCancel: true
      preConfirm: =>
        @VehicleDataService.deactivateVehicle(@vehicle.firm_id, @vehicle.fund_id, @vehicle.id).then (=>
          swal.close()
          @vehicle.is_active = false
          @toaster.pop 'success', '', "Vehicle marked inactive"
        ), ((error) =>
          swal.close()
        )
    })

  manageCustomfield: =>
    @ModalFactory.invokeModal 'manage_custom_fields',
      resolve:
        entityTypeId: => @VehicleIdType
        entityType: => @entity_type
        entityId: => @vehicleId
        customFields: => angular.copy @customFields
        customUrl: => 'vehicle_tags'
      success: (response)=>
        @customFields = response.data
