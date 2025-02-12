class DiligenceDocumentUploadDetailController extends BaseController
  @register 'DiligenceDocumentUploadDetailController'

  @inject '$stateParams', 'DocDrivenResource', 'DDDocumentUploadDataservice', '$scope',
          'TemplatesDataService', '$q', 'SweetAlert', 'Restangular', 'InvestorDataservice', 'FundDataservice',
          'DueDiligence', 'toaster', '$state', '$timeout', 'Utils', 'ModalFactory', 'RestangularHeaderService','DueDiligenceDataservice','requestSteps','RequestTypes', '$filter', 'keywordConstants'

  initialize: ->
    @document_id = @$stateParams.documentUploadId
    @current_firm = @Utils.getCurrentFirm()
    @minDate = new Date()
    @maxDate = new Date()
    @as_of_date = new Date()
    @current_line_items_page = 1
    @line_items_resource = @DocDrivenResource.$new({
      document_id: @document_id
    })

    @wizard_steps = ['questions_extracted', 'question_reviewed', 'template_configured']

    @display_footer = true
    @preview = false
    @TemplatesDataService.getResponseTypes().then (responseTypes) =>
      @responseTypes = responseTypes
      @loadDocument(@document_id).then (response) =>
        @loadLineItemsNextPage()

    @getReviewedLineItemCount(@document_id)

    @only_sections_and_questions = false
    @current_line_items_page = 0
    @line_items_filters = {
      document_id: @document_id
      recordsPerPage: 10
    }
    @line_items = []

    @getLineItemsCount()

    @investor_deferred = @$q.defer()
    @getRequest()

    @$scope.$watch 'vm.only_sections_and_questions', (newValue, oldValue) =>
      if newValue != oldValue
        @toggleSectionsAndQuestionsFilter()

  initializeProjectName: (dd_document) =>
    @project_name = ""

  updateStatus: (status) ->
    @DDDocumentUploadDataservice.updateDocument(@document_id, {
      status: status
    })

  togglePreview: () ->
    @vm.preview = !@vm.preview

  getReviewedLineItemCount: (id) ->
    @DDDocumentUploadDataservice
      .getReviewedLineItemCount(id).then (response) =>
        reviewProgress = (response.reviewed_count * 100) / (response.total_count)
        reviewProgress = Number(reviewProgress.toFixed(2))

        @reviewProgress = reviewProgress

  applyLineItemsFilters: ->
    @current_line_items_page = 1

    @loadLineItems(@getLineItemsFilters()).then (response) =>
      @line_items = response.results

  getLineItemsFilters: =>
    _(@line_items_filters).each (val, key) =>
      delete @line_items_filters[key] unless val

    angular.extend({}, @line_items_filters, {pageNumber: @current_line_items_page})

  getLineItemsCount: () =>
    filters=
      document_id: @document_id
    @Restangular.all('dd_documents/count').customGET('', filters).then (response) =>
      @line_items_count = response

  toggleContentTypeMain: () =>
    if !@line_items_filters.is_section
      delete @line_items_filters.is_section
    if !@line_items_filters.is_question
      delete @line_items_filters.is_question

    @applyLineItemsFilters()

  toggleSectionsAndQuestionsFilter: () =>
    if @only_sections_and_questions
      @line_items_filters.is_section = 'true'
      @line_items_filters.is_question = 'true'
    else
      @line_items_filters.is_section = ''
      @line_items_filters.is_question = ''

    @applyLineItemsFilters()

  loadLineItems: (filters) =>
    @is_loading_line_items = true
    filter_attributes = _.keys(filters)

    @filters_applied = !(filter_attributes.length is 1 && filter_attributes[0] is 'pageNumber')

    @Restangular.all('dd_document_lineitems').customGET('', filters).then (response) =>
      @is_loading_line_items = false
      @total_line_items_pages = response.meta.totalPages
      @line_items_data_length = response.meta.totalRecords

      response

  loadLineItemsNextPage: () =>
    if @is_loading_line_items || @current_line_items_page is @total_line_items_pages
      return

    @current_line_items_page += 1

    @loadLineItems(@getLineItemsFilters()).then (response) =>
      _(response.results).each (line_item) =>
        line_item.templateId = @document.template_id

        line_item.responseTypeDescription = (_(@responseTypes).findWhere(
          text: line_item.response_type
        ))?.description
        @line_items.push(line_item)

  addNewSection: (line_item, idx) =>
    line_item.add_new_section = true

    if idx is 0
      order = (@line_items[idx].order) / 2
    else
      order = (@line_items[idx-1].order + @line_items[idx].order) / 2

    line_item.new_section = {
      document_id: @document_id
      extracted_text: ''
      is_section: true
      order: order
    }

  postNewSection: (line_item, idx) =>
    if line_item.new_section.extracted_text.length == 0
      message = "Please add the section name!"
      @toaster.pop 'error', '', message

    else
      @Restangular.all('dd_document_lineitems').post(line_item.new_section).then (response) =>
        @line_items.splice(idx, 0, response);

        message = "Successfully added the new section!"
        @toaster.pop 'success', '', message
        line_item.add_new_section = false
        delete line_item.new_section

        @getLineItemsCount()

  editQuestion: (line_item, idx) =>
    modalInstance = @ModalFactory.invokeModal 'edit_offline_dd_question',
      resolve:
        question_params: => line_item
        response_types: => @responseTypes

  cancelNewSection: (line_item) =>
    line_item.add_new_section = false

    delete line_item.new_section

  onWizardStepChange: (idx) ->
    if @wizard_steps.indexOf(@document.status) is idx
      return

    if idx >= @wizard_steps.length
      return

    status = @wizard_steps[idx]

    @updateStatus(status)

  loadDocument: (id) ->
    @DDDocumentUploadDataservice.getDocument(id).then (response) =>
      @document = response

      @initializeProjectName(response)
      @getTemplate()

      if response.job.percentage_completed is 100
        @ai_mapping_prediction = response.mapping_prediction_percentage
        @initWizard()
      else
        @$state.go 'app.content.document_upload.view_progress'

  initWizard: ->
    idx = @wizard_steps.indexOf(@document.status)

    if idx >= 0
      @wizard_start_step = idx + 1
    else
      #technically this should never happen but you know!
      @Utils.logError('Invalid dd document status: #{@document.status}', error)
      @wizard_start_step = 1

  getMappedQuestions: (page_number)->
    unless page_number?
      page_number = @current_page + 1

    @DDDocumentUploadDataservice
      .getMappedQuestions(@document_id, {
        pageNumber: page_number
      })
      .then (response) =>
        @current_page = response.meta.pageNumber

        unless @questions
          @questions = []

        angular.forEach response.results, (result) =>
          @questions.push(result)

        if @current_page < response.meta.totalPages
          @getMappedQuestions()

  getTemplate: =>
    @loading_template = true
    @TemplatesDataService.getTemplate(@document.template_id).then (response) =>
      @template = response
      @project_name = response.name
      @loading_template = false

  updateTemplateName: ->
    return unless @template.templateInfo.name.length > 0
    params = name: @template.templateInfo.name
    @TemplatesDataService.updateTemplate(@document.template_id, params).then (response) =>
      message = 'Questionnaire template name updated'

      @toaster.pop 'success', message
      @template.templateInfo.name = response.name
      @project_name = response.name

  fundSelectionFormIsValid: =>
    @fund_selection_form.$valid

  allQuestionsCategorized: =>
    return true unless @questions.length

    deferred = @$q.defer()
    text = "They will not be available in the questionnaire"

    @SweetAlert.confirm({
      title: "There are questions which have not been categorized"
      text: text
      confirmButtonText: 'Proceed'
      focusCancel: true
    }).then (isConfirm) =>
      if isConfirm.value and isConfirm.value == true
        deferred.resolve(true)
      else if isConfirm.dismiss and isConfirm.dismiss == 'cancel'
        deferred.reject(false)

    deferred.promise

  toggleContentType: (type, line_item) ->

    if type is 'is_question'
      if line_item.is_question
        line_item.is_section = false

    else if type is 'is_section'
      if line_item.is_section
        line_item.is_question = false

    promise = @updateContent(line_item)

    promise.then =>
      message = "Updated the content"
      @getLineItemsCount()
      @toaster.pop 'success', '', message

  preselectLineItems: (response) ->
    @$timeout => #grid rows aren't rendered yet, so $timeout
      _(response.results).each (line_item) =>
        if line_item.is_question or line_item.is_section
          @review_questions_grid.selection.selectRow(line_item)

  updateContent: (line_item) ->
    @updating_content = true

    @updateLineItem(line_item, {is_question: line_item.is_question, is_section: line_item.is_section}).then(=>
      @updating_content = false
    , =>
    )

  markAsQuestion: (line_item) ->
    @marking_as_question = true

    @review_questions_grid.selection.selectRow(line_item)

    @updateLineItem(line_item, {is_question: true}).then(=>
      @marking_as_question = false
    , =>
      @review_questions_grid.selection.unSelectRow(line_item)
    )

  unmarkAsQuestion: (line_item) ->
    @unmarking_as_question = true

    @review_questions_grid.selection.unSelectRow(line_item)

    @updateLineItem(line_item, {is_question: false}).then(=>
      @unmarking_as_question = false
    , =>
      @review_questions_grid.selection.selectRow(line_item)
    )

  updateLineItem: (line_item, params) ->
    @DDDocumentUploadDataservice
      .updateLineItem(line_item.id, params)
      .then((response) ->
        angular.extend(line_item, response)
      )

  postLineItemsForTemplate: =>
    @building_template_in_progress = true
    @DDDocumentUploadDataservice
    .updateLineItemsForTemplate(@document_id)
    .then((response) =>
      message = "Updated mappings"
      @toaster.pop 'success', '', message
      @building_template_in_progress = false
    )

  getDocumentLineItems: ->
     defaults =
       document_id: @document_id
       is_question: true
       pageNumber: @current_line_items_page

     params = angular.extend({}, defaults, @line_item_filters)

     @loading_line_items = true

     @DDDocumentUploadDataservice
       .getDocumentLineItems(params)
       .then (response) =>
         @line_items = response.results
         @total_records = response.meta.totalRecords
         @loading_line_items = false

  completeReview: =>
    @completing_review = true
    @updateStatus('template_configured')
    params = {
      activate: if @redirectToTemplateCreation or !@request then false else true
    }
    @DDDocumentUploadDataservice.updateLineItemsForTemplate(@document_id,params).then (response)=>
      if @redirectToTemplateCreation or !@request
        @saveAndRedirectToTemplate()
      else
        @createDiligence()
    ,(error)=>
      @completing_review = false

  generatePageUrl: (entity_id, entity_type)=>
    pageUrl = ""
    if entity_type.toLowerCase() == @keywordConstants.Firm.toLowerCase()
      pageUrl = "app/firms/#{entity_id}/new_ddq"
    else if entity_type.toLowerCase() == @keywordConstants.Product.toLowerCase()
      pageUrl = "app/funds/#{entity_id}/new_ddq"
    pageUrl

  createDiligence: =>
    params =
      'diligence_type': if @request and @request.type.toLowerCase() == @RequestTypes.PREAPPROVED.toLowerCase() then 'dd_profile' else 'dd_new'
      'entities': [{'id':@request.entity_id,'entity_type': @request.entity_type, 'template_id': @template.templateInfo.id}]
      'name': @request.name
      'due_at' : @$filter('date')(@request.due_at, 'MM-dd-yyyy')
      'as_of_date' : @$filter('date')(@request.as_of_date, 'MM-dd-yyyy')
      'is_internal': true

    if @request.investor_id
      params.investor_id = @request.investor_id

    if @request.params
      pageUrl = (JSON.parse(@request.params)).pageUrl
    else
      pageUrl = @generatePageUrl(entity_id, entity_type)

    @RestangularHeaderService.RestangularWithHeader(pageUrl).all('v2/diligences').post(params).then((response) =>
      @updateRequestandRedirect(response)
    , (error)=>
      @completing_review = false
    )

  updateRequestandRedirect: (response)=>
    if @request and @request.id
      @request.duediligence_id = response.id
      @request.latest_step = @requestSteps.COMPLETE_REQUEST
      @request.template_id = @template.templateInfo.id
      @DueDiligenceDataservice.saveRequest(@request).then (res) =>
        @successHandler(response)
      ,(error)=>
        @completing_review = false
    else
      @successHandler(response)

  successHandler: (response)=>
    @completing_review = false
    @toaster.pop 'success', 'Your project is successfully created'
    @$state.go 'app.diligence.project.questionnaire', {diligenceId: response.id}

  saveAndRedirectToTemplate: =>
    if @request
      @request.latest_step = @requestSteps.TEMPLATE_BUILDER
      @request.template_id = @template.templateInfo.id
      @DueDiligenceDataservice.saveRequest(@request).then((res) =>
        @$state.go 'app.diligence.template.categories',
          templateId: res.template_id
          request: res.id
        @completing_review = false
      ,(error)=>
        @completing_review = false
      )
    else
      @completing_review = false
      @$state.go 'app.diligence.template.categories',
          templateId: @template.templateInfo.id

  getRequest: =>
    requestId = @$state.params.request
    return unless requestId

    @DueDiligenceDataservice.getRequest(requestId).then (response) =>
      @request = response
