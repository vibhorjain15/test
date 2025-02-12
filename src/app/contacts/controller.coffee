class MonitorContactController extends BaseController

  @register 'MonitorContactController'

  @inject '$stateParams', 'Restangular', '$q', '$state', '$scope', '$filter', 'toaster', 'SweetAlert',
    'Utils', 'BaseDataService', 'ModalFactory', '$anchorScroll', '$location', 'MentionsFactory', '$timeout', '$tinymceMentionsPlaceholderText', 'RestangularHeaderService', 'statusLabel','angularEnabled'

  initialize: ->
    @contactId = @$stateParams.Id
    @entityType = 'User'
    @is_manager = @Utils.isManager()
    @current_user = @Utils.getCurrentUser()
    @pageUrl = @BaseDataService.getContactPageUrl()
    @ContactsIdType = 1218
    @notesOptions=
      fullscreen:true
      undoRedo:true
      height:180

    @getContact(@contactId)
    @getCustomFields()

    @maxDate = new Date()
    @due_date = new Date()

  getCustomFields: =>
    @Restangular.all('service/dvapi_service/get_custom_fields_data').post({entity_id : @contactId, entity_type: @ContactsIdType, schema_type: 'contact', sub_entity_id: 0}).then (response) =>
      @customFields = response.data

  applyMethod: (startDate,endDate)=>
    @dateRangeForDirectives = {
      startDate: startDate
      endDate: endDate
    }

  getFirmPref: =>
    @loading_prefs = true
    @Restangular.all('firm_preferences').customGET().then (response) =>
      @customDateFilter = @Utils.getPredefinedDateRanges(response.default_daterange_months)
      @customDateFilter.selectedRange = @Utils.getDateRanges()[response.default_daterange_months].label

      if @customDateFilter.selectedRange == 'No Filter'
        @dateRangeForDirectives = {
          startDate: null
          endDate: null
        }
      else
        @dateRangeForDirectives = {
          startDate: @Utils.formatDatetime(@customDateFilter.startDate)
          endDate: @Utils.formatDatetime(@customDateFilter.endDate)
        }
      @loading_prefs = false

  findName: (id) =>
    member = _.findWhere(@teamMembers,{id:id})
    return member.fullname

  setActionType: (index) =>
    @selected_action_type = @action_types[index]
    @initAddActivityForm()

  getContact: (Id) =>
    @RestangularHeaderService.RestangularWithHeader(@pageUrl).one('contacts',Id).get().then (response) =>
      @contact = response
      @contact.fullName = _([response.firstName, response.lastName]).compact().join(' ')
      @sortTags()
      @init()

  init: =>
    @getFirmPref()
    @getAssociatedProducts(@contactId)
    @getTeamMembers()
    @pageUrl = @generatePageUrl() if @pageUrl.length == 0

    @Restangular.all('touch_points').getList().then (response) =>
      @note_types = response

  sortTags: () =>
    @contact.contact_types = _(@contact.contact_types).sortBy((tag) =>
      tag.name.toLowerCase()
    )

  editContact: =>
    @ModalFactory.invokeModal 'manage_contact',
      resolve:
        contact: => @contact
      success: (contact) =>
        if Array.isArray(contact)
          @contact = contact[0]
        else
          @contact = contact
        @getAssociatedProducts(@contactId)
        @sortTags()
      dismiss: (dismissObj) =>
        if dismissObj?
          @contact = dismissObj


  getTeamMembers: () =>
    @BaseDataService.getTeamMembers().then (teamMembers) =>
      @teamMembers = _(teamMembers).map (teamMember) ->
        teamMember.fullname = _([teamMember.firstName, teamMember.lastName]).compact().join(' ')
        teamMember

  generatePageUrl: =>
    pageUrl = ""
    if @contact
      if @contact.associated_funds.length == 0
        pageUrl = "app/firms/#{@contact.firmInfo.id}/contacts/#{@contact.id}"
      else if @contact.associated_funds.length >= 0
        _(@contact.associated_funds).each (fund,index)=>
          pageUrl += "app/firms/#{@contact.firmInfo.id}/funds/#{fund}/contacts/#{@contact.id}"
          pageUrl += "," if index != @contact.associated_funds.length - 1
    pageUrl

  addTask: =>
    @pageUrl = @generatePageUrl()
    @ModalFactory.invokeModal 'manage_task',
      resolve:
        task: =>
          entity_type: @entityType
          entity_id: @contactId
          pageUrl: @pageUrl
      success: =>
        @refreshTasksList = !@refreshTasksList


  getAssociatedProducts: (Id) =>
    @Restangular.all('v2/funds/assigned_contacts').getList({contact_id: Id}).then (response) =>
      @all_products = response
      @associated_products = response.slice(0, 5)


  filterTeamMembers: (term) =>
    @filteredTeamMembers = @MentionsFactory.getFilteredMembers(term)

  getDisplayName: (user) =>
    @$timeout =>
      @tinymceEditor.insertContent('')
    , 300
    return @MentionsFactory.getDisplayName(user, true)


  openAttachmentModal: (id) ->
    @ModalFactory.invokeModal 'view_attachments',
      resolve:
        email_id : => id

  markTaskAsComplete: (task) =>
    task.is_complete = true
    task.completed_at = new Date()
    @Restangular.one('todos', task.id).customPUT(task).then (response) =>
      message = 'The task has been as completed!'
      @toaster.pop 'success', '', message
      task = response

  removeProductAssociation: (product, idx) =>
    @Restangular.all('v2/funds/assigned_contacts').customDELETE(null, {contact_id: @contactId, product_id: product.id})
    .then (response) =>
      @toaster.pop 'success', '', 'Product association successfully removed', 5000
      index = _.findIndex(@all_products, (item) ->
        item.id == product.id
      )
      @all_products.splice(index, 1)
      @associated_products = @all_products.slice(0, 5)
      @getContact(@contactId)
      swal.close()
    , (error) =>
      swal.close()
      avoid_error_logging_statuses = @BaseDataService.getAvoidErrorLoggingStatusList()
      @toaster.pop 'error', '', 'Something went wrong. Please try again.'
      if !(error.status in avoid_error_logging_statuses)
        @Utils.logError('Removing Product Association failed', error)

  confirmRemoveProductAssociation: (product, idx) ->
    title = "Are you sure you want to remove this product association?"

    @SweetAlert.confirm({
      title: title
      confirmButtonText: 'Yes'
      focusCancel: true
    }).then (isConfirm) =>
      @removeProductAssociation(product, idx) if isConfirm.value and isConfirm.value == true

  deactivateContact: () =>
    @SweetAlert.confirm({
      title: 'Are you sure you want to deactivate this contact ?'
      confirmButtonText: 'Yes, deactivate!'
      showLoaderOnConfirm: true
      focusCancel: true
      preConfirm: =>
        params =
          entity_id: @contactId
          entity_type: @entityType
        @Restangular.all('firm_relationships').customDELETE(null, params).then =>
          @contact.active = false
          @toaster.pop 'success', '', "Contact marked inactive"
        .finally => swal.close()
    })

  manageCustomfield: =>
    @ModalFactory.invokeModal 'manage_custom_fields',
      resolve:
        entityTypeId: => @ContactsIdType
        entityType: => 'Contact'
        entityId: => @contactId
        customFields: => angular.copy @customFields
        customUrl: => 'contact_tags'
      success: (response)=>
        @customFields = response.data
