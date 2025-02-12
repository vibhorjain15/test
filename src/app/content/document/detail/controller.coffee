class DocumentDetailController extends BaseController

  @register 'DocumentDetailController'

  @inject 'DocumentDataservice', '$stateParams', 'SweetAlert', 'MentionsFactory', '$timeout', 'Utils', 'DocumentsService',
    'ModalFactory', 'toaster', 'Restangular', '$window', 'BaseDataService', '$scope', '$state', 'baseUrl', '$rootScope',
    '$tinymceMentionsPlaceholderText' , 'angularEnabled'

  initialize: ->
    documentId = @$stateParams.documentId
    @documentId = @$stateParams.documentId
    @pageUrl = @DocumentsService.getDocumentPageUrl()

    @current_user = @Utils.getCurrentUser()
    if @Utils.isInvestor()
      @counterparty = 'Manager'
    else
      @counterparty = 'Investor'

    @BaseDataService.getTeamMembers().then (response) =>
      @getDocument(documentId, response)

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

    @$scope.$on 'delete:notes', (event, note) =>
      @removeNote(note)

  getDocument: (id, team_members) =>
    @DocumentDataservice.getDocument(id,@pageUrl).then (response) =>
      @document = response

      @canUserModify = @Utils.isDocumentUploadByCurrentFirm(@document.owner_firm_id)
      @sortTags()
      @getNotes(@documentId)
      @getDocumentReviews(@documentId)

      if @canUserModify
        @getDocumentVersions(@$stateParams.documentId)
        @getDocumentAssignments(@$stateParams.documentId)

      reviews = response.reviews

      if reviews?
        reviewed_by_me = !!_(reviews).findWhere(userID: @current_user.id)
      else
        reviewed_by_me = false

      @document.is_image = @isImage(response)
      @document.reviewed_by_me = reviewed_by_me
      @document.reviewer_names = _(reviews).map (review) ->
        user = _(team_members).findWhere(id: review.userID)
        _([user.firstName, user.lastName]).compact().join(" ")

  sortTags: () =>
    @document.tag_names = _(@document.tag_names).sortBy((tag) =>
      tag.toLowerCase()
    )

  isImage: (attachment) ->
    file_name = attachment.file_name
    image_file_extensions = ['png', 'jpg', 'jpeg', 'gif']
    file_extension = _(file_name.split('.')).last()

    file_extension.toLowerCase() in image_file_extensions

  getDocumentVersions: (id) ->
    @DocumentDataservice.getDocumentVersions(id,@pageUrl).then ((response) =>
      @document_versions = response
    ), ((error) =>
      @document_versions = []
    )

  getDocumentAssignments: (id) ->
    @DocumentDataservice.getDocumentAssignments(id,@pageUrl).then ((response) =>
      @document_assignments = response
    ), ((error) =>
      @document_assignments = []
    )

  getDocumentReviews: (id) ->
    @DocumentDataservice.getAttachmentReviews(id,@pageUrl).then (response) =>
      @documentReviews = response

  formatDocumentGroupTooltip: (groupList) ->
    return groupList.join(', ')

  viewDocument: (entity) ->
    @DocumentsService.getSignedURL(entity)

  filterTeamMembers: (term) =>
    @filteredTeamMembers = @MentionsFactory.getFilteredMembers(term)

  getDisplayName: (user) =>
    @$timeout =>
      if @tinymceEditor
        @tinymceEditor.insertContent('')
      if @tinymceEditEditor
        @tinymceEditEditor.insertContent('')
    , 300
    return @MentionsFactory.getDisplayName(user, true)

  getNotes: (id) ->
    @loadingNotes = true
    @DocumentDataservice.getNotes('Attachment', id, @pageUrl)
      .finally => @loadingNotes = false
      .then (response) =>
        @documentNotes = response

  saveNotes: =>
    if @add_notes_form.$valid
      @saving_notes = true

      if @new_note.text.length > 0
        mentioned_members_ids = @MentionsFactory.getMentionedIds(@new_note.text, true)
        if mentioned_members_ids.length > 0
          @new_note.mentions = mentioned_members_ids

      notesParams =
        entity_type: 'Attachment'
        entity_id: @$stateParams.documentId
        text: @new_note.text
        type: 'General'
      @DocumentDataservice.createNote(notesParams,@pageUrl).then((response) =>
        message = 'Your notes are added!'
        @documentNotes.unshift response
        @toaster.pop 'success', '', message
        @resetForm()
      )
      .finally(=> @saving_notes = false)

  displayNotesController: () ->
    @sidebarTemplate = 'content/docuemnt/detail/add_notes.html'
    @sidebarTitle = 'Add Notes'
    @sidebarContent = 'notes'
    @displaySidebarPanel = true

    @new_note = {}
    @target_attachment = @document
    @resetForm()

  closeSidebarPanel: =>
    if @$scope.hasOwnProperty('has_unsaved_changes')
      scope_has_unsaved_changes = false
      for key of @$scope.has_unsaved_changes
        if @$scope.has_unsaved_changes.hasOwnProperty(key)
          if @$scope.has_unsaved_changes[key]
            scope_has_unsaved_changes = true
            break
      if scope_has_unsaved_changes
        @SweetAlert.confirm({
          title: "You have unsaved changes on this page"
          text: "All your unsaved changes will be lost if you leave this page"
          cancelButtonText: 'Do Not Save'
          confirmButtonText: 'Save & Exit'
          showCloseButton: true
          reverseButtons: false
          customClass: 'danger-on-cancel'
          showLoaderOnConfirm: true
          preConfirm: =>
            @$rootScope.$broadcast('dv_input_alert:save_changes')
            @$timeout =>
              @displaySidebarPanel = false
            , 1000
        }).then (isConfirm) =>
          if isConfirm.dismiss and isConfirm.dismiss == 'cancel'
            @$rootScope.$broadcast('dv_input_alert:leave_page')
            @$timeout =>
              @displaySidebarPanel = false

      else
        @displaySidebarPanel = false
    else
      @displaySidebarPanel = false

  addTask: =>
    @ModalFactory.invokeModal 'manage_task',
      resolve:
        task: =>
          entity_type: 'Attachment'
          entity_id: @documentId
          pageUrl: @pageUrl
      success: =>
        @refreshTasksList = !@refreshTasksList

  triggerWorkflow: =>
    @ModalFactory.invokeModal 'trigger_workflow',
      resolve:
        workflow: =>
          entity_type: 'Document'
          entity_id: @documentId
          name: @document.name

  resetForm: ->
    @new_note = {}
    @add_notes_form?.$setPristine()
    @add_notes_form?.$setUntouched()

  canEditNote: (note) ->
    note.created_by is @Utils.getCurrentUser().id

  removeNote: (deletedNote) ->
    noteIndex = _(@documentNotes).findIndex (note) ->
      note.id == deletedNote.id
    @documentNotes.splice noteIndex, 1

  displayAttachmentReviewConfirmation: () ->
    @SweetAlert.confirm({
      title: "Are you sure you want to mark this attachment as reviewed?"
      confirmButtonText: 'Yes'
      showLoaderOnConfirm: true
      preConfirm: =>
        @markAsReviewed(@document)
    })

  markAsReviewed: (attachment) ->
    @DocumentDataservice.reviewAttachment(attachment.id, @pageUrl).then ((response) =>
      @documentReviews.push response
      @toaster.pop 'success', '', 'Attachment marked as reviewed successfully'
      swal.close()
    ), ((error) =>
      swal.close()
      avoid_error_logging_statuses = @BaseDataService.getAvoidErrorLoggingStatusList()
      if !(error.status in avoid_error_logging_statuses)
        @Utils.logError('Marking document as reviewed failed', error)
    )


  revokeAccess: (id) ->
    @DocumentDataservice.revokeAttachmentAccess(id,@pageUrl).then (response) =>
      @toaster.pop 'success', '', 'Document access has been revoked successfully'
      _(@document_assignments).each (document, idx) ->
        if (document.id == id)
          @document_assignments.splice idx, 1
    .finally => swal.close()

  confirmAccessRevoke: (document_accessor) ->
    @SweetAlert.confirm({
      title: "Are you sure you want to revoke access from #{document_accessor.name}?"
      showLoaderOnConfirm: true
      focusCancel :  true
      preConfirm: =>
        @revokeAccess(document_accessor.id)
    }).then (isConfirm) =>
        @getDocumentAssignments @$stateParams.documentId


  openDocumentUpdateDialog: (document) ->
    @ModalFactory.invokeModal 'manage_document',
      resolve:
        documentOptions: =>
          editAccessGranted: @canUserModify
          source: 'detail'
          mode: 'update'
          document: document
      success: (attachment) =>
        if @canUserModify
          @getDocumentVersions @$stateParams.documentId
        if attachment == "refresh"
          @document = document
        else
          @document = attachment
        @sortTags()

  openDocumentShareDialog: (attachment) ->
    attachment.attachment_id = attachment.id
    entityId = @current_user.firmInfo.id
    @ModalFactory.invokeModal 'share_document',
      resolve:
        document: -> attachment
        entityType: -> 'Firm'
        entityId: -> entityId
      success: () =>
        if @canUserModify
          @getDocumentAssignments @$stateParams.documentId

  confirmDocumentDeletion: (attachment) ->
    @SweetAlert.confirm({
      title: "Are you sure you want to remove this attachment?"
      focusCancel: true
      showLoaderOnConfirm: true
      preConfirm: =>
        @removeAttachment(attachment)
    })


  removeAttachment: (attachment) ->
    @Restangular.one('attachments', attachment.id).remove().then (=>
      swal.close()
      @toaster.pop 'success', '', 'Attachment successfully unassigned'
      @$state.go 'app.home'
    ), ((error) =>
      swal.close()
    )

  # removeAttachment: (attachment) ->
  #   @Restangular.one('attachments', attachment.id).remove().then(=>
  #     @toaster.pop 'success', '', 'Attachment successfully unassigned'
  #     @$state.go 'app.home'
  #   ).finally (=>
  #     swal.close() #stupid angular-sweetalert guy isn't tagging the updated code!
  #   )

  goToPreviousPage: () ->
    if @$window.history.length > 1
      @$window.history.back()
    else
      @$state.go 'app.content.documents'

  getVersionedDocument: (attachment) ->
    @toaster.pop 'wait', '', 'Requested document is being processed, please wait...', 10000
    @Restangular.one('attachments', attachment.attachment_id).all('signed_url').customGET('', {version: attachment.version}).then((response)=>
      openNewTab(response)
    ).finally (=>
      @toaster.clear()
    )

  openNewTab = (url) ->
    $link = $("<a href=\"#{url}\" target='_blank' class='hidden'></a>")
    $('body').append($link)
    $link[0].click()
    $link.remove()
