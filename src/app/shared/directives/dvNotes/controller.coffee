class DvNotesController extends BaseController
  @register 'DvNotesController'

  @inject 'BaseDataService', '$attrs', '$scope', 'Restangular', 'ModalFactory', 'toaster','MentionsFactory', 'Utils',
    '$tinymceMentionsPlaceholderText', 'SweetAlert', '$timeout', '$tinymceToolbarFull', '$tinymcePlugins', 'RestangularHeaderService','ImageDataService','$tinymceStatusbar'

  initialize: ->
    @notesToolBar = ['bold italic underline | bullist numlist | link']
    deregisterer = @$scope.$parent.$watchGroup [@$attrs.entityType, @$attrs.entityId, @$attrs.notesOptions, @$attrs.entityName, @$attrs.pageUrl], (values) =>
      if values[0] && values[1] && values[2] && values[3]
        @entity_type = values[0]
        @entity_id = values[1]
        @notes_options = values[2]
        @entity_name = values[3]
        @pageUrl = values[4]
        @printOptions =
          pageTitle: @entity_name

        if @notes_options.fullscreen
          @notesToolBar = ['bold italic underline | bullist numlist | link | fullscreen footnotes | fontsizeselect | forecolor backcolor']
        if @notes_options.undoRedo
          @notesToolBar = ['bold italic underline | bullist numlist | link | undo redo footnotes | fontsizeselect | forecolor backcolor']
        if @notes_options.undoRedo && @notes_options.fullscreen
          @notesToolBar = ['bold italic underline | bullist numlist | link | undo redo | fullscreen footnotes | fontsizeselect | forecolor backcolor']

        @getNotesTypes()
        @entityDisplayName = if @Utils.getDisplayEntityType(@entity_type) then @Utils.getDisplayEntityType(@entity_type) else @entity_type
        if (@$attrs.dateFilter and @customDateFilter) or not @$attrs.dateFilter
          @getNotes()
        @initTinyMc()
        deregisterer()

    @$scope.$parent.$watch @$attrs.dateFilter, (newValue) =>
      if newValue
        @customDateFilter = newValue
        @getNotes() if @entity_id and @entity_type

    @note_id = null
    @current_user = @Utils.getCurrentUser()
    @note_types = []

    @maxAsOfDate = @Utils.getMaxAsOfDate()
    @due_date = new Date()
    @initAddActivityForm()

    @action_types = [
      {
        label: "New Note",
        value: "note",
        icon: "notepad"
      }
    ]

    @selected_action_type = @action_types[0]

  getNotes: ->
    @loadingNotes = true

    params = {
      entity_type: @entity_type
      entity_id: @entity_id
    }
    if @customDateFilter
      params.start_date = @customDateFilter.startDate
      params.end_date = @customDateFilter.endDate

    @RestangularHeaderService.RestangularWithHeader(@pageUrl).all('notes').getList(params).then (response) =>
      @notesList = response
      @loadingNotes = false

  getNotesTypes: ->
    @RestangularHeaderService.RestangularWithHeader(@pageUrl).all('touch_points').getList().then (response) =>
      @note_types = response

  setActionType: (index) =>
    @selected_action_type = @action_types[index]
    @initAddActivityForm()

  initTinyMc: =>
    @tinymceOptions =
      init_instance_callback: (editor) =>
        @tinymceEditor = editor
      images_upload_handler: (blobInfo, success, failure) =>
        @uploadImages(blobInfo,success,failure)
      skin_url: '/assets/stylesheets/tinymce/skins/tinymce-dv'
      browser_spellcheck: true
      plugins: @$tinymcePlugins
      placeholder: @$tinymceMentionsPlaceholderText
      fontsize_formats: "8pt 10pt 12pt 14pt 18pt 24pt 36pt"
      custom_undo_redo_levels: 10
      toolbar: @$tinymceToolbarFull
      paste_data_images: true
      paste_filter_drop: false
      menubar: false
      height: if @notes_options.height then @notes_options.height else 250
      statusbar: @$tinymceStatusbar
      branding: false
      resize: false
      elementpath: false
      # This options allows you disable the image dimesions input fields in the image dialog.
      image_dimensions: false
      forced_root_block : ""
      hidden_btn_groups: []
      table_toolbar: ""
      content_css : 'assets/stylesheets/tiny_mce_custom.css'
      render: (editor) =>
        @$timeout => #since this comes from a event handler in tinymce
          @ModalFactory.invokeModal 'questionnaire_upload_image',
            resolve:
              editor: -> editor
    @tinymceOptions


  editNote: (note) ->
    @add_new_activity.text = note.text
    @add_new_activity.type = note.type_id
    @add_new_activity.as_of_date = new Date(note.as_of_date)
    @note_id = note.id

    @selected_action_type = @action_types[0]

    $('html, body').animate { scrollTop: $('#new-notes-section-div').offset().top - 150 }, 500

  initAddActivityForm: =>
    @note_id = null
    @add_new_activity = {}
    @add_new_activity.as_of_date = new Date()
    @add_new_activity.type = 1116 #General note as default to save user a click
    @add_new_activity.assigned_to = @current_user.id #assign to self as default
    @add_activities_form_new?.$setPristine()
    @add_activities_form_new?.$setUntouched()

  activityAdditionSuccessful: (message) =>
    @saving_activity = false
    @toaster.pop 'success', '', message
    @initAddActivityForm()



  uploadImages: (blobInfo,success,failure) =>
    @uploading_image = true
    @resultBlob = @b64toBlob(blobInfo.base64())
    @resultBlob.name = blobInfo.filename()
    @ImageDataService.uploadImage(@resultBlob).success((uploaded_file) =>
      success(uploaded_file[0].blobUrl)
      @uploading_image = false
    ).error((error)=>
      @uploading_image = false
    )

  b64toBlob : (b64Data, contentType = '', sliceSize = 512) =>
    byteCharacters = atob(b64Data)
    byteArrays = []
    offset = 0
    while offset < byteCharacters.length
      slice = byteCharacters.slice(offset, offset + sliceSize)
      byteNumbers = new Array(slice.length)
      i = 0
      while i < slice.length
        byteNumbers[i] = slice.charCodeAt(i)
        i++
      byteArray = new Uint8Array(byteNumbers)
      byteArrays.push byteArray
      offset += sliceSize
    blob = new Blob(byteArrays, type: contentType)
    blob

  addActivity: =>
    tinymce.activeEditor.uploadImages (success) =>
      if @add_activities_form_new.$valid
        @saving_activity = true
        @add_new_activity.entity_id = @entity_id
        @add_new_activity.entity_type = @entity_type
        apiObj = {}
        apiObj = JSON.parse(JSON.stringify(@add_new_activity));
        apiObj.text = @tinymceEditor.getContent()
        if apiObj.as_of_date
          apiObj.as_of_date = moment(apiObj.as_of_date).format("DD-MMMM-YYYY")
        if apiObj.text.length>0
          mentioned_members_ids = @MentionsFactory.getMentionedIds(apiObj.text, true)
        if @selected_action_type.value == 'note'
          if mentioned_members_ids.length>0
            apiObj.mentions = mentioned_members_ids
          if @note_id
            @RestangularHeaderService.RestangularWithHeader(@pageUrl).one('notes', @note_id ).customPUT(apiObj).then ((response) =>
              message = 'Your notes are updated!'
              @activityAdditionSuccessful(message)
              idx = _.indexOf(_.pluck(@notesList, 'id'), response.id)
              @notesList.splice(idx,1)
              @notesList.unshift response
            ),(error) =>
              @saving_activity = false
          else
            @RestangularHeaderService.RestangularWithHeader(@pageUrl).all('notes').customPOST(apiObj).then ((response) =>
              message = 'Your notes are added!'
              @activityAdditionSuccessful(message)
              @notesList.unshift response
            ),(error) =>
              @saving_activity = false

        else
          @saving_activity = false
      else
        if @add_activities_form_new.newNoteSection.$invalid
          @toaster.pop 'error', '', 'Please add notes text'

  filterTeamMembers: (term) =>
    @filteredTeamMembers = @MentionsFactory.getFilteredMembers(term)

  getDisplayName: (user) =>
    @$timeout =>
      @tinymceEditor.insertContent('');
    , 300
    return @MentionsFactory.getDisplayName(user, true)

  deleteNoteFromUI: (index) =>
    @notesList.splice(index, 1)
    @toaster.pop 'success', '', 'Deletion successful', 5000
    swal.close()

  deleteNote: (note, index) =>
    noteType = if note.type == 'Email' then 'Email' else 'Note'
    @SweetAlert.confirm({
      title: 'Are you sure you want to delete this '+noteType+'?'
      confirmButtonText: 'Yes, Please!'
      showLoaderOnConfirm: true
      focusCancel: true
      preConfirm: =>
        if note.type == 'Email'
          @BaseDataService.deleteEmail(note.id).then =>
            @deleteNoteFromUI(index)
          .finally => swal.close()
        else
          @BaseDataService.deleteNote(note.id).then =>
            @deleteNoteFromUI(index)
          .finally => swal.close()
    })
        
