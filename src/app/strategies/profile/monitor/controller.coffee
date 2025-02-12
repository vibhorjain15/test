class StrategyProfileMonitorController extends BaseController

  @register 'StrategyProfileMonitorController'

  @inject '$interval', '$stateParams', 'Restangular', 'previousState', '$q', '$state', '$scope', '$filter', 'toaster',
    'SweetAlert', 'Utils', 'BaseDataService', 'StrategyDataservice', 'DueDiligence', 'ModalFactory', '$anchorScroll', '$location', '$timeout', 'MentionsFactory', '$tinymceMentionsPlaceholderText', 'DocumentDataservice', 'statusLabel','angularEnabled'

  initialize: ->
    @strategyId = @$stateParams.strategyId
    @entity_type = 'Strategy'
    @$scope.getStrategy().then (strategy) =>
      @strategy = strategy
      @init()

    @is_admin = @Utils.isAdmin()
    @StrategyIdType = 5004
    @is_investor = @Utils.isInvestor()
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


    #@Restangular.all('share_classes').getList(StrategyId: @strategyId).then (response) =>
    #  @share_classes = response

  init: =>
    @getFirmPref()
    @getProfile(@strategyId)
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

    @Restangular.all('tag_assignments').getList(entity_type: @entity_type, entity_id: @strategyId).then (response) =>
      @tags = response
      @sortTags()

    @StrategyDataservice.getRelatedContactCount(@strategyId).then (response) =>
      @contact_count = response

    @DocumentDataservice.getAttachmentAssignmentCount(@entity_type, @strategyId).then (response) =>
      @document_count = response.count

  applyMethod: (startDate,endDate)=>
    @getDiligenceHistory(startDate,endDate)
    @dateRangeForDirectives = {
      startDate: startDate
      endDate: endDate
    }

  getCustomFields: =>
    @Restangular.all('service/dvapi_service/get_custom_fields_data').post({entity_id : @strategyId, entity_type: @StrategyIdType, schema_type: 'strategy', sub_entity_id: 0}).then (response) =>
      @customFields = response.data

  getAssignedFunctions: =>
    @Restangular.all('function_assignments').customGET('', {entity_id : @strategyId, entity_type: @entity_type}).then (response) =>
      @assignedFunctions = response

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
    @Restangular.all('diligences').all('history').getList({entity_id: @strategyId, entity_type: @entity_type, start_date: startDate,end_date: endDate}).then (response) =>
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
          entity_id: @strategyId
          parent_entity: {entity_id: @strategyId, entity_type: 'Strategy'}
      success: =>
        @refreshTasksList = !@refreshTasksList

  findName: (id) =>
    member = _.findWhere(@teamMembers,{id:id})
    return member.fullname

  setActionType: (index) =>
    @selected_action_type = @action_types[index]
    @initAddActivityForm()

  setTagsAvailability: (response) ->
    @tagsAvailable ||= !!response.length

  getProfile: (strategyId) =>
    @StrategyDataservice.getProfileQuestionnaires(strategyId).then (response) =>
      @profiles = response

  getTeamMembers: () =>
    @BaseDataService.getTeamMembers().then (teamMembers) =>
      @teamMembers = _(teamMembers).map (teamMember) ->
        teamMember.fullname = _([teamMember.firstName, teamMember.lastName]).compact().join(' ')
        teamMember

  addProfile: =>
    @ModalFactory.invokeModal 'add_ddq',
      resolve:
        entity_id: => @strategy.id
        entity_type: => @entity_type
        entity_name: => @strategy.name
        type: => 'dd_profile'

  addInternalDDQ: =>
    @ModalFactory.invokeModal 'add_ddq',
      resolve:
        entity_id: => @strategy.id
        entity_type: => @entity_type
        entity_name: => @strategy.name
        type: => 'dd_new'
        investorRequest: => true

  activityAdditionSuccessful: (message) =>
    @saving_activity = false
    @toaster.pop 'success', '', message
    @initAddActivityForm()

  #recordInvestment: ->
  #  if @record_investment_form.$valid
  #    @saving_investment = true
  #    @investment.ActivityDateTime = @$filter('date')(@investment.ActivityDateTime, 'MM-dd-yyyy')
  #    @Restangular.one('strategies', @strategyId).all('invest').post(@investment).then =>
  #      message = 'Investment has been recorded!'
  #      @saving_investment = false
  #      @toaster.pop 'success', '', message, 5000
  #      @displaySidebarPanel = false

  scheduleDiligence: ->
    if @schedule_diligence_form.$valid
      @saving_schedule = true
      @params =
        'entities': [{'id':@strategyId,'entity_type': @entity_type}]
        'is_internal': false
        'investor_ids': []
        'diligence_type': 'dd_ongoing'
        'status': 'Scheduled'
        'template_id': @template_id
        'scheduled_for': getScheduledDate(@frequency)

      @Restangular.all('v2/diligences').post(@params).then(response) =>
        message = 'Monitoring schedule has been set!'
        @saving_schedule = false
        @toaster.pop 'success', '', message, 5000
        @displaySidebarPanel = false
        @diligences.unshift response

  getMatcher: (collection) ->
    ($query) ->
      return collection unless $query

      regex = new RegExp($query, 'i')

      _(collection).filter((item) -> regex.test item.name)

  getScheduledDate: (frequency) ->
    if frequency is 'Monthly'
      return new Date() + 30
    else if frequency is 'Quarterly'
      return new Date() + 90


  saveTags: ->
    categories = ['conviction_levels', 'assets', 'theses', 'geographies','watchlists']
    tags = _(categories).reduce(((res, category) =>
      serialized = _(@investment[category] or []).pluck('id')

      _(res).concat serialized
    ), [])

    if @tag_investment_form.$valid and (tags.length or @tags.length)
      @saving_tags = true

      params =
        entity_id: @strategyId
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
          @Utils.logError('Tags assignment failed for strategies', error)

  openAttachmentModal: (id) ->
    @ModalFactory.invokeModal 'view_attachments',
      resolve:
        email_id : => id

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

    @sidebarTemplate = 'strategies/profile/monitor/tag/template.html'
    @sidebarTitle = 'Set Tags'
    @sidebarContent = 'tag'
    @displaySidebarPanel = true

  removeSchedule: (diligence) ->
    @SweetAlert.confirm({
      title: 'Are you sure you want to remove this schedule?'
      confirmButtonText: 'Yes, Please!'
      showLoaderOnConfirm: true
      focusCancel: true
      preConfirm: =>
        @Restangular.one('v2/Diligences', diligence.id).remove().then =>
          message = 'Due Diligence was unscheduled successfully'
          @diligences.splice @diligences.indexOf(diligence.id), 1
          @toaster.pop 'success', '', message, 5000
        .finally => swal.close() #until this is resolved https://github.com/oitozero/ng@SweetAlert/commit/863ac0af581b0f7b551b9ecf0cece96d2b077eb4
    })


  #displayRecordController: ->
  #  @sidebarTemplate = 'strategies/profile/monitor/record/template.html'
  #  @sidebarTitle = 'Record Investment'
  #  @sidebarContent = 'record'
  #  @displaySidebarPanel = true

  displayScheduleController: ->

    @Restangular.all('templates').getList().then (response) =>
      @templates = response

    @Restangular.all('frequency').getList().then (response) =>
      @frequencies = response

    @sidebarTemplate = 'strategies/profile/monitor/schedule/template.html'
    @sidebarTitle = 'Schedule Diligence'
    @sidebarContent = 'schedule'
    @displaySidebarPanel = true


  redirectToFirmSettings: ->
    @$state.go 'app.firm.settings.all_tags'

  filterTeamMembers: (term) =>
    @filteredTeamMembers = @MentionsFactory.getFilteredMembers(term)

  getDisplayName: (user) =>
    @$timeout =>
      @tinymceEditor.insertContent('');
    , 300
    return @MentionsFactory.getDisplayName(user, true)

  editStrategy: =>
    @ModalFactory.invokeModal 'manage_master_fund',
      resolve:
        strategy : => @strategy
        source : => 'monitor'
      success: (strategy) =>
        @strategy = strategy
        @getAssignedFunctions()
      dismiss: (dismissObj) =>
        if dismissObj?
          @strategy = dismissObj


  deactivateStrategy: () =>
    @SweetAlert.confirm({
      title: 'Are you sure you want to deactivate this strategy?'
      confirmButtonText: 'Yes, deactivate!'
      showLoaderOnConfirm: true
      focusCancel: true
      preConfirm: =>
        if @is_investor
          params =
            entity_id: @strategyId
            entity_type: 'strategy'
          promise = @Restangular.all('firm_relationships').customDELETE(null, params)
        else
          promise = @strategy.remove()
        promise.then (=>
          swal.close()
          @strategy.active = false
          @toaster.pop 'success', '', "Strategy marked inactive"
        ), ((error) =>
          swal.close()
        )
    })


  getSummarySnapshot: () =>
    @ModalFactory.invokeModal 'view_summary',
      resolve:
        entity: => @strategy
        entity_type: => @entity_type


  triggerWorkflow: =>
    @ModalFactory.invokeModal 'trigger_workflow',
      resolve:
        workflow: =>
          entity_type: @entity_type
          entity_id: @strategyId
          name: @strategy.name

  displayTagRemovalConfirmation: (tag, index) ->
    @SweetAlert.confirm({
      title: "Are you sure you want to remove \"#{tag.name}\"?"
      confirmButtonText: 'Yes'
      focusCancel: true
    }).then (isConfirm) =>
      @removeTag(tag, index) if isConfirm.value and isConfirm.value == true

  removeTag: (tag, index)->
    @Restangular.all('tag_assignments').remove(entity_type: @entity_type, entity_id: @strategyId, tag_id: tag.id).then =>
      @toaster.pop 'success', 'Tag removed successfully!'
      @tags.splice index, 1

  manageCustomfield: =>
    @ModalFactory.invokeModal 'manage_custom_fields',
      resolve:
        entityTypeId: => @StrategyIdType
        entityType: => @entity_type
        entityId: => @strategyId
        customFields: => angular.copy @customFields
        customUrl: => 'strategy_tags'
      success: (response)=>
        @customFields = response.data
