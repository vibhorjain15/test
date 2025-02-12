class DiligenceProjectsActivityManagerController extends BaseController

  @register 'DiligenceProjectsActivityManagerController'

  @inject '$stateParams', 'DueDiligenceManager', '$scope', 'Restangular', 'toaster','$state','$interval','Utils','keywordConstants','DueDiligenceDataservice','$timeout'

  initialize: ->
    @type = @$stateParams.type
    @is_freeSubscription = @Utils.isFreeSubscription()
    @currentFirm = @Utils.getCurrentFirm()
    

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

    @$scope.minDate = new Date
    @totalSelectedRecords = 0
    #@diligences = null

    @$scope.$on 'due_diligence:remove', (events, diligence) =>
      @diligences.removeEntity diligence
      @diligences_grid.grid.options.data = @diligences.data

    @init()
    @$scope.$parent.DiligenceProjectsActivityController = @

  init: =>
    @loading_prefs = true
    if @$scope.$parent.vm.customDateFilter
      if @$scope.$parent.vm.customDateFilter.selectedRange == 'No Filter'
        @diligences = @DueDiligenceManager.$new(
          type: @type,
          filters: {},
          include_custom_fields: true, 
          )
      else
        @diligences = @DueDiligenceManager.$new(
          type: @type, 
          filters: {},
          include_custom_fields: true,
          start_date: @Utils.formatDatetime(@$scope.$parent.vm.customDateFilter.startDate),
          end_date: @Utils.formatDatetime(@$scope.$parent.vm.customDateFilter.endDate)
          )
      @$timeout (=>
        @loading_prefs = false
      ), 1000

      @$interval (=>
        if @diligences_grid
          @diligences_grid.core.on.filterChanged @$scope, ()=>
            @clearSelection(@diligences_grid.grid)
      ),0,1

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

  toggleButtonClick: (grid,row) =>
    if row.internalRow
      angular.forEach row.treeNode.children,(children) =>
        children.row.isSelected = false
        # select only visible rows
        if children.row.visible and row.isSelected
          children.row.isSelected = true

    else if row.treeNode.parentRow
      row.treeNode.parentRow.isSelected = true
      angular.forEach row.treeNode.parentRow.treeNode.children,(children) =>
        if !children.row.isSelected
          row.treeNode.parentRow.isSelected = false

    @$scope.$parent.vm.totalSelectedRecords = grid.api.selection.getSelectedRows().length
    if @$scope.$parent.vm.totalSelectedRecords > 0
      @$scope.$parent.vm.show_bulk_actions = true
    else
      @$scope.$parent.vm.show_bulk_actions = false


  toggleSelectAll: (gridApi,rows) =>
    angular.forEach rows, (row) =>
      if row.treeNode.parentRow && row.treeNode.parentRow.internalRow
        row.treeNode.parentRow.isSelected = row.isSelected

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
    childState = '.project.questionnaire'                  #get the tostate from the $state and append to the new route
    @$state.go(parentState+newState+childState, newParams)

    #@$state.go("app.diligence.project.questionnaire",{diligenceId: entity.id})

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

  openInviteRow: (row,col) =>
    if !row.internalRow && col.field != "selectionRowHeaderCol"
      @$state.go("app.firms.profile.summary",{firmId: row.entity.entity_id})

  getExpiryClass: (expiryDate,row) =>
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

  refresh: =>
    delete @diligences
    @init()
