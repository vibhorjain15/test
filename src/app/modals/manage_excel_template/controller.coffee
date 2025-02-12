class ManageExcelTemplateController extends ModalController

  @register 'ManageExcelTemplateController'

  @inject '$uibModalInstance', 'RestangularHeaderService', 'toaster', 'Restangular', 'Utils', '$state', '$timeout', '$scope', 'ModalFactory', 'params', 'SweetAlert', 'TemplatesDataService', 'DueDiligenceDataservice', '$filter', 'requestSteps', 'baseUrl', '$http', 'source', 'selection', '$tinymceMentionsPlaceholderText','keywordConstants'

  initialize: =>
    # initialize empty params
    @activeTab = "Question"
    @current_firm = @Utils.getCurrentFirm()
    @responseFromQa = {original:{sections: []}, existing: {sections: []}}
    @documentHasDuplicates = false
    @activeView = "original"
    @originalContentFound = false
    @request = {}
    @dd_params = {}
    @finalData = {}
    @isDiligenceCreation = false
    @finalData = @params
    @dd_params = @TemplatesDataService.getDiligenceParams()
    @template_params = @TemplatesDataService.getTemplateParams()
    @requestTrackerParams = @TemplatesDataService.getRequestTrackerParams()
    @isWordParser = false
    @isQAflow = false
    @responseTypes = []
    @selected_response_type = {}
    @excludedResponseTypes = ["aumTable" , "DynamicGrid", "Grid", "CheckBox", "Bookends", "NoPlus", "BooleanPlus", "ReturnTable"]
    @TemplatesDataService.getResponseTypes().then (responseTypes) =>
      @responseTypes = _(responseTypes).filter (resType) => @excludedResponseTypes.indexOf(resType.text) == -1
    @tinymceOptions =
      init_instance_callback: (editor) =>
        @tinymceEditor = editor
        editor.on 'paste', (e) =>
          @tinymceEditor.insertContent('')
      skin_url: '/assets/stylesheets/tinymce/skins/tinymce-dv'
      browser_spellcheck: true
      placeholder: @$tinymceMentionsPlaceholderText
      toolbar: false
      menubar: false
      statusbar: false
      content_css : 'assets/stylesheets/tiny_mce_custom.css'
      forced_root_block : ""

    if @template_params.source and @template_params.source == "InformationRequestFlow"
      @isDiligenceCreation = true
    if @source
      if @source == 'WP'
        @isWordParser = true
      if @source == 'QA'
        @isQAflow = true
    for section in @finalData.sections
      for subSection in section.subSections
        for question in subSection.questions
          if question.text
            question.text = question.text.trim()
          if question.responseHTML and @isQAflow
            question.responseHTML = @sanitizeHTML(question.responseHTML)

  setActiveView: (view) =>
    @activeView = view

  getHeaderText: =>
    text = "Create template from selection"
    if @isDiligenceCreation
      text = "Create project from selection"
    else if @isQAflow
      text = "Import Q/A Library Content from selection"
    text
  #
  # filterDataByView: (view) =>
  #   ogResCopy = @originalResponse
  #   @responseFromQa = _(@responseFromQa).pick('Document_id', 'entity_id', 'entity_type', 'name')
  #   @responseFromQa.original = {sections: []}
  #   @responseFromQa.existing = {sections: []}
  #   if view == "duplicate"
  #     for section in ogResCopy.sections
  #       for subSection in section.subSections
  #         subSection.questions = _(subSection.questions).filter (entry) => entry.is_duplicate
  #         if subSection.questions.length
  #           for ques in subSection.questions
  #             ques.is_selected = false
  #           @responseFromQa.existing.sections.push section
  #   else
  #     for section in ogResCopy.sections
  #       for subSection in section.subSections
  #         subSection.questions = _(subSection.questions).filter (entry) => !entry.is_duplicate
  #         if subSection.questions.length
  #           @originalContentFound = true
  #           @responseFromQa.original.sections.push section

  getTotal: =>
    total = 0
    array = @finalData.sections
    if @documentHasDuplicates and (@responseFromQa.original.sections and @responseFromQa.original.sections.length)
      array = @responseFromQa.original.sections
      if @activeView == "duplicate" and (@responseFromQa.existing.sections and @responseFromQa.existing.sections.length)
        array = @responseFromQa.existing.sections
    for section in array
      for subSection in section.subSections
        for question in subSection.questions
          if question.is_selected
            total += 1
    total

  sanitizeHTML: (html) =>
    html = new tinymce.html.Serializer().serialize(new tinymce.html.DomParser().parse(html))
    html

  getCount: (section) =>
    count = 0
    if @documentHasDuplicates
      for subSection in section.subSections
        for question in subSection.questions
            count += 1
    else
      for subSection in section.subSections
        for question in subSection.questions
          if question.is_selected
            count += 1
    count

  changeResponseType: (type, question)=>
    question.responseType = type.text
    question.responseTypeDesc = type.description
    question.responseTypeInt = type.id

  filterProducts: (query) ->
    return @funds unless query
    regex = new RegExp(query, 'i')
    _(@funds).filter((fund) -> regex.test(fund.name))

  updateRequestandRedirect: (response)=>
    if @request and @request.id
      @request.duediligence_id = response.id
      @DueDiligenceDataservice.saveRequest(@request).then (res) =>
        @successHandler(response)
    else
      @successHandler(response)

  successHandler: (response)=>
    @toaster.pop 'success', 'Your project is successfully created'
    @$uibModalInstance.dismiss response
    @$state.go 'app.diligence.project.questionnaire', {diligenceId: response.id}

  createDiligence: (request, params, pageUrl) =>
    @request = request
    @RestangularHeaderService.RestangularWithHeader(pageUrl).all('v2/diligences').post(params).then((response) =>
      @updateRequestandRedirect(response)
    ).finally =>
        @loading = false

  saveAndRedirectToTemplate: (response)=>
    params = @dd_params.apiParams
    params.template_id = response.template_id
    params.is_active = false
    @Restangular.one('requesttrackers').customPUT(params).then (res) =>
      @$state.go 'app.diligence.template.categories',
        templateId: response.template_id
        add: true
        request: @requestTrackerParams.id

  valildateQuestionSelection: (question, subSection) =>
    sub_section = angular.copy subSection
    selectedQuestions = _(sub_section.questions).filter (entry) => entry.is_selected
    if !selectedQuestions.length && !@isQAflow
      question.is_selected = true
      @toaster.pop 'error', 'Atleast one question is required'
    else if (@isQAflow && @activeView == "original") && !selectedQuestions.length
      question.is_selected = true
      @toaster.pop 'error', 'Atleast one question is required'

  getOriginalQaParams: =>
    ogResCopy = angular.copy @originalResponse
    resFromQACopy = angular.copy @responseFromQa
    params = _(ogResCopy).pick('Document_id', 'entity_id', 'entity_type', 'name')
    params.sections = []
    for section in resFromQACopy.original.sections
      for subSection in section.subSections
        subSection.questions = _(subSection.questions).filter (entry) => entry.is_selected
        if subSection.questions.length
          for ques in subSection.questions
            ques.override = true
          params.sections.push section
    for section in resFromQACopy.existing.sections
      for subSection in section.subSections
        subSection.questions = _(subSection.questions).filter (entry) => entry.is_selected
        if subSection.questions.length
          for ques in subSection.questions
            ques.override = true
          params.sections.push section
    params


  getSubmitText: =>
    text = "Create Template"
    if @isDiligenceCreation
      text = "Create Project"
    else if @isQAflow
      text = "Import Q/A Content"
    text

  loadCompareScreen: =>
    ogResCopy = angular.copy @originalResponse
    @responseFromQa = _(ogResCopy).pick('Document_id', 'entity_id', 'entity_type', 'name')
    @responseFromQa.original = {sections: []}
    @responseFromQa.existing = {sections: []}
    for section in ogResCopy.sections
      newSection = angular.copy section
      newSection.subSections = []
      for subSection in section.subSections
        subSection.questions = _(subSection.questions).filter (entry) => !entry.is_duplicate
        if subSection.questions.length
          @originalContentFound = true
          newSection.subSections.push subSection
      if newSection.subSections.length
        @responseFromQa.original.sections.push newSection

    ogResCopyForExisting = angular.copy @originalResponse
    for section in ogResCopyForExisting.sections
      newSection = angular.copy section
      newSection.subSections = []
      for subSection in section.subSections
        subSection.questions = _(subSection.questions).filter (entry) => entry.is_duplicate
        if subSection.questions.length
          newSection.subSections.push subSection
          for ques in subSection.questions
            ques.is_selected = false
      if newSection.subSections.length
        @responseFromQa.existing.sections.push newSection
    return

  save: =>
    if !@finalData.name || @finalData.name.length < 2
      @toaster.pop 'error', 'Please enter a template name'
      return
    finalParams = JSON.parse(JSON.stringify(@finalData))
    for section in finalParams.sections
      for subSection in section.subSections
        subSection.questions = _(subSection.questions).filter (entry) => entry.is_selected
    finalParams.type = @template_params.type
    parserType = "Excel"
    if @isWordParser
      parserType = 'Word'
      finalParams.parserType = "Word"
    endpoint = "/excel_parser/create_template?parserType=#{parserType}"
    if @isQAflow
      if @documentHasDuplicates
        finalParams = @getOriginalQaParams()
        if finalParams.sections.length == 0
          @toaster.pop 'error', 'Please select atleast one question'
          return
      endpoint = "/service/excel_services/onboarding_word_qa_upload"
      finalParams.entity_id = @template_params.selected_entity_id
      finalParams.entity_type = @template_params.selected_entity_type
      if @template_params.responseDateStamp
        for section in finalParams.sections
          for subSection in section.subSections
            subSection.questions = _(subSection.questions).map (entry) => 
              entry.responseTimeStamp = @template_params.responseDateStamp
              entry      
    else
      teamPermissions = @TemplatesDataService.getPermissionsParams()
      if teamPermissions.teams and teamPermissions.teams.length > 0
        finalParams.permissions = []
        _(teamPermissions.teams).each (team)=>
            if team.team and team.access
              finalParams.permissions.push {
                assigned_to_entity_type: 'Team'
                assigned_to_entity_id: team.team
                access_level: team.access
                entity_type: @keywordConstants.Template
              }
    @loading = true
    @$http.post(@baseUrl + endpoint, finalParams).then ((response) =>
      if @isDiligenceCreation
        @dd_params.apiParams.template_id = response.data.template_id
        # entity_type = 'Fund'
        # entity_id = @dd_params.apiParams.entity_id
        # if @dd_params.apiParams.is_firm_dd
        #   entity_type = 'Firm'
        #   entity_id = @current_firm.id
        params =
          'diligence_type': @dd_params.apiParams.duediligence_type
          'entities': [{'id':@dd_params.apiParams.entity_id,'entity_type': @dd_params.apiParams.entity_type,'template_id': @dd_params.apiParams.template_id}]
          'name': @dd_params.apiParams.name
          'due_at' : @$filter('date')(@dd_params.apiParams.due_at, 'MM-dd-yyyy')
          'as_of_date' : @$filter('date')(@dd_params.apiParams.as_of_date, 'MM-dd-yyyy')
          'is_internal': true
        if @dd_params.apiParams.investor_id
          params.investor_id = @dd_params.apiParams.investor_id
        @TemplatesDataService.setDiligenceParams({})
        @createDiligence(@dd_params.apiParams, params, @dd_params.pageUrl)
      else if @isQAflow
        if response.data.has_error
          @documentHasDuplicates = true
          @originalResponse = response.data
          @loading = false
          @loadCompareScreen()
          @setActiveView(@activeView)
          return
        else
          message = 'Your content upload is in-progress and may take up to 5 minutes to add the finishing touch. You will receive an email once the content is uploaded.'
          @toaster.pop 'success', '', message, 10000
          @$timeout =>
            @$state.go('app.content.questions')
      else
        @$state.go("app.diligence.template.preview",{templateId: response.data.template_id})
      @close()
    ), (error) =>
      @loading = false
