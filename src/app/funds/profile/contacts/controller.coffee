class FundProfileContactsController extends BaseController
  @register 'FundProfileContactsController'

  @inject '$stateParams', '$scope', 'Utils', 'ModalFactory', 'FundDataservice', '$state', 'BaseDataService', '$timeout', 'Restangular', 'SweetAlert', 'toaster', 'keywordConstants', 'statusLabel','angularEnabled'

  initialize: ->
    @fundId = @$stateParams.fundId
    @is_manager = @Utils.isManager()
    @public_contacts = []
    @current_user = @Utils.getCurrentUser()
    @isFirmOwner = false
    @departmentsDict = {}
    if Number(@$stateParams.firmId) == @current_user.firmInfo.id
      @isFirmOwner = true

    @$scope.getFund().then (fund) =>
      @fund = fund

    @getDepartments()
    @getRelatedContacts()

    if @isFirmOwner
      @getPublicContacts()
    else
      @getInvestorPublicContacts()

  goToUserPage: (user) =>
    if @isFirmOwner
      @$state.go("app.firm.settings.permission.detail",{entity_id: user.id, entity_type: 'User', entity_name: user.fullName})

  getPublicContacts: =>
    params =
      entity_id: @fundId
      entity_type: @keywordConstants.Product
    @Restangular.all('internalcontacts').customGET('', params).then (response) =>
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

  addContactToPortfolio: (entity) =>
    if !@isFreeSubscription and !entity.is_tracking
      params = angular.copy entity
      params.firstName = entity.firstname
      params.lastName = entity.lastname
      @ModalFactory.invokeModal 'manage_contact',
        resolve:
          entity_details : => @fund
          entity_type : => @keywordConstants.Product
          contact: => params
          source: => 'Public'
        success: (contacts) =>
          @getInvestorPublicContacts()
          @getRelatedContacts()

  getInvestorPublicContacts: =>
    params=
      entity_id: @fundId
      entity_type: @keywordConstants.Product
    @Restangular.all('publicContacts').customGET('', params).then (response) =>
      @public_contacts = response

  getRelatedContacts: ->
    @FundDataservice.getRelatedContacts(@fundId).then (response) =>
      @related_contacts = response
      _(@related_contacts).each (contact) =>
        if contact.tag_names
          contact.tag_names_arr = contact.tag_names.split(',')


  displayContactRemovalConfirmation: (contact) ->
    @SweetAlert.confirm({
      title: "Are you sure you want to remove \"#{contact.fullName}\"?"
      confirmButtonText: 'Yes, delete contact'
      showLoaderOnConfirm: true
      focusCancel: true
      preConfirm: =>
        @removeContact(contact)
    })

  addPublicContact: =>
    if !@isFreeSubscription
      @ModalFactory.invokeModal 'manage_public_contacts',
        resolve:
          entity_details : => @fund
          entity_type : => @keywordConstants.Product
          existing_contacts: => @public_contacts
        success: (contacts) =>
          @getPublicContacts()

  editPublicContact: (contact) =>
    if !@isFreeSubscription
      @ModalFactory.invokeModal 'manage_public_contacts',
        resolve:
          contact: => contact
          entity_details : => @fund
          entity_type : => @keywordConstants.Product
        success: (contacts) =>
          @getPublicContacts()

  removeContact: (contact) ->
    # entityuserassignments?entity_id=&entity_type=&user_id
    @Restangular.all('entityuserassignments').remove({entity_id: @fundId, entity_type: @keywordConstants.Product, user_id: contact.id})
    .then((response) =>
      @toaster.pop 'success', '', "Contact deleted successfully"

      @public_contacts.splice @public_contacts.indexOf(contact), 1
    , (error) =>
      avoid_error_logging_statuses = @BaseDataService.getAvoidErrorLoggingStatusList()
      if !(error.status in avoid_error_logging_statuses)
        @Utils.logError('Deleting internal contact failed', error)
    ).finally =>
      swal.close()

  goToSelectedContact: (entity) ->
    @BaseDataService.setContactPageUrl("")
    @$timeout =>
      @$state.go("app.monitor.contact",{Id: entity.id})

  addContact: =>
    @fund.firm_id = @fund.parentFirm.id
    @ModalFactory.invokeModal 'manage_contact',
      resolve:
        entity_details : => @fund
        entity_type: => @keywordConstants.Product
      success: (contacts) =>
        if contacts and contacts.length > 0
          @related_contacts = @related_contacts.concat(contacts)
