class ProjectAddNotesController extends BaseController

  @register 'ProjectAddNotesController'

  @inject 'Utils', '$scope', 'SweetAlert', 'MentionsFactory', '$timeout', 'toaster', '$tinymceMentionsPlaceholderText'

  initialize: ->
    @can_edit = @$scope.note.created_by is @Utils.getCurrentUser().id
    @is_investor = @Utils.isInvestor()

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

  editNote: (note) ->
    @editing = true
    @originalNoteText = note.text

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

  updateNote: (note) ->
    if note.text
      @updating_note = true

      if note.text.length>0
        mentioned_members_ids = @MentionsFactory.getMentionedIds(note.text, true)
        if mentioned_members_ids.length>0
          note.mentions = mentioned_members_ids

      note.parentResource = null

      note.put().then (response) =>
        note.text = response.text

        @editing = false
        @updating_note = false

  cancel: (note) ->
    note.text = @originalNoteText

    @editing = false

  deleteNote: (note) ->
    @SweetAlert.confirm({
      title: 'Are you sure you want to delete this note ?'
      confirmButtonText: 'Yes, delete it!'
      focusCancel: true
    }).then (isConfirm) =>
      if isConfirm.value and isConfirm.value == true
        note.remove().then =>
          @$scope.$emit 'delete:notes', note
          @toaster.pop 'success', 'Note deleted successfully!'
        .finally => swal.close()

