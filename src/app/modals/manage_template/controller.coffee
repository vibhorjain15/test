class ManageTemplateController extends ModalController

  @register 'ManageTemplateController'

  @inject '$scope','TemplatesDataService', '$state', 'Restangular', '$uibModalInstance', 'Utils', 'template', 'toaster','FileHandlerFactory','source','pendingrequest','DueDiligenceDataservice','templateOptions','requestSteps', 'ERROR_CODES', 'SweetAlert', 'keywordConstants', 'Upload', 'baseUrl', '$timeout'

  initialize: ->
    @isManager = @Utils.isManager()
    @isParserUpload = false
    @parserType = ""
    @is_vendor = @Utils.isVendorSubscription()
    @files = []

    @edit_mode = false
    @maxFileSize = @FileHandlerFactory.getMaxFileSize()
    @current_firm = @Utils.getCurrentFirm()
    @current_user = @Utils.getCurrentUser()
    @permissions_enabled = @current_user.firmInfo.hasPermissionEnabled
    @selectedTeams = []
    allowed_file_extensions = ['xlsx', 'docx', 'DOCX', 'XLSX']
    @fromManagerRequest = false
    if (@source and @source == 'InformationRequestFlow') and @isManager and @pendingrequest.type == "investor_request"
      @fromManagerRequest = true

    @allowed_file_extensions_str = _(allowed_file_extensions).map((ext) ->
      '.' + ext
    ).join(',')

    @$scope.$watch 'vm.files', (value) =>
      if value and value.length
        @manage_template.name = value[0].name + moment().format()

    if (@template)
      @manage_template = {
        name: @template.templateInfo.name
        frequency_id: @template.frequency_id
        is_draft: @template.templateInfo.is_draft
      }
      @templateId = @template.templateInfo.id
      @edit_mode = true
    else
      @manage_template = type: 'dd_new'

    if @templateOptions
      @manage_template.type = @templateOptions.templateType
      @manage_template.type_disabled = true
      @manage_template.name = @templateOptions.templateName

    if @templateOptions and @templateOptions.optionType
      @optionType = @templateOptions.optionType
    else
      @optionType = @requestSteps['TEMPLATE_BUILDER']

    @entity_sub_type = @Utils.getEntitySubType()

    @Restangular.all('frequency').getList().then (response) =>
      @frequencies = response

    @Restangular.all('PermissionLevels').customGET().then (response) =>
      index = _(response).findIndex (permission)=>
        permission.name == 'Private'
      @visibilityList = _(response).splice(index,1)

    @Restangular.one('firms', @current_firm.id).all('teams').getList().then (response) =>
      @teams = response

    if @is_vendor
      @Restangular.all('vendor_types').getList().then (response) =>
        @strategies = response
    else
      @Restangular.all('strategies').getList().then (response) =>
        @strategies = response

  saveClickedElement: (event) =>
    @currentEvent = event

  getFileExtension: (file_name) =>
    fileExt = file_name.substring(file_name.lastIndexOf('.')+1, file_name.length) || file_name
    fileExt = fileExt.toLowerCase()
    fileExt

  submit: =>
    @teamselectionForm.$setSubmitted true if @teamselectionForm
    if (@optionType == @requestSteps.DOC_PARSER || @optionType == @requestSteps.EXCEL_PARCER) and @files.length == 0
      @toaster.pop 'error', '', "Please select a file"
      return

    if @manage_template_form.$valid
      if @files and @files.length
        @isParserUpload = true
        @optionType = @requestSteps.DOC_PARSER
        fileExt = @getFileExtension(@files[0].name)
        if fileExt == 'xlsx'
          @optionType = @requestSteps.EXCEL_PARCER

      if @optionType == @requestSteps.DOC_PARSER
        if fileExt != 'pdf'
          @saving_template = true
          @parserType = "Word"
          @uploadParserFile(@files, @parserType, @manage_template)
        else
          @saving_template = true
          @parserType = "Pdf"
          @uploadParserFile(@files, @parserType, @manage_template)
        return
      if @optionType == @requestSteps.EXCEL_PARCER
        @saving_template = true
        @manage_template.source = @source
        @parserType = "Excel"
        @uploadParserFile(@files, @parserType, @manage_template)
        return

      @saving_template = true
      if @edit_mode
        @TemplatesDataService.updateTemplate(@templateId, @manage_template).then((response) =>
          message = 'Template info updated'
          @toaster.pop 'success', message
          @$uibModalInstance.close response
        ).finally =>
          @saving_template = false

      else
        return if (@teamselectionForm and @teamselectionForm.$invalid)
        params_temp_copy = angular.copy @manage_template
        params_temp_copy.permissions = []
        _(@selectedTeams).each (team)=>
          if team.team and team.access
            params_temp_copy.permissions.push {
              assigned_to_entity_type: 'Team'
              assigned_to_entity_id: team.team
              access_level: team.access
              entity_type: @keywordConstants.Template
            }
        @TemplatesDataService.createNewTemplate(params_temp_copy).then((response) =>
          if @source == "InformationRequestFlow"
            @saveAndRedirectToTemplate(response,@optionType)
          else
            @$uibModalInstance.close response
            @$state.go 'app.diligence.template.categories',
              templateId: response.id
              add: true
        ).finally =>
          @saving_template = false
          if error.status == @ERROR_CODES.BAD_REQUEST
            @SweetAlert.error({
              title: error.data
              confirmButtonText: 'Okay'
            }).then (confirm) =>
              if confirm.value and confirm.value == true
                @$state.go("app.diligence.template.preview",{templateId: @templateId})
          else if error.data != ""
            @toaster.pop 'error', '', error.data

  saveAndRedirectToTemplate: (response,optionType)=>
    if optionType == @requestSteps.DOC_PARSER
      @pendingrequest.template_id = response.template_id
      @pendingrequest.document_id = response.id
    else if optionType == @requestSteps.EXCEL_PARCER
      @pendingrequest.template_id = response.template_id
      @pendingrequest.document_id = response.doc_id
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
        if @isParserUpload
          @TemplatesDataService.setRequestTrackerParams(res)
          if @parserType == "Excel"
            @$timeout =>
              @$state.go 'app.diligence.excel_to_template' , {doc_id: response.doc_id,  type: "EP"}
          else
            @$timeout =>
              @$state.go 'app.diligence.word_to_template' , {doc_id: response.doc_id,  type: "WP"}
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

  uploadParserFile: (file, type ,templateParams) ->
    url = '/excel_parser/upload?parserType='+ type
    promise = @uploadFiles(file, url)
    parserSource = "WP"
    promise.then (result) =>
      if @source and @source == "InformationRequestFlow"
        templateParams.source = "InformationRequestFlow"
      else
        @TemplatesDataService.setDiligenceParams({})
      console.log "type" , type
      if type == 'Excel'
        parserSource = "EP"
        @TemplatesDataService.setExcelParcerData(result.data)
        @TemplatesDataService.setOriginalExcelFile(file)
      else
        @TemplatesDataService.setWordParcerData(result.data)
        @TemplatesDataService.setOriginalWordFile(file)
      @TemplatesDataService.setTemplateParams(templateParams)
      @TemplatesDataService.setPermissionsParams(teams: @selectedTeams)

      if type == 'Excel'
        @$state.go 'app.diligence.excel_to_template' , {doc_id: result.data.doc_id, type: 'EP'}
      else
        @$state.go 'app.diligence.word_to_template' , {doc_id: result.data.doc_id, type: "WP"}
      @close()
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
