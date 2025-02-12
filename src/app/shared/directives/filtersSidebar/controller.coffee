class DvFiltersSidebarController extends BaseController
  @register 'DvFiltersSidebarController'

  @inject 'BaseDataService', '$attrs', '$scope', 'Restangular', 'ModalFactory', 'toaster', 'SweetAlert', '$timeout','Utils','RestangularHeaderService', '$q', 'FILTER_TERNARY_OPERATORS', 'FILTER_TYPES', '$window', '$state', '$sce'

  initialize: ->
    @navIsOpen = true
    @isSearchPanelCollapsed = true
    @showExpandedMenu = false
    @global_ternary_operator = @FILTER_TERNARY_OPERATORS.AND
    @isManager = @Utils.isManager()
    @is_freeSubscription = @Utils.isFreeSubscription()
    @current_user = @Utils.getCurrentUser()
    @currentFirmId = @current_user.firmInfo.id
    @PreApprovedContent  = 'PreApproved'
    @AllContent = 'All'
    @selectedTab = @AllContent
    @FundIdType = 1219
    @FirmIdType = 1220
    @VehicleIdType = 1217
    @showingSearchResults = false
    @criteria_options = []
    @charLimitForLabel = 40
    @charLimitForResponse = 250
    @selectedEntities = {
      question: true
      answer: true
    }
    @defaultParams = {}
    @searchText = null
    @entities = [
      {name: 'entity', alias: 'Product'},
      {name: 'entity', alias: 'Firm'},
      {name: 'entity', alias: 'Vehicle'},
      {name: 'tags', alias: 'Tag'},
      {name: 'response_text', alias: 'Answer'},
      {name: 'question_text', alias: 'Question'},

    ]
    @selectedEntityType = @entities[5]

    @advanceAdvSearch = false
    @search_criterias = []
    @search_criterias_backup = []

    deregisterer = @$scope.$parent.$watchGroup [@$attrs.diligence], (values) =>
      if values[0]
        @diligence = values[0]
        if @isManager
          @setDefaultView()
        @getAllUsers()
        deregisterer()



  getAllUsers: =>
    @Restangular.one('firms', @currentFirmId).all('users').getList(include_deleted: true).then (response) =>
      @team_members = response

  getAuthorName: (id) ->
    user = _(@team_members).findWhere({id: id})
    if user and user.fullName
      user.fullName
    else
      "N/A"

  setDefaultView: () =>
    @Restangular.all('firm_preferences').customGET().then (response) =>
      if response.set_preapproved_default
        @selectedTab = @PreApprovedContent
      else
        @selectedTab = @AllContent

  removeRouteChangeNagger: ->
    # This function is called when chanegs are saved

    # remove the beforeunload listner
    @$window.onbeforeunload = null
    # if check is there is a nagger (route change listner)
    if @route_change_nagger?
      @route_change_nagger() #deregisters the listener
      @route_change_nagger = null

  addRouteChangeNagger: ->
    return if @route_change_nagger?
    # get unsaved changes
    if @showExpandedMenu
      leaving_state = false
      SweetAlert = @SweetAlert
      $state = @$state
      getTitle = =>
        "Are you sure you want to leave"

      # beforeunload event is fired when the window, the document and its resources are about to be unloaded.
      # The document is still visible and the event is still cancelable at this point
      @$window.onbeforeunload = ->
        "#{getTitle()}"

      # here we are listen to route/state change event. Before state is changed this event is fired
      @route_change_nagger = @$scope.$on '$stateChangeStart', (event, toState, toParams) =>
        return if leaving_state
        event.preventDefault()
        @toggleMenuExpand()
        leaving_state = true
        # swal.close()
        @$timeout =>
          # pass state name with params, if we don't pass to params it will create problems
          @$state.go toState.name , toParams

  isResponseExpired: (expiryDate) ->
    diff = moment(expiryDate).diff(moment(),'seconds')
    expired = false
    if diff < 0
      expired = true
    expired

  extractContent: (s) ->
    span = document.createElement('span')
    span.innerHTML = s
    span.textContent or span.innerText


  clearSearchText: ->
    @searchText = null
    @searchText

  copyResponse: (str) ->
    content = @extractContent(str)
    el = document.createElement('textarea')
    el.value = content
    document.body.appendChild el
    el.select()
    document.execCommand 'copy'
    document.body.removeChild el
    @toaster.pop 'success', '', 'Response copied to clipboard', 5000

  viewResponse: (response) =>
    @ModalFactory.invokeModal 'view_response',
      resolve:
        response: => response
        selected_tab: => @selectedTab


  searchByFilters: =>
    @getGeneralSearchResult()
    @toggleSearchPanel()

  toggleMenuExpand: =>
    if @showExpandedMenu
      @collapseMenu()
    else
      @expandMenu()

  setSearchType: (type) =>
    @selectedTab = type
    if @searchText
      @getGeneralSearchResult()

  getEntityPayload: (operator, selectedEntities) =>
    # @global_ternary_operator  @FILTER_TERNARY_OPERATORS.AND
    if @selectedTab == @PreApprovedContent
      operator[@FILTER_TERNARY_OPERATORS.AND] = []
      obj =
        filter_name: "diligence_type",
        filter_value: -1,
        filter_type: "str",
        search_type: "exact"
      operator[@FILTER_TERNARY_OPERATORS.AND].push obj
    @searchInInvestorOrEntity = false
    @filterSelected = false
    if selectedEntities.length > 0
      @global_ternary_operator = @FILTER_TERNARY_OPERATORS.OR
      operator[@global_ternary_operator] = []
      for checkBoxType in selectedEntities
        innerObj = {}
        if checkBoxType == 'tag'
          innerObj.filter_name = 'tags'
          innerObj.filter_value = [@searchText]
          innerObj.filter_type = 'list'
          innerObj.search_type = 'contains'
          @filterSelected = true
        else if checkBoxType == 'question'
          innerObj.filter_name = 'question_text'
          innerObj.filter_value = @searchText
          innerObj.filter_type = 'str'
          innerObj.search_type = 'contains'
          @filterSelected = true
        else if checkBoxType == 'answer'
          innerObj.filter_name = 'response_text'
          innerObj.filter_value = @searchText
          innerObj.filter_type = 'str'
          innerObj.search_type = 'contains'
          @filterSelected = true
        else if checkBoxType == 'investor'
          @searchInInvestorOrEntity = true
          innerObj.filter_name = 'investor_id'
          innerObj.filter_value = @diligence.investorfirm_id
          innerObj.filter_type = 'id'
          innerObj.search_type = 'exact'
        else if checkBoxType == 'entity'
          @searchInInvestorOrEntity = true
          if @diligence.entity_type == 'Fund'
            innerObj.filter_name = 'entity_id'
            innerObj.filter_value = @diligence.entity_id
            innerObj.filter_type = 'id'
            innerObj.search_type = 'exact'
            innerObj.entity_type = @FundIdType
          else if @diligence.entity_type == 'Firm'
            innerObj.filter_name = 'entity_id'
            innerObj.filter_value = @diligence.entity_id
            innerObj.filter_type = 'id'
            innerObj.search_type = 'exact'
            innerObj.entity_type = @FirmIdType
          else if @diligence.entity_type == 'Vehicle'
            innerObj.filter_name = 'entity_id'
            innerObj.filter_value = @diligence.entity_id
            innerObj.filter_type = 'id'
            innerObj.search_type = 'exact'
            innerObj.entity_type = @VehicleIdType
        if @searchInInvestorOrEntity
          if !@filterSelected
            operator['general'] = {}
            operator['general'].filter_name = "general"
            operator['general'].filter_value = @searchText
            operator['general'].filter_type = 'str'
            operator['general'].search_type = 'contains'
          if operator.hasOwnProperty(@FILTER_TERNARY_OPERATORS.AND)
            operator[@FILTER_TERNARY_OPERATORS.AND].push innerObj
          else
            operator[@FILTER_TERNARY_OPERATORS.AND] = []
            operator[@FILTER_TERNARY_OPERATORS.AND].push innerObj
        else
          operator[@global_ternary_operator].push innerObj


  objectKeyByValue: (obj) =>
    keys = Object.keys(obj)
    filtered = keys.filter((key) ->
      obj[key]
    )
    filtered

  useTrustAsHtml: (string, limit) =>
    if string and string.length > limit
      string = string.slice(0, limit - 3) + "..."
    newString = @$sce.trustAsHtml(string)
    newString

  getGeneralSearchResult: =>
    if @searchText
      @defaultParams = {}
      @loading = true
      @defaultParams.filters = {}
      @defaultParams.boosting_params = [{
        entity_type: @diligence.entity_type
        entity_name: @diligence.entity_name
        entity_id: @diligence.entity_id
      }]
      selectedEntities = @objectKeyByValue(@selectedEntities)
      if selectedEntities and selectedEntities.length
        delete @defaultParams.filters.general
        @getEntityPayload(@defaultParams.filters, selectedEntities)
      else
        @defaultParams.filters["general"] = {}
        @defaultParams.filters["general"].filter_name = "general"
        @defaultParams.filters["general"].filter_value = @searchText
        @defaultParams.filters["general"].filter_type = 'str'
        @defaultParams.filters["general"].search_type = 'contains'
        if @selectedTab == @PreApprovedContent
          @defaultParams.filters[@FILTER_TERNARY_OPERATORS.AND] = []
          obj =
            filter_name: "diligence_type",
            filter_value: "-1",
            filter_type: "str",
            search_type: "exact"
          @defaultParams.filters[@FILTER_TERNARY_OPERATORS.AND].push obj
      @Restangular.all('service/es_service/qa_search').post(@defaultParams).then ((response) =>
        @loading = false
        @searchResults = response.data
        for result in @searchResults
          if result.response_created_by
            result.author_name = @getAuthorName(result.response_created_by)
        @totalCount = response.count
        @exactCount = response.highlighted_count
      ), (error) =>
        @loading = false

  getCheckBoxText: (type) ->
    text = ""
    if @diligence.entity_type == "Fund"
      text = "Product"
    else if @diligence.entity_type == "Firm"
      text = "Firm"
    else if @diligence.entity_type == "Vehicle"
      text = "Vehicle"
    text

  getEntityDisplayName: (entity_type) =>
    @Utils.getDisplayEntityType(entity_type)

  expandMenu: =>
    @showExpandedMenu = true
    jQuery("#mySidenav").css("width", "550px")
    @addRouteChangeNagger()

  collapseMenu: =>
    @showExpandedMenu = false
    @removeRouteChangeNagger()
    @openNav()

  clearFilters: () =>
    @resetFiltersData()
    @toggleSearchPanel()

  toggleSearchPanel: () ->
    @isSearchPanelCollapsed = not @isSearchPanelCollapsed


  searchInQa: =>
    @toggleMenuExpand()
    @searchQaBank = true

  toggleNav: =>
    if @navIsOpen
      @closeNav()
    else
      @openNav()

  openNav: =>
    @navIsOpen = true
    jQuery("#mySidenav").css("width", "65px")
    jQuery("#filterArrow").css("right", "17px")
    jQuery("#filterArrow").css("border-top-right-radius", "50px")
    jQuery("#filterArrow").css("border-bottom-right-radius", "50px")
    if jQuery(window).width() <= 1390
      jQuery(".projectsParentDiv").css("margin-right", "65px")


  closeNav: =>
    @navIsOpen = false
    jQuery("#mySidenav").css("width", "0px")
    jQuery("#filterArrow").css("right", "0px")
    jQuery("#filterArrow").css("border-top-right-radius", "0px")
    jQuery("#filterArrow").css("border-bottom-right-radius", "0px")
    jQuery(".projectsParentDiv").css("margin-right", "auto")
