class FirmSettingsPermissionsController extends BaseController
  @register 'FirmSettingsPermissionsController'

  @inject 'Restangular', 'Utils', '$q', '$timeout', 'SweetAlert', '$scope', 'toaster', 'PermissionsManager', 'ModalFactory', 'SweetAlert', '$state', 'keywordConstants','angularEnabled'

  initialize: ->
    @is_admin = @Utils.isAdmin()
    @is_manager = @Utils.isManager()
    @selectionType = 'person'
    @current_user = @Utils.getCurrentUser()
    @permissions_enabled = @current_user.firmInfo.hasPermissionEnabled
    @currentFirmId = @current_user.firmInfo.id
    @render_grid = true
    @permissions = @PermissionsManager.$new({firm_id: @currentFirmId})

  setSelectionType: (type) =>
    @selectionType = type
    @getPermissions()
    # firmId = @Utils.getCurrentFirm().id

  getEntityTypeName: (entity_type) =>
    display_name = @Utils.getDisplayEntityType(entity_type)
    if @is_manager and display_name == @keywordConstants.Firm
      display_name = 'Investor'
    display_name

  getEntityGroupHeaderName: (grid, row, col)=>
    enity_name = ""
    #get group name from the aggregations list.
    for i in [0...row.treeNode.aggregations.length]
      agg = row.treeNode.aggregations[i]
      if agg.groupVal and agg.groupVal.length > 0
        entity_name = agg.groupVal

    #if we find the group name from the aggregations list, get its appropriate label name, otherwise show 'Ungrouped'
    if entity_name != ""
      entity_name = @getEntityTypeName(entity_name)
    else
      entity_name = "Ungrouped"
    entity_name + "(#{row.treeNode.children.length})"

  openRow: (row,col)=>
    if !row.internalRow && col.field != "selectionRowHeaderCol" && !@previewClicked && col.field != 'action'
      @$state.go("app.firm.settings.permission.detail",{entity_id: row.entity.assigned_to_entity_id, entity_type: row.entity.assigned_to_entity_type, entity_name: row.entity.assigned_to_name})

  revokeAccessModal: (entity) ->
    @SweetAlert.confirm({
      title: 'Are you sure you want to revoke access ?'
      confirmButtonText: 'Yes, Please!'
      showLoaderOnConfirm: true
      preConfirm: =>
        @revokeAccess(entity)
    })


  getPermissions: =>
    delete @permissions
    @render_grid = false
    @permissions = @PermissionsManager.$new({firm_id: @currentFirmId})
    @$timeout (=>
      @render_grid = true
    ), 1000

  formatTagsTooltip: (tagsList) =>
    if tagsList and tagsList.length > 2
      return  _(tagsList).tail().join(', ')

  filterResources: (query) ->
    return @resources unless query
    regex = new RegExp(query, 'i')
    _(@resources).filter((fund) -> regex.test(fund.name))

  editResourceList: (data) ->
    @ModalFactory.invokeModal 'manage_permissions',
      resolve:
        tabType : => null
        resource_data : => data
      success: (response) =>
        @getPermissions()

  revokeAccess: (entity) =>
    @loading = true
    @Restangular.one('firms', @currentFirmId).one('ResourcePermissions', entity.id).remove().then(=>
      @toaster.pop 'success', '', 'Access Revoked'
      index = _(@permissions.data).findIndex (permission)=>
        permission.id == entity.id
      delete @permissions.data.splice index,1
    ).finally (=>
      swal.close() #stupid angular-sweetalert guy isn't tagging the updated code!
    )

  closeQuickActions: () =>
    @permissions_grid.selection.clearSelectedRows()
    items_arr = @permissions_grid.grid.rows

    _(items_arr).each (rows) =>
      rows.isSelected = false
      rows.entity.isSelected = false
      @permissions_grid.selection.unSelectRow(rows)

    @$scope.vm.show_bulk_actions = false
    @permissions_grid.grid.appScope.vm.select_all = false

  toggleSelectAll: (gridApi,rows) =>
    #ui-grid handles the selectall
    #method recieves all the selected rows, loop through all the rows and check all of them group header rows
    angular.forEach rows, (row) =>
      if row.treeNode.parentRow && row.treeNode.parentRow.internalRow
        row.treeNode.parentRow.isSelected = row.isSelected

    #get total selected rows from the grid api
    selectedCount = gridApi.selection.getSelectedRows().length
    selectAll = selectedCount > 0
    @$scope.vm.show_bulk_actions = selectAll
    @permissions_grid.grid.appScope.vm.select_all = selectAll
    @totalSelectedRecords = selectedCount

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
      @$scope.vm.show_bulk_actions = true
    else
      @$scope.vm.show_bulk_actions = false

  confirmBulkResourceDeletion: ->
    title = 'Are you sure you want to remove selected items?'
    text = ""
    @SweetAlert.confirm({
      title: title
      confirmButtonText: 'Yes, Please!'
      showLoaderOnConfirm: true
      preConfirm: =>
        @deleteSelectedResources()
    })

  deleteSelectedResources: =>
    items_arr = @permissions_grid.selection.getSelectedRows()
    for item in items_arr
      item.is_active = false

    @Restangular.one('firms', @currentFirmId).all('ResourcePermissions/bulk_update').customPUT(items_arr).then ((response) =>
      @getPermissions()
      @closeQuickActions()
      swal.close()
    ), ((error) =>
      swal.close()
    )

  openNewPermissionDialog: =>
    @ModalFactory.invokeModal 'manage_permissions',
      resolve:
        tabType : => null
        resource_data : => null
      success: (response) =>
        @getPermissions()
        # @fetchEmployees()

  clearSelection: (grid,column) =>
    grid.api.selection.clearSelectedRows()

  clearGrouping: (grid,column)=>
    grid.api.grouping.clearGrouping()
    @clearSelection(grid,column)
