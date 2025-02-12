class ManageDisclaimerController extends ModalController

  @register 'ManageDisclaimerController'

  @inject '$uibModalInstance', 'disclaimer', 'toaster', 'Restangular', 'ModalFactory', '$timeout', '$tinymceToolbar1' , '$tinymceToolbar2', '$tinymcePlugins','$tinymceStatusbar'

  initialize: ->
    @edit_mode = false
    @tinymceOptions =
      skin_url: '/assets/stylesheets/tinymce/skins/tinymce-dv'
      browser_spellcheck: true
      height: 250
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

    if (@disclaimer)
      @params = angular.copy(@disclaimer)
      @edit_mode = true


  save: ->
    if @disclaimer_form.$valid
      @saving = true

      if @edit_mode
        @Restangular
          .one('disclaimers', @params.id).customPUT(@params)
          .then (response) =>
            @saving = false
            @close(response)
          .finally => @toaster.pop 'success', '', 'Disclaimer successfully updated'
      else
        @Restangular
          .all('disclaimers').post(@params)
          .then (response) =>
            @saving = false
            @close(response)
          .finally => @toaster.pop 'success', '', 'Disclaimer successfully added'
