class AddAttachmentDocumentController extends ModalController
  @register 'AddAttachmentDocumentController'

  @inject '$stateParams', 'toaster', '$state', 'Restangular','FileHandlerFactory', 'DocumentsService','question','Utils'

  initialize: ->
    @tabType = "new"
    @drop_files = []
    @params = {}
    @files = []
    @firmId = @Utils.getCurrentFirm().id
    allowed_file_extensions = @FileHandlerFactory.getFileTypes()
    @maxFileSize = @FileHandlerFactory.getMaxFileSize()
    @maxDate = new Date()
    @allowed_file_extensions_str = _(allowed_file_extensions).map((ext) ->
      '.' + ext
    ).join(',')
    @dict =
      "originalAssigned": {},
      "unassigned": {},
      "newAssigned":{}
    @getAllDocs()

  getAllDocs: () =>
    @loading = true
    # @$http.get(@baseUrl + '/attachments?sort_by=as_of_date&sort_direction=Ascending&start_date='+startDate+'&end_date='+endDate).then (response) =>
    @Restangular.all('PublicDocuments').getList().then (response) =>
      @attachments = response
      @loading = false
    ,(error)=>
      @loading = false

  setTabType: (type)=>
    @tabType = type

  removeAttachment: (attachment) ->
    attachment.assigned = false
    @attachedDocument = null


  assignAttachment: (attachment) ->
    @attachedDocument.assigned = false if @attachedDocument
    @attachedDocument = attachment
    @attachedDocument.assigned = true

  documentUploadComplete: (response) =>
    @savingDocument = false
    if response.length > 0 and response[0]
      @question.attachmentHtml = "<a data-ng-click=\"vm.downloadAttachment('"+response[0]+"')\">Download Source File</a>"
      @question.filename = @files[0].name
      @question.attachmentHref = response[0][0]
      @close null

  documentUploadFailed: (response)=>
    @savingDocument = false

  addDocumentSubmit : () =>
    return unless @documentForm.$valid

    unless @files?.length
      @toaster.pop 'error', '', 'Please select at least one file'
      return

    @savingDocument = true

    file_handler1 = @FileHandlerFactory.get('file-handler-one')
    file_handler2 = @FileHandlerFactory.get('file-handler-two')
    selected_file_handler = {}

    _([file_handler1, file_handler2]).each (handler) =>
      if(handler != undefined && handler.files != undefined && handler.files.length > 0 && (handler.files[0].name == @files[0].name))
        selected_file_handler = handler
    selected_file_handler.upload()

  submit: =>
    if @tabType == 'new'
      @addDocumentSubmit()
    else
      @savingDocument = true
      @question.attachmentHtml = "<a data-ng-click=\"vm.downloadAttachment('"+@attachedDocument.file_url+"')\">Download Source File</a>"
      @question.filename = @attachedDocument.file_name
      @question.attachmentHref = @attachedDocument.file_url
      @close null

  downloadAttachment: =>
    if @question.attachmentHref
      @DocumentsService.downloadAttachment(@question.attachmentHref)

  downloadDocument: (attachment)=>
    if attachment.file_url
      @DocumentsService.downloadAttachment(attachment.file_url)