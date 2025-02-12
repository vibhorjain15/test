class FirmSettingsExportPreferencesController extends BaseController
  @register 'FirmSettingsExportPreferencesController'

  @inject 'toaster','$state', 'Restangular', 'Utils','ModalFactory','SweetAlert','angularEnabled'

  initialize: ->
    @is_investor = @Utils.isInvestor()
    @is_freeSubscription = @Utils.isFreeSubscription()
    @loadPreferences()
    @loadTemplates()

  loadTemplates: =>
    @Restangular.all('DocumentExportTemplates').customGET().then (response) =>
      @templates = response

  loadPreferences: ->
    @Restangular.all('firm_preferences').customGET().then (response) =>
      @firm_preferences = response
      @firm_preferences_copy = JSON.parse(JSON.stringify(@firm_preferences))

  makeItSticky: ->
    if $(document).height() > $(window).height()
      $('.sticky_savebar').affix({offset: {bottom: 30} })

  submit: ->
    @saving_preferences = true
    @Restangular.all('firm_preferences').customPUT(@firm_preferences_copy)
    .then (response) =>
      @toaster.pop 'success', '', 'Word/Excel export preferences successfully saved', 5000
      @firm_preferences = response
      @firm_preferences_copy = JSON.parse(JSON.stringify(@firm_preferences))
      @saving_preferences = false

    , (error) =>
      @saving_preferences = false
      @loadPreferences()
      avoid_error_logging_statuses = @BaseDataService.getAvoidErrorLoggingStatusList()
      @toaster.pop 'error', '', 'Something went wrong. Please try again.'
      if !(error.status in avoid_error_logging_statuses)
        @Utils.logError('Updating WordExport Preferences failed', error)

  downloadTemplate: (template)=>
    @Restangular.one('DocumentExportTemplates', template.id).one('signed_url', null).get().then (response)=>
      url = response
      $link = $("<a href=\"#{url}\" target='_blank' class='hidden'></a>")
      $('body').append($link)
      $link[0].click()
      $link.remove()

  addNewTemplate: =>
    if @is_freeSubscription && !@is_investor
        @$state.go 'app.premium'
    else if !@is_freeSubscription
      @ModalFactory.invokeModal 'manage_export_template',
        resolve:
          template: => null
          template_list: => @templates
        success: (response) =>
          @templates.push response
          @selectDefaultTemplate(response)


  selectDefaultTemplate: (template) ->
    if @firm_preferences_copy.default_document_export_template_id == template.id
      @firm_preferences_copy.default_document_export_template_id = null
    else
      @firm_preferences_copy.default_document_export_template_id = template.id

  editTemplate: (template,index)=>
    unless template.is_system_template
      @ModalFactory.invokeModal 'manage_export_template',
        resolve:
          template: => angular.copy template
          template_list: => @templates
        success: (response) =>
          @templates[index] = response

  removeTemplate:(template,index)=>
    @Restangular.one('DocumentExportTemplates', template.id).remove().then (response)=>
      @toaster.pop 'success','','Template removed successfully'
      @templates.splice index,1
      if template.id == @firm_preferences_copy.default_document_export_template_id
        @firm_preferences_copy.default_document_export_template_id = null

  confirmTemplateDeletion: (template,index) ->
    unless template.is_system_template
      @SweetAlert.confirm({
        title: "Are you sure you want to remove this template?"
        focusCancel: true
        showLoaderOnConfirm: true
        preConfirm: =>
          @removeTemplate(template,index)
      })
