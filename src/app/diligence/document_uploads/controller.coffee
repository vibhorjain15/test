class DiligenceDocumentUploadsController extends BaseController
  @register 'DiligenceDocumentUploadsController'

  @inject 'DDDocumentUploadDataservice', '$state', 'SweetAlert',
          'toaster', 'FileHandlerFactory'

  initialize: ->
    @progress_states = [
      {index: 1, title: 'Review Questions and Confirm', status: 'question_reviewed'}
      {index: 2, title: 'Assign Product, Investor & Finalize', status: 'template_configured'}
    ]
    @current_page = 1
    @loadPendingDocumentUploads()
    @maxFileSize = @FileHandlerFactory.getMaxFileSize()

  gotoDocumentUploadDetail: (response) ->
    if response.length is 1
      @$state.go 'app.content.document_upload.view_progress', {
        documentUploadId: response[0][0].id
      }
    else
      @current_page = 1 #well the list is supposed to show recent documents first
      @loadPendingDocumentUploads()

  displayDocumentRemovalConfirmation: (dd_document) ->
    @SweetAlert.confirm({
      title: "Are you sure you want to remove this document?"
      focusCancel: true
      showLoaderOnConfirm: true
      preConfirm: =>
        @removeDocument(dd_document)
    })

  removeDocument: (dd_document) ->
    @DDDocumentUploadDataservice.removeDocument(dd_document.id).then =>
      @uploaded_documents.splice @uploaded_documents.indexOf(dd_document), 1
      @total_records--
      @toaster.pop 'success', '', 'Document successfully removed'
      swal.close()

  processDocument: (dd_document) ->
    progress_state = _(@progress_states).findWhere(
      status: dd_document.status
    )

    # Rehan, This section needs to reflect the two progress status above
    if !progress_state
      dd_document.status_summary = 'extraction_in_progress'
    # document questions are extracted but the active job
    # is still not about question mapping
    else if (progress_state.status is 'questions_extracted' and
             dd_document.job?.job_type is 'extract_doc')
      dd_document.status_summary = 'fund_selection_pending'
    else if (progress_state.status is 'questions_extracted' and
             dd_document.job?.job_type is 'map_questions' and
             dd_document.job.job isnt 100)
      dd_document.status_summary = 'mapping_in_progress'
    else
      dd_document.resumable = true

    dd_document.progress_state = progress_state

  loadPendingDocumentUploads: ->
    params =
      pageNumber: @current_page

    @loading = true

    @DDDocumentUploadDataservice.getDocuments(params).then (response) =>
      @total_records = response.meta.totalRecords
      @total_records = response.meta.totalRecords
      @current_page = response.meta.pageNumber

      angular.forEach response.results, (result) =>
        @processDocument(result)

      @uploaded_documents = response.results
      @loading = false

  resumeDocumentProcess: (dd_document) ->
    status_summary = dd_document.status_summary
    state_params =
      documentUploadId: dd_document.id

    if (status_summary in ['mapping_in_progress', 'extraction_in_progress'])
      @$state.go 'app.content.document_upload.view_progress', state_params
    else
      @$state.go 'app.content.document_upload.detail', state_params
