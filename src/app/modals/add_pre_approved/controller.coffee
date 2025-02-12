class AddPreApprovedController extends ModalController
  @register 'AddPreApprovedController'

  @inject '$stateParams', 'toaster', 'FundDataservice', 'Restangular', 'BaseDataService', 'TemplatesDataService', 'Utils', '$http', 'baseUrl', '$timeout', '$scope','$tinymcePlugins','$tinymceToolbar1' , '$tinymceToolbar2','ModalFactory','source','entity_details','response','$q','assigned_tags','keywordConstants','RestangularHeaderService','$tinymceStatusbar'

  initialize: ->
    @excludedResponseTypes = ['aumTable', 'DynamicGrid', 'Grid', 'CheckBox', 'Dropdown', 'Bookends', 'ReturnTable', 'Attachment']
    @getAllResponseTypes()
    @subCategories = []
    @categories = []
    @editMode = false
    promises = []

    promises.push @getAllTemplates()
    promises.push @getFunds()
    promises.push @getQuestionTags()
    promises.push @getSelectedTemplate(@response.template_id) if @response and @response.template_id

    @$q.all(promises).then =>
      if @source and @source == 'questionnaire'
        @initFromQuestionnaire()
        @editMode = false
      else if @source and @source == 'question_detail'
        @initFromQuestionDetail()
        @editMode = true
      else
        @initDefault()
        @editMode = false
    @current_firm = @Utils.getCurrentFirm()

    @tinymceOptions =
      skin_url: '/assets/stylesheets/tinymce/skins/tinymce-dv'
      browser_spellcheck: true
      height: 180
      plugins: @$tinymcePlugins
      custom_undo_redo_levels: 10
      toolbar1: @$tinymceToolbar1
      toolbar2: @$tinymceToolbar2
      menubar: false
      statusbar: @$tinymceStatusbar
      branding: false
      resize: false
      elementpath: false
      image_dimensions: false
      forced_root_block : ""
      contextmenu: false
      content_css : 'assets/stylesheets/tiny_mce_custom.css'
      table_toolbar: ""
      render: (editor) =>
        @$timeout => #since this comes from a event handler in tinymce
          @ModalFactory.invokeModal 'questionnaire_upload_image',
            resolve:
              editor: -> editor

  initDefault: =>
    @entity_type = "Fund"
    @formData = {
      parent_section: null
      questions: [
        {
          response:{}
          responseType: "TextMultiLine"
        }
      ]
      child_section: null
    }

  initFromQuestionDetail: =>
    @entity_type = @response.entity_type
    parent_section = _(@categories).find (category)=>
      category.id == @response.parentsection_id

    @getSubCategories(parent_section.id)

    child_section = _(@subCategories).find (subcategory)=>
      subcategory.id == @response.section_id

    @formData = {
      template_id: @response.template_id
      associated_entities: [{id:@response.entity_id, name: @response.entity_name}]
      parent_section: parent_section
      questions: [
        {
          id: @response.question_id
          text: @response.question_text
          responseType: @response.response_type
          hint_text: @response.hint_text
          tag_ids: angular.copy @assigned_tags
        }
      ]
      child_section: child_section
    }

    response_value_types = @getResponseValueTypes(@response.response_type)
    @formData.questions[0].response = _(@response.response).pick(response_value_types)
    @formData.questions[0].response.id = @response.id
    
  initFromQuestionnaire: =>
    @entity_type = @entity_details.entity_type

    @formData = {
      associated_entities: [{id:@entity_details.entity_id, name: @entity_details.entity_name}]
      parent_section: null
      questions: [
        {
          text: @response.question.attributes.text
          response: _(@response.attributes).pick(@response.value_attrs)
          responseType: @response.responseType
          hint_text: @response.question.attributes.hint_text
          tag_ids: angular.copy @assigned_tags
        }
      ]
      child_section: null
    }

    #Should we open the help text text area if there is a help in the question?
    #Below code wont work because dom for the hint text is not initialised at this point
    # if @formData.questions[0].hint_text and @formData.questions[0].hint_text.length > 0
    #   @toggleAdditionalOptions(1)

  getSelectedTemplate: (id) ->
    @TemplatesDataService.getTemplate(id).then (template) =>
      @selectedTemplate = template
      if @selectedTemplate
        @getCategories(@selectedTemplate)

  getQuestionTags: =>
    @Restangular.all('tags').getList(Type: 'Question').then (response) =>
      @tags = response
      @sortTags()

  sortTags: () =>
    @tags = _(@tags).sortBy((tag) =>
      tag.name.toLowerCase()
    )


  filterTags: (query) ->
    return @tags unless query
    regex = new RegExp(query, 'i')
    _(@tags).filter((tag) -> regex.test(tag.name))

  getFunds: ->
    @FundDataservice.getFunds().then (response) =>
      @funds = response

  getAllTemplates: ->
    @TemplatesDataService.getTemplates(detail: false).then (response) =>
      @templates = response
      if @templates
        @filterbyQATemplate()

  setEntityType: (entity_type) ->
    @entity_type = entity_type if not @editMode

  getAllResponseTypes: ->
    @TemplatesDataService.getResponseTypes().then (responseTypes) =>
      @responseTypes = _(responseTypes).filter((responseType)=>
        responseType.text not in @excludedResponseTypes
      )

  getCategories: (template) ->
    # @formData.parent_section = null
    # @formData.child_section = null
    @categories = _(template.templateInfo.sections).filter((category)=>
        category.isParent
    )
    # if @categories.length == 1
    #   @formData.parent_section = @categories[0]
    #   @getSubCategories(@categories[0].id)

  filterProducts: (query) ->
    return @funds unless query
    regex = new RegExp(query, 'i')
    _(@funds).filter((fund) -> regex.test(fund.name))

  getSubCategories: (parentId) ->
    @subCategories = _(@selectedTemplate.templateInfo.sections).filter((category)=>
        category.parentID == parentId
    )
    # if @subCategories.length == 1
    #   @formData.child_section = @subCategories[0]

    if @subCategories.length == 0
      @subCategories.push {
        name: ''
      }

  filterbyQATemplate: =>
    @templates = _(@templates).filter((template)=>
        template.type == "dd_profile"
    )

  filterbyStandardTemplate: =>
    @templates = _(@templates).filter((template)=>
        template.type != "dd_profile"
    )

  toggleAdditionalOptions: (idx) =>
    jQuery('#optionsDiv_' + idx).slideToggle()


  resetToAddAnother: (payload) ->
    @$timeout =>
      @formData.questions =  [
        {
          response:{}
          responseType: "TextMultiLine"
        }
      ]
      #if the selected parent section is new then find the index of this section in the categories and assign the object returned
      #by the api to that index. Also assign the parentsection to this object.
      if @formData.parent_section.new
        index = _(@categories).indexOf(@formData.parent_section)
        @categories[index] = payload.parent_section if index > -1
        @formData.parent_section = payload.parent_section

      #if the selected child section is new then find the index of this section in the categories and assign the object returned
      #by the api to that index. Also assign the childsection to this object.
      if @formData.child_section.new
        index = _(@subCategories).indexOf(@formData.child_section)
        @subCategories[index] = payload.child_section if index > -1
        @formData.child_section = payload.child_section

  createOption: (term) =>
    @$scope.$apply =>
      @formData.child_section = null
      @subCategories = []
      @categories.push {name: term, new: true}
      @formData.parent_section = @categories[@categories.length - 1]
      @subCategories.push {name: ''}

  createSubcategory: (term) =>
    @$scope.$apply =>
      @subCategories.push {name: term, new: true}
      @formData.child_section = @subCategories[@subCategories.length - 1]

  generatePageUrl: =>
    pageUrl = ""
    if @entity_type.toLowerCase() == @keywordConstants.Firm.toLowerCase()
      pageUrl = "app/firms/#{@current_firm.id}/add_qa"
    else if @entity_type.toLowerCase() == @keywordConstants.Product.toLowerCase()
      _(@formData.associated_entities).each (entity,index)=>
        if not entity.parentFirm
          parentFirm = _(@funds).find((fund)=>
            fund.id == entity.id
          ).parentFirm
          firmId = parentFirm.id
        else
          firmId = entity.parentFirm.id
        pageUrl += "app/firms/#{firmId}/funds/#{entity.id}/add_qa"
        pageUrl += "," if index != @formData.associated_entities.length - 1 
    pageUrl


  submit: (addAnother) ->
    #submit the form, for default submit button it submits the form and validation starts. but for submit and add another
    #it doesnt submit the form and validation doesnt start. This is why we manually submit the form everytime
    @QaForm.$setSubmitted(true)
    if @QaForm.$valid
      if @entity_type == "Fund" and (!@formData.associated_entities || !@formData.associated_entities.length)
        @toaster.pop 'error', '', 'Please select a product'
        return
      if addAnother
        @loadingAddAnother = true
      else
        @loading = true

      payload = angular.copy @formData
      payload.entity_type = @entity_type

      _(payload.questions).each (question)=>
        if question.responseType == 'Date'
          question.response.dateResponse = moment(question.response.dateResponse).format('MM-DD-YYYY')
        if question.tag_ids
          question.tag_ids = _(question.tag_ids).pluck('id')

      # If the selected subcategory is not new, get id of the subcategory
      if !payload.child_section.new
         payload.child_section = _(payload.child_section).pick('name','id')
      # If the selected category is not new, get id of the category
      if !payload.parent_section.new
        payload.parent_section = _(payload.parent_section).pick('name','id')

      # **************
      if @entity_type == 'Fund'
        payload.associated_entities = _(@formData.associated_entities).pluck('id')
      else
        payload.associated_entities = [@current_firm.id]

      pageUrl = @generatePageUrl()

      if @editMode
        @RestangularHeaderService.RestangularWithHeader(pageUrl).one('templates',payload.template_id).customPUT(payload,'add_qa').then ((response) =>
          @toaster.pop 'success', '', 'Q & A updated successfully'
          @$uibModalInstance.close response
          @loading = false
          @loadingAddAnother = false
        ), (error) =>
          @loading = false
          @loadingAddAnother = false
      else
        @RestangularHeaderService.RestangularWithHeader(pageUrl).one('templates',payload.template_id).customPOST(payload,'add_qa').then ((response) =>
          @toaster.pop 'success', '', 'Q & A added successfully'
          if addAnother
            @resetToAddAnother(response)
          else
            @$uibModalInstance.close response

          @loading = false
          @loadingAddAnother = false
        ), (error) =>
          @loading = false
          @loadingAddAnother = false

  clearAnswerTextForAll: (question)=>
    if question.response.textResponse
      question.response.textResponse = ''

  getResponseValueTypes: (responseType)=>
    switch responseType
      when 'Date'
        attrs = ['dateResponse', 'textResponse','response_type']
      when 'Boolean'
        attrs = ['booleanResponse', 'textResponse',  'response_type']
      when 'Text', 'TextMultiLine', 'TextEmail'
        attrs = ['textResponse', 'textResponse', 'response_type']
      when 'Numeric', 'TextPhone', 'Integer', 'Percentage', 'Identifier'
        attrs = ['numericResponseA', 'textResponse',  'response_type']
      when 'Dropdown', 'CheckBox'
        attrs = ['listValueID', 'textResponse',  'response_type']
      when 'BooleanPlus', 'NoPlus'
        attrs = ['booleanResponse', 'textResponse',  'response_type']
      when 'Bookends'
        attrs = ['numericResponseA', 'numericResponseB', 'textResponse',  'response_type']
      when 'Grid','DynamicGrid'
        attrs = ['grid_responses', 'textResponse',  'response_type']
      when 'Attachment'
        attrs = ['attachmentIds', 'textResponse',  'response_type']
      when 'ReturnTable'
        attrs = ['returnTable_id', 'textResponse',  'response_type']
      when 'aumTable'
        attrs = ['aumTable_id', 'textResponse',  'response_type']
    attrs