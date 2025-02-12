class ManageQAWordFileController extends ModalController

  @register 'ManageQAWordFileController'

  @inject '$scope','TemplatesDataService', '$state', 'Restangular', '$uibModalInstance', 'Utils', 'toaster','FileHandlerFactory','DueDiligenceDataservice', 'ERROR_CODES', 'SweetAlert', 'keywordConstants', 'Upload', 'baseUrl', '$timeout', '$q', 'entityTypeValue'

  initialize: ->
    @files = []
    @params = {}
    @edit_mode = false
    @maxFileSize = @FileHandlerFactory.getMaxFileSize()
    @firm_name = @Utils.getCurrentUser().firmInfo.name
    @current_firm = @Utils.getCurrentFirm()
    allowed_file_extensions = ['docx', 'DOCX']

    @allowed_file_extensions_str = _(allowed_file_extensions).map((ext) ->
      '.' + ext
    ).join(',')

    @entity_sub_type = @Utils.getEntitySubType()
    @isManager = @Utils.isManager()
    @is_vendor = @Utils.isVendorSubscription()
    @entity_types = [
      {alias: "My Firm" , name: @keywordConstants.MyFirm}
      {alias: "Product" , name: @keywordConstants.Product}
      {alias: "Strategy" , name: @keywordConstants.Strategy}
      {alias: "Vehicle" , name: @keywordConstants.Vehicle}
    ]
    @params.entity_type = @entity_types[0]
    promises = []
    promises.push @getFirms()
    promises.push @getStrategies()
    promises.push @Restangular.all('funds', null).getList().then (response) =>
      @funds = response

    promises.push @Restangular.all('vehicles').getList().then (response) =>
      @vehicles = response
    @$q.all(promises).then(=> @loading = false)
    @$scope.$watch 'vm.files', (value) =>
      if value and value.length
        @params.name = value[0].name + moment().format()

  getStrategies: =>
    params =
        include_contacts: false,
        include_custom_fields: false,
        include_dates: true,
        is_active: true,
        filters: {}
        search_for: @global_hierarchy_option
    @Restangular.all('service/dvapi_service/product_search').post(params).then (response) =>
        @strategies = angular.copy response.data

  getFirms: =>
    params =
      include_contacts: false,
      include_custom_fields: false,
      include_dates: true,
      is_active: true,
      filters: {}
    @loading = true
    @Restangular.all('service/dvapi_service/firm_search').post(params).then (response) =>
      @firms = response.data

  getFileExtension: (file_name) =>
    file_name.substring(file_name.lastIndexOf('.')+1, file_name.length) || file_name

  getEntityTypeNumber: (type) =>
    value = @entityTypeValue.Firm
    if type == @keywordConstants.Firm
      value = @entityTypeValue.Firm
    else if type == @keywordConstants.Product
      value = @entityTypeValue.Product
    else if type == @keywordConstants.Vehicle
      value = @entityTypeValue.Vehicle
    else if type == @keywordConstants.Strategy
      value = @entityTypeValue.Strategy
    value

  submit: =>
    if @files.length == 0
      @toaster.pop 'error', '', "Please select a file"
      return
    if !@params.entity_id && @params.entity_type.name != @keywordConstants.MyFirm
        @toaster.pop 'error', '', "Please select a #{@params.entity_type.alias}"
        return
    if @uploadQAForm.$valid
      @saving_template = true
      @params.selected_entity_type = @getEntityTypeNumber(@params.entity_type.name)
      @params.selected_entity_id = if @params.entity_type.name == @keywordConstants.MyFirm then @current_firm.id else @params.entity_id
      @uploadWordlFile(@files, @params)

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

  uploadWordlFile: (file, templateParams) ->
    # upload_file =
    #   name: file.name

    url = '/excel_parser/upload?parserType=Word'
    promise = @uploadFiles(file, url)
    #
    # @upload_files.push(upload_file)
    ogFile = file
    promise.then (result) =>
      @TemplatesDataService.setWordParcerData(result.data)
      @TemplatesDataService.setOriginalWordFile(file)
      if templateParams
        @TemplatesDataService.setTemplateParams(templateParams)
      else
        @TemplatesDataService.setTemplateParams({name: ogFile[0].name})

      result.file = ogFile
      @$timeout =>
        @$state.go 'app.diligence.word_to_template' , {doc_id: result.data.doc_id,  type: "QA"}
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
