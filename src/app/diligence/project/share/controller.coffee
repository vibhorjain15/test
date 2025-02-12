class ProjectShareController extends BaseController

  @register 'ProjectShareController'

  @inject '$stateParams', 'Restangular', '$scope', '$state', 'SweetAlert', 'ShareDDResource', 'toaster', 'Utils', 'DueDiligenceDataservice', 'BaseDataService','ModalFactory', '$tinymceToolbar1' , '$tinymceToolbar2', '$tinymcePlugins', '$timeout', '$q','$tinymceStatusbar', 'angularEnabled'

  initialize: ->
    @diligenceId = @$stateParams.diligenceId
    @DVEntityDisplayName = @Utils.getDVEntityDisplayName()
    @email_templates = []
    @responseId = undefined
    @disallow_custom_edits = false
    @use_email_templates = false
    @is_internal = false
    @dd_status = null
    @loading = false
    @entityType = undefined
    @followup_responses = []
    @current_user = @Utils.getCurrentUser()
    @sharedDiligence = @ShareDDResource.$new({duediligence_id: @diligenceId})
    @startDDShare = false
    @display_sidebar = false
    @display_investor_selection_error = false
    @accept_confidential_agreement = false
    @selected_investors = []

    @tinymceOptions =
      init_instance_callback: (editor) =>
        @tinymceEditor = editor
        editor.on 'paste', (e) =>
          @tinymceEditor.insertContent('')
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

    promises = []
    promises.push @Restangular.one('firm_preferences').customGET().then (response) =>
      @default_email_template_message_id = response.default_email_template_message_id
      if response.disallow_custom_email_template_edit
        @disallow_custom_edits = true
        @use_email_templates = true

      if response.customize_intro
        @use_email_templates = true

    promises.push @Restangular.one('EmailTemplateMessages').customGET().then (response) =>
      @email_templates = response

    @$q.all(promises).then (=>
      if @default_email_template_message_id and @use_email_templates
        @renderEmailTemplate(@default_email_template_message_id)
    )

    @getDueDiligenceList()

  getDueDiligenceList: () =>
    @loading = true
    @$scope.getDueDiligence().then (diligence) =>
      @diligence = diligence
      @is_internal = diligence.is_internal
      @dd_status = diligence.status
      @loading = false


  renderEmailTemplate: (id) ->
    template = _(@email_templates).findWhere({id: id})
    if template
      @email_text = template.content
    else
      @email_text =  ""

  reinitShare: =>
    @refreshSharedData()
    @followup_responses = []
    @startDDShare = false
    @display_sidebar = false
    @display_investor_selection_error = false
    @accept_confidential_agreement = false
    @selected_investors = []
    @loading = false

  refreshSharedData: =>
    @sharedDiligence = @ShareDDResource.$new({duediligence_id: @diligenceId})

  getDefaultEmailTemplate: (use_email_template) =>
    if use_email_template
      @renderEmailTemplate(@default_email_template_message_id)
    else
      @email_text = ""

  startSharingProcess: =>
    if @dd_status == 'Approved'
      @$scope.getDueDiligence().then (diligence) =>
        @diligence = diligence
        # if @diligence.investorfirm_id
          # @selected_investors.push(@diligence.investorfirm_id)
      @startDDShare = true

  cancelSharingProcess: =>
    @reinitShare()

  resetFlags: ->
    @display_investor_selection_error = false

  canProceedToReview: =>
    can_proceed = @areSelectedEntitiesValid()
    bouncedEntitiesList = []
    allEntitiesList = @selected_investors
    bouncedEmailsList = []
    allEmailsList = []
    _(@selected_investors).each (entity) =>
      bouncedContactsCount = 0
      notification_contacts = []
      _(entity.notification_contacts).each (contact) =>
        allEmailsList.push contact if !contact.is_removed
        notification_contacts.push contact if !contact.is_removed
        if contact.has_bounce_history && !contact.is_removed
          bouncedEmailsList.push contact
        if (bouncedContactsCount == notification_contacts.length && notification_contacts.length > 0) || notification_contacts.length == 0
          bouncedEntitiesList.push entity
    if bouncedEmailsList.length > 0 || bouncedEntitiesList.length > 0
      modalInstance = @ModalFactory.invokeModal 'alert_bounced_contacts',
        resolve:
          entitiesList: =>
            bounced: bouncedEntitiesList
            all: allEntitiesList
            entity_type: @entityType
          contactsList: =>
            bounced: bouncedEmailsList
            all: allEmailsList
      modalInstance.result.then (response) =>
        unless can_proceed
          @display_investor_selection_error = true
          deregisterer = @$scope.$watch 'vm.selected_investors.length', (value) =>
            if @areSelectedEntitiesValid()
              @display_investor_selection_error = false
              deregisterer()
              deregistererTwo()
          deregistererTwo = @$scope.$watch 'vm.request.all_investor_flag', (value) =>
            if value == true
              @display_investor_selection_error = false
              deregisterer()
              deregistererTwo()
        can_proceed
    else
      unless can_proceed
        @display_investor_selection_error = true
        deregisterer = @$scope.$watch 'vm.selected_investors.length', (value) =>
          if @areSelectedEntitiesValid()
            @display_investor_selection_error = false
            deregisterer()
            deregistererTwo()
        deregistererTwo = @$scope.$watch 'vm.request.all_investor_flag', (value) =>
          if value == true
            @display_investor_selection_error = false
            deregisterer()
            deregistererTwo()
      can_proceed

  hasContacts: (investor) ->
    unRemovedContacts = []
    for contact in investor.notification_contacts
      if !contact.is_removed
        unRemovedContacts.push contact

    unRemovedContacts.length

  notDeletedContact: (contact) ->
    contactAvailable = true
    if contact.is_removed
      contactAvailable =  false

    contactAvailable

  areSelectedEntitiesValid: () =>
    all_selected_investors_arr = []
    _(@selected_investors).each (entity) =>
      entity_item = {
        id: entity.id
        notification_contacts: []
      }
      _(entity.notification_contacts).each (contact) =>
        if !contact.is_removed
          entity_item.notification_contacts.push(contact.id)
      if entity_item.notification_contacts.length
        all_selected_investors_arr.push(entity_item)
    return all_selected_investors_arr.length

  sendDueDiligenceRequest: =>
    if !@accept_confidential_agreement
      @SweetAlert.error
        title: 'Confidentiality Agreement'
        text: 'Please agree with the binding conditions by clicking the checkbox before you can send this request'
      return

    postObj=
      id: @diligenceId
      email_text: @email_text
      investors: []

    for investor in @selected_investors
      investorsObj = {}
      investorsObj.id = investor.id
      investorsObj.notification_contacts = _(investor.notification_contacts).filter (contact) =>
        if !contact.is_removed
          contact
      if investorsObj.notification_contacts.length > 0
        investorsObj.notification_contacts = _(investorsObj.notification_contacts).pluck('id')
        postObj.investors.push investorsObj

    @Restangular.all('diligences/share_project').post(postObj).then (response) =>
      @toaster.pop 'success', '', 'Diligence shared successfully', 3000
      @reinitShare()


  revokeAccessModal: (entity) ->
    if !entity.acknowledged_at
      @SweetAlert.confirm({
        title: "Are you sure you want to revoke access?"
        confirmButtonText: 'Yes please'
        focusCancel: true
        showLoaderOnConfirm: true
        preConfirm: =>
          @revokeAccess(entity)
      })

  close: ->
    @display_sidebar = false

  openFollowupDialog: (response) =>
    @display_sidebar = true
    @followupLoading = true
    responseId = response.id
    @response = response
    @responseId = responseId
    @entityType = 'Duediligence'
    @new_followup_response = {}
    @followup_responses = []
    @DueDiligenceDataservice.getFollowUps(responseId, @entityType).then (responses) =>
      @followup_responses = responses
      @followupLoading = false


  resetForm: (form) ->
    form.$setPristine()
    form.$setUntouched()

  saveFollowupResponse: ->
    if @followup_form.$valid
      @saving_followup_response = true
      @new_followup_response.entity_id = @responseId
      @new_followup_response.type = 'DiligenceFollowup'
      @new_followup_response.entity_type = @entityType
      @DueDiligenceDataservice.saveFollowup(@new_followup_response)
      .then (response) =>
        @followup_responses.push response
        @new_followup_response = {}
        @saving_followup_response = false
        @resetForm(@followup_form)
      , (error) =>
        @saving_followup_response = false
        @toaster.pop 'error', '', 'Something went wrong. Please try again.'
        avoid_error_logging_statuses = @BaseDataService.getAvoidErrorLoggingStatusList()
        if !(error.status in avoid_error_logging_statuses)
          delete error.config.data.text
          @Utils.logError('Followup for response save failed', error)

  followUpShare: (entity) =>
    swal.close()

  setEntities: =>
    @selected_investors = _(@selected_investors).filter (entity) ->
      entity.notification_contacts.length

    @selected_investors_temp = []
    @all_selected_investors_arr = []
    @all_selected_investors_contacts_arr = []
    _(@selected_investors).each (entity) =>
      entity_item = {
        id: entity.id
        notification_contacts: []
      }
      _(entity.notification_contacts).each (contact) =>
        if !contact.is_removed
          entity_item.notification_contacts.push(contact.id)
          if contact.name != ''
            @all_selected_investors_contacts_arr.push(contact.name)
          else
            @all_selected_investors_contacts_arr.push(contact.email)
      if entity_item.notification_contacts.length
        @selected_investors_temp.push(entity_item)
        @all_selected_investors_arr.push(entity.name)

  formatTooltip: (list) =>
    return list.join(', ')

  revokeAccess: (entity) =>
    @loading = true
    @Restangular.one('diligences/share_project', entity.id).remove().then(=>
      @reinitShare()
      @toaster.pop 'success', '', 'Access Revoked'
    ).finally (=>
      swal.close() #stupid angular-sweetalert guy isn't tagging the updated code!

    )

  clearGrouping: (grid,column)=>
    grid.api.grouping.clearGrouping()

  formatDateTimeFormat: (timeStamp) ->
    return @Utils.getLocalDateTime(timeStamp).format("MMM Do, YYYY h:mm a")