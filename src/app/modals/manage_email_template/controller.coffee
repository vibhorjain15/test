class ManageEmailTemplateController extends ModalController

  @register 'ManageEmailTemplateController'

  @inject '$uibModalInstance', 'template', 'toaster', 'Restangular', 'ModalFactory', '$timeout', '$tinymceToolbar1' , '$tinymceToolbar2', '$tinymcePlugins', 'existing_email_templates', '$q','$tinymceStatusbar'

  initialize: ->
    @this_is_default_template = false
    @edit_mode = false
    @params = {}
    if @existing_email_templates and @existing_email_templates.length == 0
      @make_it_default = true
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

    if (@template)
      @params = angular.copy(@template)
      @edit_mode = true
      if @template.is_default
        @make_it_default = false
        @this_is_default_template = true

    promises = []

    promises.push @Restangular.one('firm_preferences').customGET().then (response) =>
      @firm_preferences = response
      @firm_preferences_copy = angular.copy(@firm_preferences)

    @$q.all(promises).then (=>
      @loading = false
    )

  makeTemplateDefault: ->
    @Restangular.all('firm_preferences').customPUT(@firm_preferences_copy)

  save: ->
    if @email_templates_form.$valid
      @saving = true
      templateMsg = 'Template successfully updated'
      if @edit_mode
        request = @Restangular.one('EmailTemplateMessages', @params.id).customPUT(@params)
      else
        request = @Restangular.all('EmailTemplateMessages').post(@params)
        templateMsg = "Template successfully created"
      request.then ((response) =>
        if @make_it_default
          @firm_preferences_copy.default_email_template_message_id = response.id
          @firm_preferences_copy.customize_intro = true
          @makeTemplateDefault().then (=>
            @saving = false
            @close(response)
            @toaster.pop 'success', '', templateMsg
          ), ((error) =>
            @saving = false
            @close(response)
          )
        else
            @saving = false
            @toaster.pop 'success', '', templateMsg
            @close(response)
      ), ((error) =>
        @saving = false
      )
