class FirmSettingsEmailTemplatesController extends BaseController
  @register 'FirmSettingsEmailTemplatesController'
  @inject '$state', 'EmailTemplatesResource', 'SweetAlert', 'Restangular', 'toaster', 'ModalFactory', 'Utils','angularEnabled'

  initialize: ->
    @renderGrid = true
    @getFirmPreferences()
    @email_templates = @EmailTemplatesResource.$new()

  confirmDeleteTemplate: (template) ->
    title = 'Are you sure you want to delete this template?'
    warningText = ''

    @SweetAlert.confirm({
      title: title
      text: warningText
      focusCancel: true
      showLoaderOnConfirm: true
      preConfirm: =>
        @deleteTemplate(template)
    })


  getFirmPreferences: =>
    @Restangular.one('firm_preferences').customGET().then (response) =>
      @firm_preferences = response
      @firm_preferences_copy = angular.copy(@firm_preferences)

  selectDefaultTemplate: (template) =>
    return if template.is_default
    @firm_preferences_copy.default_email_template_message_id = template.id
    @Restangular.all('firm_preferences').customPUT(@firm_preferences_copy)
    .then (response) =>
      @toaster.pop 'success', '', 'Template is set as default', 5000
      @refreshTemplatesData()
    , (error) =>
      @toaster.pop 'error', '', 'Something went wrong. Please try again.'

  deleteTemplate: (template) ->
    @Restangular.one('EmailTemplateMessages', template.id).remove().then =>
      swal.close()
      @toaster.pop 'success', '', 'Template deleted successfully'
      @refreshTemplatesData()

  addEmailTemplate: ->
    @ModalFactory.invokeModal 'manage_email_template',
      resolve:
        template: => null
        existing_email_templates: => @email_templates.data
      success: (response) =>
        @refreshTemplatesData()

  refreshTemplatesData: =>
    @email_templates.fetch()
    @renderGrid = true
    @loading = false


  viewTemplate: (template) =>
    @ModalFactory.invokeModal 'view_email_template',
      resolve:
        id: => template.id

  editTemplate: (templateObj) ->
    @ModalFactory.invokeModal 'manage_email_template',
      resolve:
        template: => templateObj
        existing_email_templates: => @email_templates.data
      success: (response) =>
        @refreshTemplatesData()
