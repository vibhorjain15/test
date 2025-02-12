class VehiclesDocumentsListController extends BaseController

  @register 'VehiclesDocumentsListController'

  @inject '$stateParams', '$scope', '$state', 'DocumentListResource', 'Restangular', 'toaster', 'SweetAlert',
    'Utils', 'ModalFactory', 'DocumentsService', 'DocumentDataservice', 'entityTypeValue'

  initialize: ->
    @is_investor = @Utils.isInvestor()
    @entity_id = @$stateParams.vehicleId
    @searchText = @$state.params.q || ''
    @isSearchResults = (@$state.params.status == 'Search')
    @freeSubscription = @Utils.isFreeSubscription()
    @isFreeManager = @Utils.isFreeManager()
    @documents = @DocumentListResource.$new({entity_id: @$stateParams.vehicleId, entity_type: 'Vehicle', q: @searchText})
    @searchResultTemplateUrl = 'shared/ui-grid-cell-templates/search-result-popover.html'
    @$scope.$parent.VehiclesDocumentsListController = @
    @previewClicked = false

  isDocumentUploadByCurrentFirm: (firmInfo) ->
    @Utils.isDocumentUploadByCurrentFirm(firmInfo)

  redirectToSummary: ->
    @$state.go 'app.diligence.project.summary'

  showPreviewIcon: (document) ->
    Boolean document.highlights? and Object.keys(document.highlights).length != 0

  formatTagsTooltip: (tagsList) ->
    @DocumentsService.formatTagsTooltip(tagsList)

  getSignedURL: (entity) ->
    @DocumentsService.getSignedURL(entity)

  getContextValue: (grid, row, col) ->
    return @DocumentsService.documentGroupName(grid, row, col)

  showDocumentAction: (document) ->
    @Utils.isDocumentUploadByCurrentFirm(document.owner_firm_id)

  confirmDocumentDeletion: (attachment) ->
    @SweetAlert.confirm({
      title: "Are you sure you want to remove this attachment?"
      showLoaderOnConfirm: true
      focusCancel: true
      preConfirm: =>
        @removeAttachment(attachment)
    })

  removeAttachment: (attachment) ->
    @Restangular.one('attachmentassignments', attachment.id).remove().then (=>
      swal.close()
      @$scope.$parent.vm.documentCount--
      @toaster.pop 'success', '', 'Attachment successfully unassigned'
      @documents.refresh()
      @documentsListGrid.selection.clearSelectedRows()
    ), ((error) =>
      swal.close()
    )

  openDocumentUpdateDialog: (attachment) ->
    @ModalFactory.invokeModal 'manage_document',
      resolve:
        documentOptions: =>
          editAccessGranted: @showDocumentAction attachment
          document: attachment
          source: 'list'
          mode: 'update'
      success: (response) =>
        if response
          @documents.refresh()
          @documentsListGrid.selection.clearSelectedRows()

  openDocumentShareDialog: (attachment) ->
    entityId = @$stateParams.vehicleId
    @ModalFactory.invokeModal 'share_document',
      resolve:
        document: -> attachment
        entityType: -> 'Vehicle'
        entityId: -> entityId
      success: =>
        @documentsListGrid.selection.clearSelectedRows()

  generatePageUrl: (entity)=>
    pageUrl = "app/vehicles/#{entity.entity_id}/profile/documents/#{entity.id}"
    pageUrl

  openRow: (row,col)=>
    pageUrl = @generatePageUrl(row.entity)
    @DocumentsService.setDocumentPageUrl(pageUrl)
    if !row.internalRow && col.field != "selectionRowHeaderCol" && !@previewClicked && col.field != 'action'
      url = ""
      if !row.entity.attachment_id
        url = @$state.href("app.content.document.detail",{documentId: row.entity.id})
      else if row.entity.attachment_id
        url = @$state.href("app.content.document.detail",{documentId: row.entity.attachment_id})

      if @isSearchResults && @searchText.length
        window.open(url,'_blank')
      else
        window.location.hash = url

    else if @previewClicked
      @previewClicked = false

  clearSelection: (grid,column) =>
    grid.api.selection.clearSelectedRows()

  clearGrouping: (grid,column)=>
    grid.api.grouping.clearGrouping()
    @clearSelection(grid,column)

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
    @documentsListGrid.grid.appScope.vm.select_all = selectAll
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

  downloadURI: (uri) =>
    link = document.createElement('a')
    link.href = uri
    document.body.appendChild link
    link.click()
    document.body.removeChild link

  downloadAllDocuments: () =>
    @downoadingDocuments = true
    @toastInstance = @toaster.pop({type: 'info', title: 'Processing Your Files For Download...', body: 'Please wait while the zip file is being generated.', timeout: 0})
    @DocumentDataservice.downloadAllDocuments(@documentsListGrid).then ((response) =>
      @toaster.clear(@toastInstance)
      @downloadURI(response.data.url)
      @downoadingDocuments = false
    ), (error) =>
      @downoadingDocuments = false
      @toaster.clear(@toastInstance)

  moveAllDocumentsOpenDialog: ()->
    if @freeSubscription
      return
    entityId = parseInt(@entity_id)
    attachment_ids = []
    for attachment in @documentsListGrid.selection.getSelectedRows()
      attachment_ids.push attachment.attachment_id
    @ModalFactory.invokeModal 'manage_bulk_document',
      resolve:
        documentOptions: ->
          type: 'move'
          sourceEntityId: entityId
          sourceEntityType: 'Vehicle'
          documentsList: attachment_ids
      success: (response) =>
        @documents.refresh()
        @documentsListGrid.selection.clearSelectedRows()
        @$scope.$parent.vm.getDocumentCounts(entityId)

  removeAllDocumentsOpenDialog: ()->
    if @freeSubscription
      return
    if @freeSubscription
      return
    entityId = parseInt(@entity_id)
    attachment_ids = []
    for attachment in @documentsListGrid.selection.getSelectedRows()
      attachment_ids.push attachment.attachment_id
    @ModalFactory.invokeModal 'manage_bulk_document',
      resolve:
        documentOptions: ->
          type: 'remove'
          sourceEntityId: entityId
          sourceEntityType: 'Vehicle'
          documentsList: attachment_ids
      success: (response) =>
        @documents.refresh()
        @documentsListGrid.selection.clearSelectedRows()
        @$scope.$parent.vm.getDocumentCounts(entityId)

  copyAllDocumentsOpenDialog: ()->
    if @freeSubscription
      return
    entityId = parseInt(@entity_id)
    attachment_ids = []
    for attachment in @documentsListGrid.selection.getSelectedRows()
      attachment_ids.push attachment.attachment_id
    @ModalFactory.invokeModal 'manage_bulk_document',
      resolve:
        documentOptions: ->
          type: 'copy'
          sourceEntityId: entityId
          sourceEntityType: 'Vehicle'
          documentsList: attachment_ids
      success: (response) =>
        @documents.refresh()
        @documentsListGrid.selection.clearSelectedRows()
        @$scope.$parent.vm.getDocumentCounts(entityId)
 
  closeQuickActions: () =>
    @documentsListGrid.selection.clearSelectedRows()
    items_arr = @documentsListGrid.grid.rows

    _(items_arr).each (rows) =>
      rows.isSelected = false
      rows.entity.isSelected = false
      @documentsListGrid.selection.unSelectRow(rows)

    jQuery('input[type="checkbox"]').each (ind) ->
      jQuery(this).prop 'checked', false
      return

    @$scope.vm.show_bulk_actions = false
    @documentsListGrid.grid.appScope.vm.select_all = false