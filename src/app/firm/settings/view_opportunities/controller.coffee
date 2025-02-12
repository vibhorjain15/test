class ViewOpportunitiesController extends BaseController
  @register 'ViewOpportunitiesController'

  @inject '$scope','ViewOpportunitiesResource', 'Utils','Restangular','SweetAlert','toaster','DiligenceDataSaveService','$state','ModalFactory','$timeout','$q', '$window', 'angularEnabled'

  initialize: ->
    @render_grid = true
    @opportunities = @ViewOpportunitiesResource.$new(type: "get")
    @isManager = @Utils.isManager()
    if @isManager
      @$window.history.back()
      return

  editInbound: (inbound)=>
    @ModalFactory.invokeModal 'edit_inbound_opportunity',
      resolve:
        inbound: => inbound
      success: (response) =>
        @render_grid = false
        @opportunities = @ViewOpportunitiesResource.$new(type: "get")
        @$timeout (=>
          @render_grid = true
        ), 1000

  displayInboundRemovalConfirmation: (inbound)=>
    @SweetAlert.confirm({
      title: "Are you sure you want to delete the opportunity?"
      type: 'warning'
      confirmButtonText: 'Yes'
      focusCancel: true
      showLoaderOnConfirm: true
      preConfirm: =>
        @removeInbound(inbound)
    })

  removeInbound: (inbound)=>
    params =
      type: 'delete',
      config_id: inbound.id
    @Restangular.all('service/dvapi_service/inbound_configuration').post(params).then ((response) =>
      @toaster.pop 'success','','Opportunity deleted successfully'
      @render_grid = false
      @opportunities = @ViewOpportunitiesResource.$new(type: "get")
      @$timeout (=>
        @render_grid = true
      ), 1000
    ),(error) =>
      @toaster.pop 'error','','Failed to delete opportunity'

  getExpiryClass: (expiryDate,row)=>
    warningThreshold = 1296000    #15 days in seconds
    diff = moment(expiryDate).diff(moment().set({'hour':0,'minute':0,'second':0,'millisecond':0}),'seconds')
    expiryStyleData = {
      class: 'text text-muted'
      text: ''
    }
    if diff <= warningThreshold and diff >= 0
      expiryStyleData = {
        class : 'text text-warning'
        text : ''
      }
    else if diff < 0
      expiryStyleData = {
        class : 'text text-danger'
        text : ''
      }
    expiryStyleData

  copyToClipboard: (inbound)=>
    navigator.clipboard.writeText(inbound.redirect_url)
    @toaster.pop 'success','','Link copied successfully'

  navigateToProjects: (inbound)=>
    if inbound.submission_count
      @DiligenceDataSaveService.setProjectsParams({
        id: inbound.id
      });
      @$state.go 'app.diligence.projects.activity', {type: 'all'}

  closeQuickActions: () =>
    @opportunities_grid.selection.clearSelectedRows()
    items_arr = @opportunities_grid.grid.rows

    _(items_arr).each (rows) =>
      rows.isSelected = false
      rows.entity.isSelected = false
      @opportunities_grid.selection.unSelectRow(rows)

    @show_bulk_actions = false
    @opportunities_grid.grid.appScope.vm.select_all = false

  toggleSelectAll: (gridApi,rows) =>
    #ui-grid handles the selectall
    #method recieves all the selected rows, loop through all the rows and check all of them group header rows
    # angular.forEach rows, (row) =>
    #   if row.treeNode.parentRow && row.treeNode.parentRow.internalRow
    #     row.treeNode.parentRow.isSelected = row.isSelected

    #get total selected rows from the grid api
    selectedCount = gridApi.selection.getSelectedRows().length
    selectAll = selectedCount > 0
    @show_bulk_actions = selectAll
    @opportunities_grid.grid.appScope.vm.select_all = selectAll
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

    #Get the number of selected rows
    @totalSelectedRecords = grid.api.selection.getSelectedRows().length

    #Show/hide bulk actions depending on the number of selected rows.
    if @totalSelectedRecords > 0
      @show_bulk_actions = true
    else
      @show_bulk_actions = false

  confirmBulkOpportunityDeletion: ->
    title = 'Are you sure you want to delete the selected Opportunities?'
    text = "Please check the selected opportunities, as you cannot undo this action."
    @SweetAlert.confirm({
      title: title
      text: text
      confirmButtonText: 'Yes, delete!'
      showLoaderOnConfirm: true
      preConfirm: =>
        @deleteSelectedResources()
    })

  deleteSelectedResources: =>
    items_arr = @opportunities_grid.selection.getSelectedRows()
    promises = []
    for item in items_arr
      item.is_active = false
      params =
        type: 'delete',
        config_id: item.id
      promises.push @Restangular.all('service/dvapi_service/inbound_configuration').post(params)

    @$q.all(promises).then =>
      swal.close()
      @closeQuickActions()
      @render_grid = false
      @opportunities = @ViewOpportunitiesResource.$new(type: "get")
      @$timeout (=>
        @render_grid = true
      ), 1000

  formatTagsTooltip: (list) ->
    if list and list.length > 2
      return _(list).tail(2).join(', ')
