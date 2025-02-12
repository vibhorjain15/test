class DDInvestorSelectorController extends BaseController
  @register 'DDInvestorSelectorController'

  @inject '$http', 'baseUrl', 'Restangular', '$attrs', '$scope', '$parse', '$log', 'Utils', 'ModalFactory', 'FILTER_TERNARY_OPERATORS', 'keywordConstants'

  initialize: ->
    attrs = @$attrs
    @is_read_only = @Utils.isReadOnly()
    @is_freeSubscription = @Utils.isFreeSubscription()
    @filters_section = {show: false}
    @selected_list_filters_section = {show: false}

    @getFiltersModalData()
    @search_criterias = []
    @filterApplied = false
    @filters_data_loaded = false
    @global_ternary_operator = @FILTER_TERNARY_OPERATORS.AND

    unless attrs.selection?
      @$log.error "Please provide a selection attribute!"
      return

    @selection_list = @$scope.$parent.$eval(attrs.selection)

    unless @selection_list?
      @selection_list = []
      @$parse(attrs.selection).assign(@$scope.$parent, @selection_list)

    @filters = {}
    @dropdown = {open: false}
    @investors = []

    @filters_section = {show: false}

    @is_loading_investors = true
    @searchByFilters()

    @watchForSelectAllInvestorsFlag()
    @watchForClearSelection()
    @watchForDisabledState()
    @watchForContactTagSelection()

  watchForSelectAllInvestorsFlag: ->
    if @$attrs.selectAllInvestors?
      @select_all_investors = @$scope.$parent.$eval(@$attrs.selectAllInvestors)

      @$scope.$watch 'vm.select_all_investors', (value) =>
        if value?
          @$parse(@$attrs.selectAllInvestors).assign(@$scope.$parent, value)

  watchForClearSelection: ->
    if @$attrs.clearSelection?
      @$scope.$parent.$watch @$attrs.clearSelection, (value) =>
        if value
          @clearSelection()
          @select_all_investors = false

  watchForDisabledState: ->
    if @$attrs.disabled?
      @$scope.$parent.$watch @$attrs.disabled, (value) =>
        @disabled = value

  addToSelection: (investor) ->
    ids = _(@selection_list).pluck('id')
    if !investor.hasOwnProperty('notification_contacts')
      investor['notification_contacts'] = []
    _(investor.notification_contacts).forEach (contact) =>
      contact.is_removed = false
    unless _(ids).contains(investor.id)
      investor.is_selected = true
      @selection_list.push(investor)

  toggleSelectedListFiltersSection: =>
    @selected_list_filters_section.show = !@selected_list_filters_section.show

    if @selected_list_filters_section.show
      @loadSelectedListFilterOptions()

  resetSelectedListFilters: =>
    @selected_list_filters_section = {show: true}

  loadSelectedListFilterOptions: =>
    if !@contact_tags
      params =
        Type: 'Contact'
      @Restangular.all('tags').customGET('', params).then (response) =>
        @contact_tags = response

  removeFromSelection: (investor) ->
    @handleDeselection([investor])
    @selection_list.splice(@selection_list.indexOf(investor), 1)

  deleteAllBouncedEmails: ->
    _(@selection_list).each (entity) =>
      _(entity.notification_contacts).each (contact) =>
        if contact.has_bounce_history && !contact.is_removed
          contact.is_removed = true

  checkIfAnyBouncedEmail: ->
    bouncedEmailsList = []
    _(@selection_list).each (entity) =>
      _(entity.notification_contacts).each (contact) =>
        if contact.has_bounce_history && !contact.is_removed
          bouncedEmailsList.push contact
    if bouncedEmailsList.length > 0
      return true
    else
      return false

  clearSelection: ->
    @handleDeselection(@selection_list)
    @selection_list.length = 0
    @disable_select_all = false

  handleDeselection: (investors) ->
    _(investors).each (investor) =>
      investor_from_main_list = _(@investors).findWhere(id: investor.id)

      investor_from_main_list.is_selected = false if investor_from_main_list?

    @select_all_investors = false
    @display_selection_warning = false

  selectAll: ->
    _(@investors).each (investor) =>
      @addToSelection(investor)

    @select_all_investors = false
    @display_selection_warning = true
    @disable_select_all = true

  applyFilters: ->
    @searchByFilters()

  markInvestorSelection: (investors) ->
    ids = _(@selection_list).pluck('id')

    _(investors).filter (investor) ->
      investor.is_selected = _(ids).contains(investor.id)

  loadFilterOptions: =>
    if !@tags
      @Restangular.all('tags').getList(type: 'Status').then (response) =>
        @tags = response

  toggleFiltersSection: =>
    @filters_section.show = !@filters_section.show

    if @filters_section.show
      @loadFilterOptions()

  resetFilters: ->
    @filters = {}
    @applyFilters()

  getRecipientsCount: (contact) ->
    selected_contacts = 0
    _(contact.notification_contacts).each (contact) =>
      if !contact.is_removed
        selected_contacts += 1
    selected_contacts

  watchForContactTagSelection: ->
    @$scope.$watch 'vm.selected_list_filters_section.contact_id', (value) =>
      if value?
        for item in @selection_list
          if item?
            for contact in item.notification_contacts
              if (contact.tag_ids?) && (value not in contact.tag_ids)
                contact.is_removed = true
              else
                contact.is_removed = false
            item.total_recipients_count = @getRecipientsCount(item)
      else
          if @selection_list?
            for item in @selection_list
              if item?
                for contact in item.notification_contacts
                  contact.is_removed = false
                item.total_recipients_count = @getRecipientsCount(item)

  setContactRemovalState: (investor, contact, state) =>
    contact.is_removed = state
    investor.total_recipients_count = @getRecipientsCount(investor)

  openNewInvestorDialog: ->
    @ModalFactory.invokeModal 'manage_firm',
      resolve:
        source: -> 'InformationRequestFlow'
      success: (investors) =>
        _(investors).forEach (investor) =>
          @investors.push investor
          @addToSelection(investor)

  addNewContact:(investor)=>
    @ModalFactory.invokeModal 'manage_contact',
      resolve:
        entity_details : => investor
        entity_type : => 'firm'
        source: =>'InformationRequestFlow'
      success: (contacts) =>
        if contacts.length > 0
          _(contacts).each (contact)=>
            notifContact =
              email: contact.userName
              entity_id: contact.firmInfo.id
              id: contact.id
              name: contact.fullName
              relationship_status_id: contact.relationship_status_id
              relationship_status_name: contact.relationship_status
              tag_ids: _(contact.contact_types).pluck('id')

            investorIndex = _(@investors).findIndex (investorItem)=>
              investorItem.id == contact.firmInfo.id

            @investors[investorIndex].notification_contacts.push notifContact if investorIndex > -1

  getFiltersModalData: () =>
    @Restangular.all('service/dvapi_service/search_filters').post(entity_type:@keywordConstants.Firm.toLowerCase()).then (response) =>
      @search_filters_response = response
      @search_criterias = []
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
    if @filters.name
      nameFilterParams =
          filter_key: 'name',
          filter_name: 'Name',
          type: 'text',
          operations: 'contains',
          filter_value: @filters.name
      filter_params.filters[@global_ternary_operator].push(nameFilterParams)
    filter_params.include_custom_fields = false
    filter_params.is_active = true
    @processing_data = true
    @Restangular.all('service/dvapi_service/firm_search').post(filter_params).then (response) =>
      @disable_select_all = false
      @investors = response.data
      @processing_data = false
      @data_length = response.count
      @is_loading_investors = false
      @markInvestorSelection(@investors)

  resetFiltersData: () =>
    @global_ternary_operator = @FILTER_TERNARY_OPERATORS.AND
    @search_criterias = []
    @filterApplied = false
    @searchByFilters()

  removeFilterCriterion: (index) =>
    if index<@search_filters_response.default_filters.length
      @search_criterias[index].advance_filter_value = ''
    else
      @search_criterias.splice index, 1
    @searchByFilters()

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
      is_active: true,
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
