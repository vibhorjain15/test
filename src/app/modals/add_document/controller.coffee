class DocumentAddController extends ModalController
  @register 'DocumentAddController'

  @inject '$stateParams', 'toaster', 'FileHandlerFactory', 'Restangular', 'BaseDataService'

  initialize: ->
    @getSourcesList()
    @maxFileSize = @FileHandlerFactory.getMaxFileSize()

  getSourcesList: =>
    @Restangular.all('document_sources').getList().then (response) =>
      @sources_options = response

  deleteFile: (idx) =>
    @files.splice(idx, 1)

  getDocumentUploadResponse: (response) =>
    @toaster.pop 'success', '', 'Document(s) successfully uploaded'
    @loading = false
    @close()

  handleUploadError: (response) =>
    avoid_error_logging_statuses = @BaseDataService.getAvoidErrorLoggingStatusList()
    if !(response.status in avoid_error_logging_statuses)
      @toaster.pop 'error', '', 'Something went wrong. Please try again.'
    @loading = false

  submit: =>
    return unless @add_document_form.$valid

    unless @files?.length
      @toaster.pop 'error', '', 'Please select at least one file'
      return

    @loading = true

    file_handler1 = @FileHandlerFactory.get('file-handler-one')
    file_handler2 = @FileHandlerFactory.get('file-handler-two')
    selected_file_handler = {}

    _([file_handler1, file_handler2]).each (handler) =>
      if(handler!=undefined && handler.files!=undefined && handler.files.length>0 && (handler.files[0].name == @files[0].name))
        selected_file_handler = handler

    selected_file_handler.upload()

