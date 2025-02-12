class ManageExcelFileController extends ModalController

  @register 'ManageExcelFileController'

  @inject '$scope','TemplatesDataService', '$state', 'Restangular', '$uibModalInstance', 'Utils', 'toaster','FileHandlerFactory','DueDiligenceDataservice','params', 'ERROR_CODES', 'SweetAlert', 'keywordConstants', 'Upload', 'baseUrl', '$timeout'

  initialize: ->

    @edit_mode = false
    @maxFileSize = @FileHandlerFactory.getMaxFileSize()
    @current_firm = @Utils.getCurrentFirm()
    allowed_file_extensions = ['XLSX', 'xlsx']

    @allowed_file_extensions_str = _(allowed_file_extensions).map((ext) ->
      '.' + ext
    ).join(',')

    # @$scope.$watch 'vm.files', (value) =>
      # if value and value.length > 0 and not @manage_template.name
        # @manage_template.name = value

    @entity_sub_type = @Utils.getEntitySubType()
    @isManager = @Utils.isManager()
    @is_vendor = @Utils.isVendorSubscription()

    @Restangular.all('frequency').getList().then (response) =>
      @frequencies = response

    if @is_vendor
      @Restangular.all('vendor_types').getList().then (response) =>
        @strategies = response
    else
      @Restangular.all('strategies').getList().then (response) =>
        @strategies = response

  getFileExtension: (file_name) =>
    file_name.substring(file_name.lastIndexOf('.')+1, file_name.length) || file_name

  submit: =>
    @saving_template = true
    @uploadExcelFile(@files, @manage_template)

  saveAndRedirectToTemplate: (response,optionType)=>
    if optionType == @requestSteps.DOC_PARSER
      @pendingrequest.template_id = response.template_id
      @pendingrequest.document_id = response.id
    else
      @pendingrequest.template_id = response.id
    @pendingrequest.latest_step = optionType

    if @pendingrequest.is_firm_dd
      @pendingrequest.entity_type = @keywordConstants.Firm
      @pendingrequest.entity_id = @current_firm.id
    else
      @pendingrequest.entity_type = @keywordConstants.Product

    @DueDiligenceDataservice.saveRequest(@pendingrequest).then((res) =>
      @$uibModalInstance.close response
      if optionType == @requestSteps['TEMPLATE_BUILDER']
        @$state.go 'app.diligence.template.categories',
          templateId: response.id
          add: true
          request: res.id
      else
        @$state.go 'app.content.document_upload.view_progress', {
          documentUploadId: response.id
          request: res.id
        }
    )

  cancel: ->
    @$uibModalInstance.dismiss 'cancel'

  redirectToDocuments: =>
    @$uibModalInstance.close null
    @$state.go "app.content.document_uploads"

  uploadFiles: (files, apiUrl) ->
    params =
      url: @baseUrl + apiUrl
      method: 'POST',
      file: files
    @Upload.upload(params)

  uploadExcelFile: (file, templateParams) ->
    # upload_file =
    #   name: file.name

    url = '/excel_parser/upload'
    promise = @uploadFiles(file, url)
    #
    # @upload_files.push(upload_file)
    ogFile = file
    promise.then (result) =>
      @TemplatesDataService.setExcelParcerData(result.data)
      @TemplatesDataService.setOriginalExcelFile(file)
      if templateParams
        @TemplatesDataService.setTemplateParams(templateParams)
      else
        @TemplatesDataService.setTemplateParams({name: ogFile[0].name})

      result.file = ogFile
      @$timeout =>
        @close(result)
    , (reason) =>
      @saving_template = false

  uploadDocument: =>
    file_handler1 = @FileHandlerFactory.get('file-handler-one')
    file_handler2 = @FileHandlerFactory.get('file-handler-two')
    selected_file_handler = {}

    _([file_handler1, file_handler2]).each (handler) =>
      if(handler != undefined && handler.files != undefined && handler.files.length > 0 && (handler.files[0].name == @files[0].name))
        selected_file_handler = handler
    selected_file_handler.upload()

  manageDocumentTemplate: =>
    unless @files?.length
      @toaster.pop 'error', '', 'Please select at least one file'
      return

    @saving_template = true

    @TemplatesDataService.createNewTemplate(@manage_template).then (response) =>
      @documentParams = {
        template_id: response.id
      }
      @uploadDocument()
      @$uibModalInstance.close response
    .finally => @saving_template = false

  documentUploadComplete: (response)=>
    if response.length > 0
      if @source == "InformationRequestFlow"
        @saveAndRedirectToTemplate(response[0],@optionType)
      else
        @$state.go 'app.content.document_upload.view_progress', {
          documentUploadId: response[0].id
        }

  changeOptionType: (option)=>
    @optionType = option
