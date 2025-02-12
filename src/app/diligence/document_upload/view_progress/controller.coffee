class DiligenceDocumentViewProgressController extends BaseController
  @register 'DiligenceDocumentViewProgressController'

  @inject '$stateParams', 'DDDocumentUploadDataservice', '$state'

  initialize: ->
    @document_id = @$stateParams.documentUploadId
    @getDocument(@document_id)

  getDocument: (id) ->
    @DDDocumentUploadDataservice.getDocument(id).then (response) =>
      @dd_document = response

  onJobProgressChange: (progress, job) ->
    job_type = job.job_type

    @job_type ||= job_type

    return unless progress is 100

    if @$state.params.request
      @$state.go 'app.content.document_upload.detail',{request:@$state.params.request}
    else
      @$state.go 'app.content.document_upload.detail'
