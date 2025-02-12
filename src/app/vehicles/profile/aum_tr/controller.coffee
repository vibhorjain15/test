class VehicleProfileAUMTRController extends BaseController
  @register 'VehicleProfileAUMTRController'

  @inject 'VehicleDataService', '$state', 'ModalFactory', '$scope', 'Restangular',
          '$stateParams', 'SweetAlert', 'toaster', 'Utils', 'keywordConstants','angularEnabled','$window'

  initialize: ->
    @entity_type = @Utils.getDisplayEntityType(@keywordConstants.Vehicle)
    vehicleId = @$stateParams.vehicleId
    @currentUser = @Utils.getCurrentUser()
    @currentFirmId = @currentUser.firmInfo.id

    @$scope.getVehicle().then (vehicle) =>
      @vehicle = vehicle
      @getTables()

  getTables: () ->
    @VehicleDataService.getShareClassTables(@vehicle.firm_id, @vehicle.fund_id, @vehicle.id).then (response)=>
      @tables = response

  openAddTableDialog: ->
    @ModalFactory.invokeModal 'manage_aum_tr_table',
      success: (response) =>
        @tables.push response
      resolve:
        entity_id: => @vehicle.id
        entity_type: => @entity_type

  openEditTableDialog: (table, idx) ->
    @ModalFactory.invokeModal 'manage_aum_tr_table',
      success: (response) =>
        @tables[idx] = response
        @toaster.pop 'success', '', 'Data table updated successfully'
      resolve:
        entity_id: => @vehicle.id
        entity_type: => @entity_type    
        table: => table

  openDeleteConfirmation: (table, idx) ->
    @SweetAlert.confirm({
      title: 'Are you sure you want to delete this data table?'
      text: ''
      focusCancel: true
      showLoaderOnConfirm: true
      preConfirm: =>
        @deleteTable(table, idx)
    })

  deleteTable: (table, idx) ->
    params = _(table).pick('id', 'name', 'type', 'period','firm_id', 'entity_type', 'entity_id')
    @Restangular.one('AumTrackRecordDefinitions', table.id).remove(params).then =>
      swal.close()
      @tables.splice idx, 1
      @toaster.pop 'success', '', 'Data table deleted successfully'

  handle_state_change: (unsaved_table_count) ->
    @unsaved_table_count = unsaved_table_count

  removeRouteChangeNagger: ->
    if @route_change_nagger?
      @route_change_nagger() #deregisters the listener
      @route_change_nagger = null

  addRouteChangeNagger: ->
    return if @route_change_nagger?

    @route_change_nagger = @$scope.$on '$stateChangeStart', (event, toState, toParams) =>
      return unless @unsaved_table_count

      event.preventDefault()
      alert_title = if @unsaved_table_count == 1 then "You have 1 table with unsaved changes. " else "You have #{@unsaved_table_count} tables with unsaved changes. "

      @SweetAlert.confirm({
        title: alert_title + "Are you sure you want to leave this page?"
        text: "All your unsaved changes will be lost if you leave this page."
        cancelButtonText: 'Leave'
        confirmButtonText: 'Stay'
        customClass: 'danger-on-cancel'
        showCloseButton: true
        reverseButtons: false
        showLoaderOnConfirm: true
        preConfirm: =>
          swal.close()
      }).then (isConfirm) =>
        if isConfirm.dismiss and isConfirm.dismiss == 'cancel'
          @unsaved_table_count = 0
          swal.close()
          @$state.go(toState, toParams)

  angular_init: ->
    if @Utils.isAngular()
      @$scope.$on '$destroy', =>
          @removeRouteChangeNagger()

      @addRouteChangeNagger()
