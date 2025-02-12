class FirmSettingsPreferencesController extends BaseController
  @register 'FirmSettingsPreferencesController'

  @inject 'toaster', 'Restangular', 'Utils', 'BaseDataService','keywordConstants', '$tinymceToolbar1', '$tinymceToolbar2', '$tinymcePlugins', '$timeout', 'ModalFactory', '$q','angularEnabled'

  initialize: ->
    @default_preference_firm = false
    @email_templates = []
    @roles = []
    @assignDefaultRole = false
    @teamMembers = []
    @getAllTeamMembers()

    @is_investor = @Utils.isInvestor()
    @current_user = @Utils.getCurrentUser()
    @dateRanges = @Utils.getDateRanges()

    @tinymceOptions =
      skin_url: '/assets/stylesheets/tinymce/skins/tinymce-dv'
      browser_spellcheck: true
      height: 250
      plugins: @$tinymcePlugins
      custom_undo_redo_levels: 10
      toolbar1: @$tinymceToolbar1
      toolbar2: @$tinymceToolbar2
      menubar: false
      statusbar: false
      image_dimensions: false
      forced_root_block : ""
      content_css : 'assets/stylesheets/tiny_mce_custom.css'
      table_toolbar: ""
      render: (editor) =>
        @$timeout => #since this comes from a event handler in tinymce
          @ModalFactory.invokeModal 'questionnaire_upload_image',
            resolve:
              editor: -> editor


    promises = []

    promises.push @Restangular.one('firm_preferences').customGET().then (response) =>
      @firm_preferences = response
      @firm_preferences_copy = angular.copy(@firm_preferences)

    promises.push @Restangular.one('EmailTemplateMessages').customGET().then (response) =>
      @email_templates = response

    promises.push @Restangular.one('alert_frequencies').customGET().then (response) =>
      @frequencies = response

    promises.push @Restangular.one('firms', @current_user.firmInfo.id).all('roles').getList(is_firmwide: true).then (response) =>
      @roles = response

    @$q.all(promises).then (=>
      @setDefaultPreferenceFirm()
      if @firm_preferences_copy.default_email_template_message_id
        @renderEmailTemplate(@firm_preferences_copy.default_email_template_message_id)
      if @firm_preferences_copy.default_user_access_role
        @assignDefaultRole = true
    )

  makeItSticky: ->
    if $(document).height() > $(window).height()
      $('.sticky_savebar').affix({offset: {bottom: 30} })


  renderEmailTemplate: (id) ->
    template = _(@email_templates).findWhere({id: id})
    if template
      @email_text = template.content
    else
      @email_text = null

  setDefaultPreferenceFirm: ->
    @default_preference_firm = if @firm_preferences.set_firm_entity_default and @firm_preferences.set_firm_entity_default.toLowerCase() == @keywordConstants.Firm.toLowerCase() then true else false

  setFirmEntityDefault: ->
    if @default_preference_firm
      @firm_preferences_copy.set_firm_entity_default = @keywordConstants.Firm
    else
      @firm_preferences_copy.set_firm_entity_default = @keywordConstants.Product

  validCCEmails: =>
    if @firm_preferences_copy.cc_email and @firm_preferences_copy.add_cc_email
      emailList = @firm_preferences_copy.cc_email.replace(/\s/g,'').split(",")
      if @validateEmailList(emailList)
        if not @uniqueEmails(emailList)
          @toaster.pop 'error','','CC emails not unique'
          return false
        else
          return true
      else
        @toaster.pop 'error','','CC emails not valid'
        return false
    else
      return true

  validSenderEmails: =>
    if @firm_preferences_copy.sender_email and @firm_preferences_copy.add_sender_email
      emailList = @firm_preferences_copy.sender_email.replace(/\s/g,'').split(",")
      if @validateEmailList(emailList)
        if not @uniqueEmails(emailList)
          @toaster.pop 'error','','Sender emails not unique'
          return false
        else
          return true
      else
        @toaster.pop 'error','','Sender emails not valid'
        return false
    else
      return true

  validBCCEmails: =>
    if @firm_preferences_copy.bcc_email and @firm_preferences_copy.bcc_email
      emailList = @firm_preferences_copy.bcc_email.replace(/\s/g,'').split(",")
      if @validateEmailList(emailList)
        if not @uniqueEmails(emailList)
          @toaster.pop 'error','','BCC emails not unique'
          return false
        else
          return true
      else
        @toaster.pop 'error','','BCC emails not valid'
        return false
    else
      return true

  validateEmailList: (emailList)=>
    valid = true
    #in the below regex, i at the end means case insensitive match
    regex = /^[a-z0-9!#$%&'*+\/=?^_`{|}~.-]+@[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i
    _(emailList).each (email)=>
      if email.length == 0 or not regex.test(email)
        valid = false
    valid

  uniqueEmails: (emails)=>
    unique = true
    uniqueList = _(emails).uniq()
    if uniqueList.length != emails.length
      unique = false
    unique

  submit: ->
    if @validCCEmails() and @validSenderEmails() and @validBCCEmails()
      @saving_preferences = true
      @setFirmEntityDefault()
      @firm_preferences_copy.review_workflow_mandatory_for_internal_diligence = false if !@firm_preferences_copy.enable_Review_Workflow
      @firm_preferences_copy.review_workflow_mandatory_for_external_diligence = false if !@firm_preferences_copy.enable_Review_Workflow
      if !@assignDefaultRole
        @firm_preferences_copy.default_user_access_role = null
      @Restangular.all('firm_preferences').customPUT(@firm_preferences_copy)
      .then (response) =>
        @toaster.pop 'success', '', 'Firm preferences successfully saved', 5000
        @firm_preferences = response
        @firm_preferences_copy = angular.copy(@firm_preferences)
        @saving_preferences = false
        @setDefaultPreferenceFirm()
      , (error) =>
        @saving_preferences = false
        @loadPreferences()
        avoid_error_logging_statuses = @BaseDataService.getAvoidErrorLoggingStatusList()
        @toaster.pop 'error', '', 'Something went wrong. Please try again.'
        if !(error.status in avoid_error_logging_statuses)
          delete error.config.data.introduction
          delete error.config.data.generic_email
          delete error.config.data.sender_email
          delete error.config.data.cc_email
          delete error.config.data.bcc_email
          @Utils.logError('Updating Firm Preferences failed', error)

  getAllTeamMembers: ->
    @BaseDataService.getTeamMembers().then (teamMembers) =>
      @teamMembers = _(teamMembers).map (teamMember) ->
        teamMember.fullName = _([teamMember.firstName, teamMember.lastName]).compact().join(' ')
        teamMember
