class RejectPendingRequestController extends ModalController

  @register 'RejectPendingRequestController'

  @inject '$uibModalInstance', '$tinymceToolbar1' , '$tinymceToolbar2', '$tinymcePlugins', '$timeout', '$tinymceStatusbar', 'ModalFactory'

  initialize: ->
    @params = {}
    @tinymceOptions =
      skin_url: '/assets/stylesheets/tinymce/skins/tinymce-dv'
      browser_spellcheck: true
      height: 180
      plugins: @$tinymcePlugins
      custom_undo_redo_levels: 10
      toolbar1: @$tinymceToolbar1
      toolbar2: @$tinymceToolbar2
      menubar: false
      statusbar: @$tinymceStatusbar
      branding: false
      resize: false
      elementpath: false
      image_dimensions: false
      forced_root_block : ""
      content_css : 'assets/stylesheets/tiny_mce_custom.css'
      table_toolbar: ""
      render: (editor) =>
        @$timeout => #since this comes from a event handler in tinymce
          @ModalFactory.invokeModal 'questionnaire_upload_image',
            resolve:
              editor: -> editor

  submit: ->
    @close(@params.value)
