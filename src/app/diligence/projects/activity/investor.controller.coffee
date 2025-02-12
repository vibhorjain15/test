class DiligenceProjectsActivityInvestorController extends BaseController

  @register 'DiligenceProjectsActivityInvestorController'

  @inject 'DueDiligenceInvestor', '$stateParams', '$scope', 'Restangular', '$timeout', 'toaster','$state','$interval','Utils','keywordConstants','DueDiligenceDataservice', 'DiligenceDataSaveService','FILTER_TERNARY_OPERATORS','AngularDataService'

  initialize: ->
    if (@$stateParams.type.toLowerCase() != 'all' && @$stateParams.type.toLowerCase() != 'my projects' && @$stateParams.type.toLowerCase() != 'in-progress' && @$stateParams.type.toLowerCase() != 'closed' && @$stateParams.type.toLowerCase() != 'sent')
      @$state.go 'app.diligence.projects.activity', type: 'in-progress'
      @type = 'in-progress'
    else
      @type = @$stateParams.type
    @currentFirm = @Utils.getCurrentFirm()
    @type = @$stateParams.type
    @is_investor = @Utils.isInvestor()
    @is_freeSubscription = @Utils.isFreeSubscription()
    @$scope.minDate = new Date
    @$scope.$on 'due_diligence:remove', (events, diligence) =>
      @diligences.removeEntity diligence
      @diligences_grid.grid.options.data = @diligences.data

    ###
        Temporary hack to make the dropdowns align left else they would align right & body has a horizontal scroll
        Technically should be fixed in angular-ui-bootstrap https://github.com/angular-ui/bootstrap/issues/1012
    ###

    @$scope.dropdownAlignLeft = ($event, action, ID) ->
      $dropdown = $('.dropdown-menu-' + action + '-' + ID)
      $btn_group = $($event.currentTarget)
      offset = $btn_group.offset().left - $dropdown.width() + $btn_group.width()
      $dropdown.css 'left', offset

      return #to ensure no DOM nodes are referenced, https://docs.angularjs.org/error/$parse/isecdom

    @init()
    @$scope.$parent.DiligenceProjectsActivityController = @

  init: (response)=>
    @loading_prefs = true
    if @$scope.$parent.vm.customDateFilter
      if @$scope.$parent.vm.customDateFilter.selectedRange == 'No Filter'
        @diligences = @DueDiligenceInvestor.$new(
          type: @type,
          filters: @getFilters(),
          include_custom_fields: true, 
          start_date: null,
          end_date: null
          )
      else
        @diligences = @DueDiligenceInvestor.$new(
          type: @type, 
          filters: @getFilters(),
          include_custom_fields: true, 
          start_date: @Utils.formatDatetime(@$scope.$parent.vm.customDateFilter.startDate),
          end_date: @Utils.formatDatetime(@$scope.$parent.vm.customDateFilter.endDate)
          )
      @$timeout (=>
        @loading_prefs = false
      ), 1000
      @showNudges = false

      @$interval (=>
        if @diligences_grid
          @diligences_grid.core.on.filterChanged @$scope, ()=>
            grouping = @diligences_grid.grouping.getGrouping()
            if grouping?.grouping.length
              @clearSelection(@diligences_grid.grid)
      ),0,1

  getFilters: =>
    filters = @DiligenceDataSaveService.getProjectsParams()
    if filters
      initialFilters = [
        {
          filter_key: "inbound_configurations_id"
          filter_name: "inbound config id"
          type: "int"
          operations: "eq"
          filter_value: filters.id
        }
      ]
      filterParams = "#{@FILTER_TERNARY_OPERATORS.AND}" : initialFilters
      filterParams
    else
      {}

  toggleSelection: (entity) =>
    if entity.is_selected
      @diligences_grid.selection.selectRow(entity)
    else
      @diligences_grid.selection.unSelectRow(entity)

    show_bulk_actions = false
    i = 0
    while i < @diligences.data.length
      if @diligences.data[i].is_selected
        show_bulk_actions = true
        break
      i++

    @$scope.$parent.vm.show_bulk_actions = show_bulk_actions

  #method to handle individual row checkbox
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
    @$scope.$parent.vm.totalSelectedRecords = grid.api.selection.getSelectedRows().length

    #Show/hide bulk actions depending on the number of selected rows.
    if @$scope.$parent.vm.totalSelectedRecords > 0
      @$scope.$parent.vm.show_bulk_actions = true
    else
      @$scope.$parent.vm.show_bulk_actions = false


  toggleAllItemsSelection: (grid, val) =>
    if val
      @diligences_grid.selection.selectAllVisibleRows()
      items_arr = @diligences_grid.selection.getSelectedRows()

      _(items_arr).each (item) =>
        item.is_selected = val
        @diligences_grid.selection.selectRow(item)

      @$scope.$parent.vm.show_bulk_actions = true
      message = ''+items_arr.length+' projects have been selected'
      @toaster.pop 'success', '', message

    else
      @diligences_grid.selection.clearSelectedRows()
      items_arr = @diligences.data

      _(items_arr).each (item) =>
        item.is_selected = val
        @diligences_grid.selection.unSelectRow(item)

      @$scope.$parent.vm.show_bulk_actions = false

    @diligences_grid.grid.appScope.vm.select_all = val

  toggleSelectAll: (gridApi,rows) =>
    #ui-grid handles the selectall
    #method recieves all the selected rows, loop through all the rows and check all of them group header rows
    angular.forEach rows, (row) =>
      if row.treeNode.parentRow && row.treeNode.parentRow.internalRow
        row.treeNode.parentRow.isSelected = row.isSelected

    #get total selected rows from the grid api
    selectedCount = gridApi.selection.getSelectedRows().length
    selectAll = selectedCount > 0
    @$scope.$parent.vm.show_bulk_actions = selectAll
    @$scope.$parent.vm.totalSelectedRecords = selectedCount


  clearSelection: (grid,column) =>
    grid.api.selection.clearSelectedRows()

  clearGrouping: (grid,column)=>
    grid.api.grouping.clearGrouping()
    @clearSelection(grid,column)

  redirectToQuestionnaire: (entity)=>
    #generate new route
    parentState = "app.diligence"                   #parent state of the route
    newParams = {
      diligenceId: entity.id
    }
    if entity.entity_type.toLowerCase() == @keywordConstants.Product.toLowerCase()             #if diligence type is fund then go to firms.funds route
      newState = ".firms.funds"
      newParams.fromfirmId = entity.fromfirm_id
      newParams.tofirmId = entity.tofirm_id
      newParams.fundId = entity.entity_id
    else if entity.entity_type.toLowerCase() == @keywordConstants.Firm.toLowerCase()        #else if it is a firm diligence then go to firms route
      newState = ".firms"
      newParams.fromfirmId = entity.fromfirm_id
      newParams.tofirmId = entity.entity_id
    else if entity.entity_type.toLowerCase() == @keywordConstants.Strategy.toLowerCase()        #else if it is a firm diligence then go to firms route
      newState = ".firms.strategies"
      newParams.fromfirmId = entity.fromfirm_id
      newParams.tofirmId = entity.tofirm_id
      newParams.strategyId = entity.entity_id
    else
      newState = ""                                 #else go to the oldstate
    childState = '.project.summary'                  #get the tostate from the $state and append to the new route
    @$state.go(parentState+newState+childState, newParams)

  openRow: (row,col)=>
    if (row.entity.status != 'Sent' && row.entity.status != 'Deleted' && row.entity.status != 'Withdrawn')
      if !row.internalRow && col.field != "selectionRowHeaderCol"
        if row.entity.status == 'Invited'
          @toastInstance = @toaster.pop({type: 'info', title: 'Starting project...', body: 'Please wait while the request is being processed.', timeout: 0})
          @DueDiligenceDataservice.updateDiligenceStatus('Started', row.entity.id).then (response) =>
            @redirectToQuestionnaire(response.data)
            @toaster.clear(@toastInstance)
          ,=>
            @toaster.clear(@toastInstance)
        else
          @redirectToQuestionnaire(row.entity)

  getExpiryClass: (expiryDate,row)=>
    if row.entity.status == 'Completed'
      diff = moment(expiryDate).diff(moment(row.entity.completed_at),'seconds')
      if diff < 0
        {
          class: 'text text-danger'
          text: ''
        }
      else
        {
          class: 'text text-muted'
          text: ''
        }
    else
      classObject = @Utils.getExpiryClass(expiryDate)
      classObject

  openInviteRow: (row,col) =>
    if !row.internalRow && col.field != "selectionRowHeaderCol" && col.field != "invitationsAction"
      if row.entity.entity_type=='Fund'
        @$state.go("app.funds.profile.summary",{fundId: row.entity.entity_id})
      if row.entity.entity_type=='Firm'
        @$state.go("app.firms.profile.monitor",{firmId: row.entity.entity_id})

  refresh: =>
    delete @diligences
    @init()
