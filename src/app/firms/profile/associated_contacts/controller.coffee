class FirmProfileContactsController extends BaseController
  @register 'FirmProfileContactsController'

  @inject '$stateParams', '$scope', 'Utils', 'FirmDataservice', 'ModalFactory', 'BaseDataService', '$state', '$timeout', 'Restangular', 'SweetAlert', 'toaster', 'keywordConstants', 'statusLabel','angularEnabled'

  initialize: ->
    @firmId = @$stateParams.firmId
    @is_manager = @Utils.isManager()
    @public_contacts = []
    @related_contacts = []
    @isFreeSubscription = @Utils.isFreeSubscription()
    @current_user = @Utils.getCurrentUser()
    @isFirmOwner = false
    @departmentsDict = {}
    if Number(@firmId) == @current_user.firmInfo.id
      @isFirmOwner = true

    @$scope.getFirm().then (firm) =>
      @firm = firm

    @getRelatedContacts()
    @getDepartments()
    if @isFirmOwner
      @getPublicContacts()
    else
      @getInvestorPublicContacts()

  goToUserPage: (user) =>
    if @isFirmOwner
      @$state.go("app.firm.settings.permission.detail",{entity_id: user.id, entity_type: 'User', entity_name: user.fullName})

  getPublicContacts: =>
    params =
      entity_id: @firmId
      entity_type: @keywordConstants.Firm
    @Restangular.all('internalcontacts').customGET('', params).then (response) =>
      @public_contacts = response

  getInvestorPublicContacts: =>
    params=
      entity_id: @firmId
      entity_type: @keywordConstants.Firm
    @Restangular.all('publicContacts').customGET('', params).then (response) =>
      @public_contacts = response

  getDepartments: =>
    @Restangular.all('internalContactTypes').getList().then (response) =>
      @departments = response
      @departmentsDict = {}
      for department in @departments
        @departmentsDict[department.text] = department.description

  getFunctionDescription: (key) =>
    department = @departmentsDict[key]
    department

  getRelatedContacts: =>
    @FirmDataservice.getRelatedContacts(@firmId).then (response) =>
      @related_contacts = response
      _(@related_contacts).each (contact) =>
        if contact.tag_names
          contact.tag_names_arr = contact.tag_names.split(',')

  goToSelectedContact: (entity) ->
    @BaseDataService.setContactPageUrl("")
    @$timeout =>
      @$state.go("app.monitor.contact",{Id: entity.id})

  addContactToPortfolio: (entity) =>
    if !@isFreeSubscription and !entity.is_tracking
      params = angular.copy entity
      params.firstName = entity.firstname
      params.lastName = entity.lastname
      @ModalFactory.invokeModal 'manage_contact',
        resolve:
          entity_details : => @firm
          entity_type : => @keywordConstants.Firm
          contact: => params
          source: => 'Public'
        success: (contacts) =>
          @getInvestorPublicContacts()
          @getRelatedContacts()

  editPublicContact: (contact) =>
    @ModalFactory.invokeModal 'manage_public_contacts',
      resolve:
        contact: => contact
        entity_details : => @firm
        entity_type : => @keywordConstants.Firm
      success: (contacts) =>
        @getPublicContacts()

  displayContactRemovalConfirmation: (contact) ->
    @SweetAlert.confirm({
      title: "Are you sure you want to remove \"#{contact.fullName}\"?"
      confirmButtonText: 'Yes, delete contact'
      showLoaderOnConfirm: true
      focusCancel: true
      preConfirm: =>
        @removeContact(contact)
    })

  removeContact: (contact) ->
    # entityuserassignments?entity_id=&entity_type=&user_id
    @Restangular.all('entityuserassignments').remove({entity_id: @firmId, entity_type: 'Firm', user_id: contact.id})
    .then((response) =>
      @toaster.pop 'success', '', "Contact deleted successfully"

      @public_contacts.splice @public_contacts.indexOf(contact), 1
    , (error) =>
      avoid_error_logging_statuses = @BaseDataService.getAvoidErrorLoggingStatusList()
      if !(error.status in avoid_error_logging_statuses)
        @Utils.logError('Deleting internal contact failed', error)
    ).finally =>
      swal.close()

  addPublicContact: =>
    @ModalFactory.invokeModal 'manage_public_contacts',
      resolve:
        entity_details : => @firm
        entity_type : => @keywordConstants.Firm
        existing_contacts: => @public_contacts
      success: (contacts) =>
        @getPublicContacts()

  addContact: =>
    if !@isFreeSubscription
      @ModalFactory.invokeModal 'manage_contact',
        resolve:
          entity_details : => @firm
          entity_type : => @keywordConstants.Firm
        success: (contacts) =>
          if contacts and contacts.length > 0
            @related_contacts = @related_contacts.concat(contacts)
