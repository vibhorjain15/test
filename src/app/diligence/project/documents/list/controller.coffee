class ProjectDocumentsListController extends BaseController

  @register 'ProjectDocumentsListController'

  @inject 'Utils', 'DueDiligenceDataservice', '$stateParams', '$scope', 'DocumentsService',
          '$state', 'Restangular', 'toaster', 'SweetAlert', 'DocumentListResource',
          'BaseDataService', 'DocumentDataservice', 'MentionsFactory', '$timeout', 'ModalFactory',
          '$tinymceMentionsPlaceholderText'

  initialize: ->
    @is_investor = @Utils.isInvestor()
    @is_doc_to_html_enabled = @Utils.isDocToHtmlEnabled()
    @searchText = @$state.params.q || ''
    @isSearchResults = (@$state.params.status == 'Search')
    @freeSubscription = @Utils.isFreeSubscription()
    @isFreeManager = @Utils.isFreeManager()
    @documents = @DocumentListResource.$new({entity_id: @$stateParams.diligenceId, entity_type: 'DueDiligence', q: @searchText})
    @searchResultTemplateUrl = 'shared/ui-grid-cell-templates/search-result-popover.html'
    @previewClicked = false
    @current_user = @Utils.getCurrentUser()

    @$scope.getDueDiligence().then (diligence) =>
      @diligence = diligence

      if @current_user and @current_user.firmInfo
        permissions_enabled = @current_user.firmInfo.hasPermissionEnabled
        if permissions_enabled
          @diligence.hasReadOnlyAccess = false
        else
          @diligence.isLocked = @diligence.isLocked || @diligence.hasReadOnlyAccess

    @$scope.$on 'delete:notes', (evt, note) =>
      idx = @attachment_notes.indexOf(note)

      @attachment_notes.splice idx, 1

      @target_attachment.noteCount--

    @$scope.$parent.ProjectDocumentsListController = @

    @tinymceOptions =
      init_instance_callback: (editor) =>
        @tinymceEditor = editor
        editor.on 'paste', (e) =>
          @tinymceEditor.insertContent('')
      skin_url: '/assets/stylesheets/tinymce/skins/tinymce-dv'
      browser_spellcheck: true
      placeholder: @$tinymceMentionsPlaceholderText
      toolbar: false
      menubar: false
      statusbar: false
      content_css : 'assets/stylesheets/tiny_mce_custom.css'
      forced_root_block : ""

    @tinymceOptionsEdit =
      init_instance_callback: (editor) =>
        @tinymceEditEditor = editor
      skin_url: '/assets/stylesheets/tinymce/skins/tinymce-dv'
      browser_spellcheck: true
      placeholder: @$tinymceMentionsPlaceholderText
      toolbar: false
      menubar: false
      statusbar: false
      content_css : 'assets/stylesheets/tiny_mce_custom.css'
      forced_root_block : ""

  isDocumentUploadByCurrentFirm: (firmInfo) ->
    @Utils.isDocumentUploadByCurrentFirm(firmInfo)

  filterTeamMembers: (term) =>
    @filteredTeamMembers = @MentionsFactory.getFilteredMembers(term)

  formatTagsTooltip: (tagsList) ->
    @DocumentsService.formatTagsTooltip(tagsList)

  getSignedURL: (entity) ->
    @DocumentsService.getSignedURL(entity)

  getContextValue: (grid, row, col) ->
    return @DocumentsService.documentGroupName(grid, row, col)

  getDisplayName: (user) =>
    @$timeout =>
      if @tinymceEditor
        @tinymceEditor.insertContent('')
      if @tinymceEditEditor
        @tinymceEditEditor.insertContent('')
    , 300
    return @MentionsFactory.getDisplayName(user, true)

  redirectToSummary: ->
    #summary is at this routes grandparent level, so go two levels up.
    @$state.go '^.^.summary'

  showPreviewIcon: (document) ->
    Boolean document.highlights? and Object.keys(document.highlights).length != 0

  showNotesBtn: ->
    @is_investor

  displayNotesController: (attachment) ->
    @sidebarTemplate = 'diligence/project/documents/list/add_notes.html'
    @sidebarTitle = 'Add Notes'
    @sidebarContent = 'notes'
    @displaySidebarPanel = true

    @new_note = {}
    @target_attachment = attachment
    @getNotes(attachment.entity_id)

    @resetForm()

  resetForm: ->
    @new_note = {}
    @add_notes_form?.$setPristine()
    @add_notes_form?.$setUntouched()

  getNotes: (id) ->
    @loading_attachment_notes = true

    @DocumentDataservice.getNotes('Attachment', id).then (response) =>
      @attachment_notes = response
      @loading_attachment_notes = false

  saveNotes: ->
    if @add_notes_form.$valid
      @saving_notes = true
      id = @target_attachment.id

      if @new_note.text.length>0
        mentioned_members_ids = @MentionsFactory.getMentionedIds(@new_note.text, true)
        if mentioned_members_ids.length>0
          @new_note.mentions = mentioned_members_ids

      notesParams =
        entity_type: 'Attachment'
        entity_id: @$stateParams.diligenceId
        text: @new_note.text
        mentions: @new_note.mentions
        type: 'General'
      @DocumentDataservice.createNote(notesParams).then ((response) =>
        message = 'Your notes are added!'

        @attachment_notes.unshift(response)

        @target_attachment.noteCount++

        @saving_notes = false
        @toaster.pop 'success', '', message
        @resetForm()
      ), (error) =>
        @saving_notes = false

  confirmDocumentDeletion: (attachment) ->
    @SweetAlert.confirm({
      title: "Are you sure you want to remove this attachment?"
      focusCancel: true
      showLoaderOnConfirm: true
      preConfirm: =>
        @removeAttachment(attachment)
    })

  disableActionButton: ->
    if @diligence? and @diligence.status?
      return !@is_investor and @diligence.status == 'Completed'

  showDocumentAction: (document) ->
    @Utils.isDocumentUploadByCurrentFirm(document.owner_firm_id)

  openUploadDocumentModal: () ->
    @$scope.$parent.vm.openUploadDocumentModal()

  openDocumentUpdateDialog: (attachment) ->
    @ModalFactory.invokeModal 'manage_document',
      resolve:
        documentOptions: =>
          editAccessGranted: @showDocumentAction attachment
          mode: 'update'
          document: attachment
          managerCheck: true
      success: (uploadedResponse) =>
        if (uploadedResponse)
          @documents.refresh()
          @documentsListGrid.selection.clearSelectedRows()


  openDocumentShareDialog: (attachment) ->
    entityId = @$stateParams.diligenceId
    @ModalFactory.invokeModal 'share_document',
      resolve:
        document: -> attachment
        entityType: -> 'DueDiligence'
        entityId: -> entityId
      success: =>
        @documentsListGrid.selection.clearSelectedRows()

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



  openRow: (row,col)=>
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
    entityId = parseInt(@diligence.id)
    attachment_ids = []
    for attachment in @documentsListGrid.selection.getSelectedRows()
      attachment_ids.push attachment.attachment_id
    @ModalFactory.invokeModal 'manage_bulk_document',
      resolve:
        documentOptions: ->
          type: 'move'
          sourceEntityId: entityId
          sourceEntityType: 'DueDiligence'
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
    entityId = parseInt(@diligence.id)
    attachment_ids = []
    for attachment in @documentsListGrid.selection.getSelectedRows()
      attachment_ids.push attachment.attachment_id
    @ModalFactory.invokeModal 'manage_bulk_document',
      resolve:
        documentOptions: ->
          type: 'remove'
          sourceEntityId: entityId
          sourceEntityType: 'DueDiligence'
          documentsList: attachment_ids
      success: (response) =>
        @documents.refresh()
        @documentsListGrid.selection.clearSelectedRows()
        @$scope.$parent.vm.getDocumentCounts(entityId)

  copyAllDocumentsOpenDialog: ()->
    if @freeSubscription
      return
    entityId = parseInt(@diligence.id)
    attachment_ids = []
    for attachment in @documentsListGrid.selection.getSelectedRows()
      attachment_ids.push attachment.attachment_id
    @ModalFactory.invokeModal 'manage_bulk_document',
      resolve:
        documentOptions: ->
          type: 'copy'
          sourceEntityId: entityId
          sourceEntityType: 'DueDiligence'
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