class FirmSettingsFunctionsController extends BaseController
  @register 'FirmSettingsFunctionsController'

  @inject 'Restangular', 'Utils', '$q', '$timeout', 'SweetAlert', '$scope', 'toaster', 'ModalFactory', '$rootScope', '$stateParams', '$state' , 'FunctionsResource','angularEnabled'

  initialize: ->
    @is_admin = @Utils.isAdmin()
    @current_user = @Utils.getCurrentUser()
    @currentFirmId = @current_user.firmInfo.id
    @getFunctionsGrid()

    @$scope.getFirmProfile().then (firm_profile) =>
      @firm_profile = firm_profile


  formatUsersTooltip: (usersArray) =>
    usersArrayCopy = angular.copy usersArray
    users = _(usersArrayCopy).pluck "user_name"
    users = _(users).tail(4).join(', ')
    users

  displayEditFunctionConfirmation: (entity) =>
    @closeQuickActions()
    @ModalFactory.invokeModal 'add_users_to_function',
      resolve:
        functionsList: => [entity]
        existingFunctions: => null
      success: (new_user) =>
        @toaster.pop 'success','','User Roles updated successfully'
        @getFunctionsGrid()

  displayUserRemovalConfirmation: (entity) =>
    @SweetAlert.confirm({
      title: "Are you sure you want to remove?"
      type: 'warning'
      confirmButtonText: 'Yes'
      focusCancel: true
    }).then (isConfirm) =>
      @removeSelectedFunction(entity) if isConfirm.value and isConfirm.value == true

  removeSelectedFunction: (entity) =>
    params = []
    innerObj = {}
    innerObj.user_ids = []
    innerObj.function_id = entity.function_id
    params.push innerObj
    @Restangular.all('functions').customPUT(params).then ((response) =>
      @toaster.pop 'success','','User Roles removed successfully'
      @getFunctionsGrid()
      @closeQuickActions()
    ),(error) =>
      @saving = false


  removeFunctions: =>
    items_arr = @functionsGrid.selection.getSelectedRows()
    params = []
    for entry in items_arr
      innerObj = {}
      innerObj.user_ids = []
      innerObj.function_id = entry.function_id
      params.push innerObj
    @Restangular.all('functions').customPUT(params).then ((response) =>
      @toaster.pop 'success','','User Roles removed successfully'
      @getFunctionsGrid()
      @closeQuickActions()
    ),(error) =>
      @saving = false


  bulkRemoveFunctions: =>
    @SweetAlert.confirm({
      title: "Are you sure you want to remove selected user roles and associated users?"
      type: 'warning'
      confirmButtonText: 'Yes'
      focusCancel: true
    }).then (isConfirm) =>
      @removeFunctions() if isConfirm.value and isConfirm.value == true

  openAddUsersToFunctionModal: =>
    existingFunctions = @functionsGrid.core.getVisibleRows()
    function_ids = []
    for entry in existingFunctions
      function_ids.push entry.entity.function_id
    @ModalFactory.invokeModal 'add_users_to_function',
      resolve:
        functionsList: => null
        existingFunctions: => function_ids
      success: (new_user) =>
        @toaster.pop 'success','','User Roles added successfully'
        @getFunctionsGrid()

  bulkAddUsersToFunctions: =>
    items_arr = @functionsGrid.selection.getSelectedRows()
    @ModalFactory.invokeModal 'add_users_to_function',
      resolve:
        functionsList: => items_arr
        existingFunctions: => null
      success: (new_user) =>
        @toaster.pop 'success','','User Roles updated successfully'
        @getFunctionsGrid()
        @show_bulk_actions = false


  closeQuickActions: () =>
    @functionsGrid.selection.clearSelectedRows()
    items_arr = @functionsGrid.grid.rows

    _(items_arr).each (rows) =>
      rows.isSelected = false
      rows.entity.isSelected = false
      @functionsGrid.selection.unSelectRow(rows)

    jQuery('input[type="checkbox"]').each (ind) ->
      jQuery(this).prop 'checked', false
      return

    @$scope.vm.show_bulk_actions = false
    @functionsGrid.grid.appScope.vm.select_all = false

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
    @functionsGrid.grid.appScope.vm.select_all = selectAll
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

  getFunctionsGrid: =>
    @renderGrid = false
    @all_functions = @FunctionsResource.$new({entity_id: @currentFirmId, entity_type: "Firm"})
    @$timeout (=>
      @renderGrid = true
    ), 1000
