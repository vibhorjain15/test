class MonitorDocumentsController extends BaseController

  @register 'MonitorDocumentsController'

  @inject 'DocumentQueueResource', '$stateParams', 'Restangular', 'BaseDataService',
    '$timeout', 'ModalFactory', 'toaster', 'SweetAlert', '$q','PopupCheckerService', 'Utils'

  initialize: ->
    @documents = @DocumentQueueResource.$new()
    ###@getDefinedWorkflows()###

    @workflow_audit_id = @$stateParams.workflow_audit_id
    @action_id = @$stateParams.action_id
    @workflow_steps_actions_id = @$stateParams.workflow_steps_actions_id

    if angular.isDefined(@workflow_audit_id) && angular.isDefined(@action_id) && angular.isDefined(@workflow_steps_actions_id)
      if @action_id == 'add_note'
        @displayNotesController()



    @initGridSection = true
    @filterSummary = {}
    @showingSearchResults = false
    @is_collapsed = true
    $('.js-search-panel').find('.panel-body').css('display', 'none')
    ###@getCriteriaList()###
    @global_ternary_operator = 'or'
    @search_criterias = [{}]
    @boolean_value_options = [
      {label: 'Yes', value: true},
      {label: 'No', value: false}
    ]

  getDefinedWorkflows: =>
    params=
      pageNumber: 1
      recordsPerPage:100
    @Restangular.all('workflows').customGET('', params).then (response) =>
      @definedWorkflows = response
      @definedWorkflowsTags = []
      @BaseDataService.getAttachmentTypes().then (response) =>
        document_types = result
        _(@definedWorkflows.results).each (item) =>
          tag_ids = []
          _(document_types).each (doc_type) =>
            if doc_type.id  == item.entity_sub_type
              tag_ids.push(doc_type.name)
              @definedWorkflowsTags.push(doc_type.name)
          item.tag_ids = tag_ids

  displayNotesController: () ->
    @sidebarTemplate = 'workflow_automation/detail/add_notes.html'
    @sidebarTitle = 'Add Notes'
    @sidebarContent = 'notes'
    @displaySidebarPanel = true

    @new_note = {}

    @resetForm()

  resetForm: ->
    @new_note = {}
    @add_notes_form?.$setPristine()
    @add_notes_form?.$setUntouched()


  getCriteriaList: () =>
    @Restangular.all('documents/filters').getList().then (response) =>
      @criteria_options = response

  toggleSearchPanel: =>
    $panel = $('.js-search-panel')
    @is_collapsed = not @is_collapsed
    $panel.find('.panel-body').slideToggle()
    return true

  resetFiltersData: () =>
    @search_criterias = [{}]
    @search_form.$setPristine()

  clearFilters: () =>
    @resetFiltersData()
    @initGridSection = false
    @showingSearchResults = false
    @firms = @FirmsResource.$new()
    @$timeout (=>
      @initGridSection = true
    ), 1000

  loadChildOptions: (criteriaID, index) ->
    @DueDiligenceDataservice.getList(criteriaID).then (response) =>
      @search_criterias[index].criteria_obj.childOptions = response

  selectCriteria: (criteria, index) =>
    @search_criterias[index].value = ''
    @loadChildOptions(criteria.criteria_obj.id, index) if criteria.criteria_obj.responseType is 'Dropdown' or 'CheckBox'

  addNewCriteria: =>
    @search_criterias.push({})
    @search_form.$setPristine()

  removeCriteria: () =>
    @search_criterias.splice(@search_criterias.length-1, 1)
    @search_form.$setPristine()

  compileFilterSummary: () =>
    @filterSummary =
      global_operator: @global_ternary_operator,
      criterias: []

    _(@search_criterias).each((criteria) =>
      criteria_obj = {}
      criteria_obj.label = criteria.criteria_obj.label
      criteria_obj.value = []
      if criteria.criteria_obj.value == 'tags_list'
        _(criteria.value).each((value) ->
          criteria_obj.value.push(value.name)
        )
      else if criteria.criteria_obj.value == 'strategy_dropdown'
        criteria_obj.value.push(criteria.value.value)
      else if criteria.criteria_obj.value == 'fund_dropdown'
        criteria_obj.value.push(criteria.value.name)
      else if criteria.criteria_obj.value == 'not_updated_since'
        criteria_obj.value.push(moment(criteria.value).format("DD-MMMM-YYYY"))
      else
        criteria_obj.value.push(criteria.value)
      @filterSummary.criterias.push(criteria_obj)
    )

  getSearchResults: =>
    return unless @search_form.$valid
    @initGridSection = false

    params=
      global_operator: @global_ternary_operator,
      criterias: []

    _(@search_criterias).each((criteria) =>
      criteria_obj = {}
      criteria_obj.filter_id = criteria.criteria_obj.id
      criteria_obj.filter_condition = criteria.condition
      criteria_obj.value = criteria.value
      params.criterias.push(criteria_obj)
    )

    @showingSearchResults = true

    @toggleSearchPanel()

    delete @documents
    @documents = @DocumentQueueResource.$new(params)

    @$timeout (=>
      @initGridSection = true
    ), 1000

  confirmDocumentQueue: (entity) =>
    entity.approving_document = true
    approve_params =
      entity_type: "Document"
      entities: []
    approve_params.entities.push({entity_id: entity.id})
    @Restangular.one('workflow_audits').customPOST(approve_params).then (response) =>
      @toaster.pop 'success', '', 'Document successfully approved'
      @documents.refresh()
      entity.approving_document = false
    , => entity.approving_document = false

  openDocumentQueueUpdateDialog: (document) =>
    @ModalFactory.invokeModal 'manage_document',
      resolve:
        documentOptions: ->
          mode: 'update_document_tags'
          document: document
      success: () =>
        @documents.refresh()

  getSignedURL: (entity) ->
    @Restangular.one('attachments', entity.id ).one('signed_url', null).get().then (response) =>
      popup = window.open(response, '_blank')
      PopupCheckerService.check(popup)

  getContextValue: (grid, row, col) ->
    if(row.groupHeader && row.treeNode.children[0])
      entity = row.treeNode.children[0].row.entity
      group = if entity.group_name then entity.group_name else 'Unknown'
      return group

    return row.entity.name

  showGroupedApprovedIcon: (grid, row, col) =>
    show_icon = false
    if(row.groupHeader && row.treeNode.children.length>0)
      row.treeNode.children.every (child_row) ->
        if child_row.row.entity.tag_ids && child_row.row.entity.tag_ids.length>0 && child_row.row.entity.entity_name
          show_icon = true
        else
          show_icon = false
          return show_icon

    return show_icon

  addDocument: =>
    @ModalFactory.invokeModal 'manage_document',
      resolve:
        documentOptions: ->
          mode: 'add'
      success: () =>
        @documents.refresh()

  confirmDocumentDeletion: (document) ->
    title = 'Are you sure you want to delete this document?'

    @SweetAlert.confirm({
      title: title
      showLoaderOnConfirm: true
      focusCancel: true
      preConfirm: =>
        @deleteDocument(document)
    })

  deleteDocument: (document) ->
    document.deleting_document = true
    params =
      attachment_id: document.id
      is_deleted: true
    @Restangular.one('Document_queue_approvals').customPOST(params).then ( =>
      swal.close()
      @toaster.pop 'success', '', 'Document deleted successfully'
      @documents.refresh()
      document.deleting_document = false
    ), ((error) =>
      swal.close()
      document.deleting_document = false
    )

  confirmBulkApprove: (grid, row, col) =>
    params =
      entity_type: "Document"
      entities: []

    _(row.treeNode.children).each (child_row) =>
      if child_row.row.isSelected
        params.entities.push({entity_id: child_row.row.entity.id})

    if params.entities.length > 0
      row.treeNode.approving_bulk_docs = true
      @Restangular.one('workflow_audits').customPOST(params).then (response) =>
        @toaster.pop 'success', '', 'Documents successfully approved'
        @documents.refresh()
        row.treeNode.approving_bulk_docs = false
      , =>
        @documents.refresh()
        row.treeNode.approving_bulk_docs = false

    else
      @toaster.pop 'error', '', 'Please select at least one document'

  confirmBulkDeletion: (grid, row, col) ->
    entities = []
    _(row.treeNode.children).each (child_row) =>
      if child_row.row.isSelected
        entities.push({entity_id: child_row.row.entity.id})

    if entities.length > 0
      title = 'Are you sure you want to delete the documents?'
      @SweetAlert.confirm({
        title: title
        showLoaderOnConfirm: true
        focusCancel: true
        preConfirm: =>
          @bulkDeleteDocuments(grid, row, col)
      })
    else
      @toaster.pop 'error', '', 'Please select at least one document'

  bulkDeleteDocuments: (grid, row, col) =>
    row.treeNode.deleting_bulk_docs = true
    promises = []
    _(row.treeNode.children).each (child_row) =>
      if child_row.row.isSelected
        params =
          attachment_id: child_row.row.entity.id
          is_deleted: true
        promises.push @Restangular.one('Document_queue_approvals').customPOST(params)

    @$q.all(promises).then =>
      swal.close()
      @toaster.pop 'success', '', 'Documents successfully deleted'
      @documents.refresh()
      row.treeNode.deleting_bulk_docs = false
    , => row.treeNode.deleting_bulk_docs = false
