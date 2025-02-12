class SidebarNotesController extends BaseController
  @register 'SidebarNotesController'
  @inject 'getNotesFn', 'createNoteFn', 'toaster', 'zero_notes_message', 'Utils', 'MentionsFactory', '$timeout', '$scope', '$tinymceMentionsPlaceholderText'

  initialize: ->
    @loading_notes = true
    @new_note = {}
    @resetForm(@add_notes_form)
    isFreeSubscription = @Utils.isFreeSubscription()

    @getNotesFn().then (response) =>
      @notes = response

      @loading_notes = false

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
      table_toolbar: ""

    @tinymceOptionsEdit =
      init_instance_callback: (editor) =>
        @tinymceEditEditor = editor
      skin_url: '/assets/stylesheets/tinymce/skins/tinymce-dv'
      browser_spellcheck: true
      toolbar: false
      menubar: false
      statusbar: false
      content_css : 'assets/stylesheets/tiny_mce_custom.css'
      forced_root_block : ""

    @$scope.$on 'delete:notes', (event, note) =>
      @removeNote(note)

  removeNote: (deletedNote) =>
    _(@notes).each (note, i) =>
      if note && note.id == deletedNote.id
        @notes.splice i, 1

  saveNotes: ->
    if @add_notes_form.$valid
      @saving_notes = true

      if @new_note.text.length>0
        mentioned_members_ids = @MentionsFactory.getMentionedIds(@new_note.text, true)
        if mentioned_members_ids.length>0
          @new_note.mentions = mentioned_members_ids

      @createNoteFn(@new_note).then ((response) =>
        message = 'Your notes are added!'

        @notes.unshift(response)
        @saving_notes = false
        @new_note = {}
        @resetForm(@add_notes_form)
        @toaster.pop 'success', '', message
      ), (error) =>
        @saving_notes = false

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

  resetForm: (form) ->
    form?.$setPristine()
    form?.$setUntouched()
