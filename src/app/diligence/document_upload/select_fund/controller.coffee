class DiligenceDocumentUploadSelectFundController extends BaseController
  @register 'DiligenceDocumentUploadSelectFundController'

  @inject '$stateParams', 'DDDocumentUploadDataservice', 'FundDataservice', '$q',
          'InvestorDataservice', 'DDDocumentUploadDataservice', 'JobDataservice',
          '$state', 'Utils'

  initialize: ->
    @document_id = @$stateParams.documentUploadId
    @job =
      entity_type: 'Attachment'
      entity_id: @document_id
      job_type: 'map_questions'
      job_params:
        doc_url: null
    @investor_deferred = @$q.defer()
    @entity_type = @Utils.getEntityType()

    promises = []

    promises.push @getDocument(@document_id)
    promises.push @getFunds()
    promises.push @investor_deferred.promise

    @getInvestors()

    @$q.all(promises).then =>
      @data_loaded = true

  getDocument: (id) ->
    @DDDocumentUploadDataservice.getDocument(id).then (response) =>
      @dd_document = response

  getFunds: ->
    @FundDataservice.getFunds().then (response) =>
      @funds = response

  getInvestors: (page_number=1)->
    params =
      pageNumber: page_number

    @InvestorDataservice.getInvestors(params).then (response) =>
      @investors = [] unless @investors

      angular.forEach response.results, (result) =>
        @investors.push(result)

      if response.meta.pageNumber < response.meta.totalPages
        @getInvestors(response.meta.pageNumber + 1)
      else
        @investor_deferred.resolve()

  getSignedUrl: (id) ->
    @DDDocumentUploadDataservice.getSignedUrl(id)

  addJob: (params) ->
    @JobDataservice.create(params)

  submit: ->
    if @fund_selection_form.$valid
      @saving = true

      @getSignedUrl(@document_id).then((url) =>
        @job.job_params.doc_url = url

        @job
      ).then((params) =>
        @addJob(params)
      ).then(=>
        @saving = false
        @$state.go 'app.content.document_upload.view_progress'
      )
