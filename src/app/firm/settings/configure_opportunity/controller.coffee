class ConfigureOpportunityController extends BaseController
  @register 'ConfigureOpportunityController'

  @inject '$scope', 'Restangular', '$q', 'TemplatesDataService', 'BaseDataService', '$tinymcePlugins','$tinymceStatusbar', '$tinymceToolbarFull', 'ModalFactory','toaster','Utils','$timeout','keywordConstants','angularEnabled'

  initialize: ->
    @minDate = new Date()
    @current_user = @Utils.getCurrentUser()

    promises = []
    promises.push @fetchEmployees()
    promises.push @getTemplates()
    promises.push @Restangular.all('EmailTemplateMessages').getList()
    promises.push @Restangular.all('Inbound_configuration_visibility_types').getList()

    @$q.all(promises).then (response)=>
        @emailTemplates = response[2]
        @visibilities = response[3]
        @defaultVisibility = _(@visibilities).find((visibility)=>
          visibility.name == 'Public'
        )
        @params = {
          type : 'insert'
          contacts: [@current_user.id]
          visibility_type: if @defaultVisibility then @defaultVisibility.id else null
        }

    @tinymceOptions =
      skin_url: '/assets/stylesheets/tinymce/skins/tinymce-dv'
      browser_spellcheck: true
      height: 250
      plugins: @$tinymcePlugins
      custom_undo_redo_levels: 10
      toolbar: 'bold italic underline | alignleft aligncenter alignright alignjustify | superscript | forecolor backcolor | link dv_img_selector | bullist numlist | hr | undo redo | fullscreen'
      toolbar_mode: 'wrap'
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

  fetchEmployees: =>
    @BaseDataService.getTeamMembers().then (response) =>
      @team_members = _(response).map (teamMember) =>
        teamMember.fullname = _([teamMember.firstName, teamMember.lastName]).compact().join(' ')
        teamMember

  getTemplates: =>
    @TemplatesDataService.getTemplates(detail: false).then (response) =>
      @templates = response

  addNewTemplate: =>
    @ModalFactory.invokeModal 'manage_template',
      resolve:
        template: => null
        template_list: => @templates

  addEmailTemplate: =>
    @ModalFactory.invokeModal 'manage_email_template',
      resolve:
        template: => null
        existing_email_templates: => @emailTemplates
      success: (response) =>
        @emailTemplates.push(response)
        @params.email_template_id = response.id

  submit: =>
    if @add_inbound_opportunity_form.$valid
      @saving_opportunity = true
      params = _(@params).pick('name','type','template_id','email_template_id','entity_type','contacts','due_date','description','visibility_type')
      params.due_date = @Utils.formatDatetime(params.due_date) if params.due_date
      @Restangular.all('service/dvapi_service/inbound_configuration').post(params).then (response)=>
        @saving_opportunity = false
        @toaster.pop 'success','Successfully created a new opportunity','You can copy the link from the manage opportunities'
        @ModalFactory.invokeModal 'inbound-copy-link',
          resolve:
            link: => response.data[0].redirect_url
        @resetForm()
      , (error)=>
        @saving_opportunity = false
        @toaster.pop 'error','','Failed to create opportunity'

  resetForm: =>
    @params = {
      type : 'insert'
      contacts: [@current_user.id]
      visibility_type: if @defaultVisibility then @defaultVisibility.id else null
    }
