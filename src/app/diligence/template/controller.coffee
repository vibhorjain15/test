class DiligenceTemplateController extends BaseController

  @register 'DiligenceTemplateController'

  @inject 'Utils', '$stateParams', '$scope', 'TemplatesDataService', 'ModalFactory',
          '$state', 'toaster', 'SweetAlert', '$q', '$rootScope', 'Restangular','DueDiligenceDataservice','requestSteps', 'keywordConstants', 'RequestTypes', '$filter', 'RestangularHeaderService','$window','baseUrl','$http','angularTemplateEnabled'

  initialize: ->
    @isInvestor = @Utils.isInvestor()
    @isManager = @Utils.isManager()
    @$scope.template_version = null
    @tooltips = {}
    @isPopoverOpen = false
    @editTemplateUrl = 'diligence/template/edit-template-name.html'
    @templateId = @$stateParams.templateId
    @preview_disabled = true
    @active_section = {}

    @fetchTemplate()
    @getRequest()
    @$rootScope.$on 'refresh:template', @fetchTemplate

    @$scope.getTemplate = => @deferred.promise

    @$scope.setSelectedSection = (section) => @selected_section = section

    @$scope.$on 'preview:enable', =>
      @preview_disabled = false

    @$scope.$on 'update:active_section', (event, active_section) =>
      @active_section = active_section

    @frequencies = undefined

    @disable_print = true

    @$rootScope.$on '$stateChangeSuccess', (event, toState, toParams, fromState, fromParams) =>
      @disable_print = true

    @$rootScope.$on 'questionnaire_template:render', =>
      @disable_print = false

  getSectionsForPrint: (template) ->
    sections = angular.copy(template.templateInfo.sections)
    sub_sections = []

    sections = @Utils.groupSections(sections, true)

    _(sections).each (section) ->
      _(section.subSections).each (sub_section) ->
        return if sub_section.isParent
        sub_section.name = "#{section.name}: #{sub_section.name}"

        sub_sections.push sub_section

    sub_sections

  isTemplateValid: (isPreview) ->
    subcategories = []
    parents = []
    foundCategoryWithoutSubcategory = false
    foundSubcategoryWithoutQuestion = false
    isActive = false
    @TemplatesDataService.getTemplate(@templateId).then (template) =>
      # extract parentid and subcategory ids
      if !template.templateInfo.sections.length
        @toaster.pop 'error', "Please add atleast 1 category and SubCategory"
        return false

      if template.templateInfo.is_draft == false
        isActive = true
      _(template.templateInfo.sections).each (category) =>
        if category.parentID == 0 or !category.parentID
          if parents.indexOf(category.id) == -1
            parents.push parseInt(category.id)
        else
          if !category.questions.length
            foundSubcategoryWithoutQuestion = true
          if subcategories.indexOf(category.parentID) == -1
            subcategories.push parseInt(category.parentID)
      # check for each  parent id if there is a subcategory
      _(parents).each (parent) =>
        if subcategories.indexOf(parent) == -1
          foundCategoryWithoutSubcategory = true
          return false
      if foundCategoryWithoutSubcategory
        @toaster.pop 'error', "Please add atleast 1 subcategory in each category"
        return false
      if foundSubcategoryWithoutQuestion
        @toaster.pop 'error', "Please add atleast 1 question in each subcategory"
        return false
      if isActive
        if isPreview
          return true
        else
          @toaster.pop 'error', "Template is already in active state"
          return false
      return true

  confirmActivation: ->
    preview = false
    @isTemplateValid(preview).then (valid) =>
      if valid
        @SweetAlert.confirm({
          title: "Are you sure you want to activate this template?"
          text: 'This template would then be available during invitations'
          confirmButtonText: 'Yes, Please!'
          showLoaderOnConfirm: true
          preConfirm: =>
            @activateTemplate()
        })

  activateTemplate: ->
    # templateInfo
    @TemplatesDataService.activatePatchTemplate(@templateId).then((response) =>
      @template.templateInfo.is_draft = response.is_draft
      @updatePendingRequest()
      message = 'Template successfully activated'
      @toaster.pop 'success', '', message
      swal.close()
    , @handleActivationErrors)

  getRequest: =>
    requestId = @$state.params.request
    return unless requestId

    @DueDiligenceDataservice.getRequest(requestId).then (response) =>
      @request = response

  updatePendingRequest: =>
    if @request
      @request.latest_step = @requestSteps.COMPLETE_REQUEST
      @DueDiligenceDataservice.saveRequest(@request).then (response) =>
        @request = response

  handleActivationErrors: (error) =>
    swal.close()
    if error.data and error.data.message != ""
      @toaster.pop 'error', '', error.data.message
    @$scope.$emit 'activation:errors', error
    #watching logic pending

  fetchTemplate: =>

    @deferred = @$q.defer()

    @TemplatesDataService.getTemplate(@templateId).then (template) =>
      @$rootScope.title = "DiligenceVault - #{template.templateInfo.name}" #http://stackoverflow.com/questions/26905908/chrome-save-to-pdf-custom-filename
      @printOptions =
        pageTitle: "DiligenceVault - #{template.templateInfo.name}"

      isSystemTemplate = template.templateInfo.isSystem

      @$scope.template_version = template.version
      @template = template
      @template.isEditable = !isSystemTemplate
      @template.canBeCloned = true
      @template.templateTypeName = @getTemplateTypeDisplay()
      @activateTooltipText = @getActivateButtonTooltipText()
      @startRequestButton = @getRequestButtonText()

      unless @template.canBeCloned
        @tooltips.clone = 'Only Investors can copy templates'

      if isSystemTemplate
        @tooltips.edit = 'System Templates cannot be edited. You can copy this template & edit them instead.'
        @tooltips.delete = 'System Templates cannot be deleted'
      else
        @tooltips.edit = 'Edit template name'

      if !@frequencies
        @getFrequencies().then (response) =>
          @setFrequency()
      else
        @setFrequency()

      @deferred.resolve template

  getFrequencies: =>
    @Restangular.all('frequency').getList().then (response) =>
      @frequencies = response

  getRequestButtonText: =>
    if @isManager
      if @template.templateInfo.type == 'dd_profile'
        {
          text: 'New Pre-Approved Project'
          tooltip: 'Create a new pre-approved project to populate this template with your latest and greatest.'
        }
      else
        {
          text: 'New Project'
          tooltip: 'Create a new investor request or standard DDQ project with this template.'
        }
    else
      if @template.templateInfo.type == 'dd_profile'
        {
          text: 'New Internal Profile'
          tooltip: 'Create a new internal profile for a manager firm or product.'
        }
      else
        {
          text: 'Start New Request'
          tooltip: 'Start new request'
        }

  getActivateButtonTooltipText: =>
    if @isManager
      if @template.templateInfo.type == 'dd_profile'
        'Please activate this template to use for a pre-approved project.'
      else
        'Please activate this template to use for an investor request or standard DDQ project.'
    else
      if @template.templateInfo.type == 'dd_profile'
        'Please activate this template to use for product or firm profiles.'
      else
        'Please activate this template to use for requests.'

  setFrequency: =>
    i = 0
    while i < @frequencies.length
      if @frequencies[i].id == @template.frequency_id
        @template.frequency_name = @frequencies[i].value
        break
      i++

  displayEditPopover: ->
    @template_copy = angular.copy(@template)
    @isPopoverOpen = true

  cloneTemplate: ->
    return unless @template.canBeCloned

    @SweetAlert.confirm({
      title: 'Are you sure you want to copy and edit this template?'
      confirmButtonText: 'Yes, Please!'
      showLoaderOnConfirm: true
      preConfirm: =>
        @cloning_template = true
        @TemplatesDataService.cloneTemplate(@templateId).then ((response) =>
          message = "Template #{@template.templateInfo.name} successfully copied"
          @$state.go 'app.diligence.template.categories', templateId: response.id
          @cloning_template = false
          swal.close()
        ), (error) =>
          swal.close()
          @cloning_template = false
    })

  openUpdateTemplateModal: =>
    @ModalFactory.invokeModal 'manage_template',
      resolve:
        template : => @template
      success: (template) =>
        @template.templateInfo.name = template.name
        @template.frequency_id = template.frequency_id
        @setFrequency()

  updateTemplate: ->
    return unless @edit_template_form.$valid

    params = name: @template_copy.templateInfo.name

    @updating_template = true
    @TemplatesDataService.updateTemplate(@templateId, params).then((response) =>
      message = 'Template name updated'

      @toaster.pop 'success', message
      @template.templateInfo.name = response.name
      @isPopoverOpen = false
    ).finally(=> @updating_template = false)

  deleteTemplate: ->
    return unless @template.isEditable

    if @template.templateInfo.diligence_counts > 0
      alertText = "This template is associated with #{@template.templateInfo.diligence_counts} active projects. The associated rating scheme will also be deleted."
    else
      alertText = "You will not be able to recover this imaginary file!"

    @SweetAlert.confirm({
      title: 'Are you sure?'
      text: alertText
      confirmButtonText: 'Yes, delete it!'
    }).then (isConfirm) =>
      if isConfirm.value and isConfirm.value == true
        @deleting_template = true
        @TemplatesDataService.deleteTemplate(@templateId).then =>
          @toaster.pop 'success', '', "Template deleted successfully"
          @$state.go 'app.diligence.templates'

  onEditTemplate: =>
    if @template.templateInfo.isExpiredTemplateVersion
      @creating_version = true
      @TemplatesDataService.createVersion(@template.templateInfo.id, @template.templateInfo.version).then (response)=>
        @template.version = response.version
        @template.templateInfo.version = response.version
        @$scope.template_version = response.version
        @$state.go 'app.diligence.template.categories'
        @creating_version = false
      , (error)=>
        @goToEditTemplate()
        @creating_version = false
    else
      @goToEditTemplate()

  goToEditTemplate: =>
    if @active_section.category_id && not @active_section.sub_category_id
      @$state.go 'app.diligence.template.categories.subcategories', {categoryId: @active_section.category_id}
    if (@active_section.category_id && @active_section.sub_category_id)
      @$state.go 'app.diligence.template.categories.subcategories.questions', {categoryId: @active_section.category_id, subcategoryId: @active_section.sub_category_id}
    else if (@$state.current.name == 'app.diligence.template.scoring')
      @$state.go 'app.diligence.template.categories'

  gotoPreview: ->
    @$state.go 'app.diligence.template.preview', {refresh: true}

  gotoTemplateScoring: ->
    @$state.go 'app.diligence.template.scoring'

  createNewTemplate: ->
    @ModalFactory.invokeModal 'manage_template'

  addNewDDQ: =>
    #dont allow them to open the modal if the template is in draft and they try to complete the request
    if not (@request and @template.templateInfo.is_draft)
      #open modal for all the manager request and investor dd_profiles
      if (@template.templateInfo.type == 'dd_profile' and @isInvestor) or @isManager
        dd_status = @template.templateInfo.type
        @ModalFactory.invokeModal 'add_ddq',
          resolve:
            type: => dd_status
            template_id: => Number(@templateId)
            request: => @request
            source: => 'template'
      else
        #for other investor requests, redirect them to the invite page
        @$state.go 'app.diligence.invite',{templateId:@templateId}

  getTemplateTypeDisplay: =>
    switch @template.type
      when 'dd_doc'
        return 'DOCUMENT'
      when 'dd_profile'
        if @isInvestor
          return 'PROFILE'
        else
          return 'PRE-APPROVED'
      when 'dd_new'
        return 'STANDARD'

  goBackToPreviousPage: =>
    if @$rootScope.fromState and (@$rootScope.fromState.name.indexOf('project.questionnaire') > -1 or @$rootScope.fromState.name.indexOf('app.diligence.project.questionnaire.category') > -1)
      @$state.go @$rootScope.fromState.name, @$rootScope.fromParams
    else
      @$window.history.back()

  generatePageUrl: (entity_id, entity_type)=>
    pageUrl = ""
    if entity_type.toLowerCase() == @keywordConstants.Firm.toLowerCase()
      pageUrl = "app/firms/#{entity_id}/new_ddq"
    else if entity_type.toLowerCase() == @keywordConstants.Product.toLowerCase()
      pageUrl = "app/funds/#{entity_id}/new_ddq"
    pageUrl

  startPopulating: =>
    @isTemplateValid(true).then (valid) =>
      if valid
        @starting_ddq = true

        temp_id = if @request.template_id then @request.template_id else @templateId
        params =
          'diligence_type': if @request.type.toLowerCase() == @RequestTypes.PREAPPROVED.toLowerCase() then 'dd_profile' else 'dd_new'
          'entities': [{'id':@request.entity_id,'entity_type': @request.entity_type, 'template_id': temp_id}]
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
          @starting_ddq = false
        )

  updateRequestandRedirect: (response)=>
    if @request and @request.id
      @request.duediligence_id = response.id
      @DueDiligenceDataservice.saveRequest(@request).then (res) =>
        @successHandler(response)
      ,(error)=>
        @starting_ddq = false
    else
      @successHandler(response)

  successHandler: (response)=>
    @starting_ddq = false
    @toaster.pop 'success', 'Your project is successfully created'
    @$state.go 'app.diligence.project.questionnaire', {diligenceId: response.id}

  createRatingFromTemplate: =>
    @ModalFactory.invokeModal 'create_rating_map',
      resolve:
        template: => @template

  gotoFormulasSetup: =>
    @$state.go 'app.diligence.template.advanced_setup'

  downloadAsExcel: =>
    @toastInstance = @toaster.pop({type: 'info', title: 'Processing Excel Download...', body: 'Please wait while the excel file is being generated.', timeout: 0})
    @$http.post(@baseUrl + '/service/excel_services/excel_template_export', {template_id: @templateId}, {
      responseType:'arraybuffer'
    })
    .then ((response) =>
      octetStreamMime = 'application/octet-stream'
      success = false
      # Get the headers
      headers = response.headers()
      # Get the filename from the x-filename header or default to "download.bin"
      contentDisposition = response.headers('Content-Disposition')
      filename_from_header = contentDisposition.split(';')[1].split('filename')[1].split('=')[1].trim()
      filename = filename_from_header or 'download.xlsx'
      # Determine the content type from the header or default to "application/octet-stream"
      contentType = headers['content-type'] or octetStreamMime
      try
      # Try using msSaveBlob if supported
        blob = new Blob([ response.data ], type: contentType)
        if navigator.msSaveBlob
          navigator.msSaveBlob blob, filename
        else
          # Try using other saveBlob implementations, if available
          saveBlob = navigator.webkitSaveBlob or navigator.mozSaveBlob or navigator.saveBlob
          if saveBlob == undefined
            throw 'Not supported'
          saveBlob blob, filename
        success = true
      catch ex
        # we need to add log this error to slack rather than printing it on browser console
        # console.log 'saveBlob method failed with the following exception:'
        # console.log ex
      if !success
        # Get the blob url creator
        urlCreator = window.URL or window.webkitURL or window.mozURL or window.msURL
        if urlCreator
          # Try to use a download link
          link = document.createElement('a')
          if 'download' of link
            # Try to simulate a click
            try
            # Prepare a blob URL
              blob = new Blob([ response.data ], type: contentType)
              url = urlCreator.createObjectURL(blob)
              link.setAttribute 'href', url
              # Set the download attribute (Supported in Chrome 14+ / Firefox 20+)
              link.setAttribute 'download', filename
              # Simulate clicking the download link
              event = document.createEvent('MouseEvents')
              event.initMouseEvent 'click', true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null
              link.dispatchEvent event
              success = true
            catch ex
              # we need to add log this error to slack rather than printing it on browser console
              # console.log 'Download link method with simulated click failed with the following exception:'
              # console.log ex
          if !success
            # Fallback to window.location method
            try
            # Prepare a blob URL
            # Use application/octet-stream when using window.location to force download
              blob = new Blob([ response.data ], type: octetStreamMime)
              url = urlCreator.createObjectURL(blob)
              window.location = url
              success = true
            catch ex
              # we need to add log this error to slack rather than printing it on browser console
              # console.log 'Download link method with window.location failed with the following exception:'
              # console.log ex
      if !success
        # Fallback to window.open method
        popup = window.open httpPath, '_blank', ''
        PopupCheckerService.check(popup)
      @toaster.clear(@toastInstance)
      @resetFilter()
    ), (error) =>
      @toaster.clear(@toastInstance)
      @toaster.pop 'error', '', 'Something went wrong'
