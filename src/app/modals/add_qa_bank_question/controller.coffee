class AddQABankQuestionController extends ModalController
  @register 'AddQABankQuestionController'

  @inject '$stateParams', 'toaster', 'FundDataservice', 'Restangular', 'BaseDataService', 'TemplatesDataService', 'Utils', '$http', 'baseUrl', '$timeout', '$scope','$tinymcePlugins','$tinymceToolbar1' , '$tinymceToolbar2','ModalFactory','source','entity_details','response','$q','keywordConstants','RestangularHeaderService','$tinymceStatusbar'

  initialize: ->
    @excludedResponseTypes = ['AumTable', 'aumTable', 'DynamicGrid', 'Grid', 'CheckBox', 'Dropdown', 'Bookends', 'ReturnTable', 'Attachment']
    @getAllResponseTypes()
    @subCategories = []
    @categories = []
    @editMode = true
    promises = []

    @response.template_id = @response.associated_template_id
    @response.parentsection_id = @response.parent_section_id
    @response.section_id = @response.child_section_id
    @response.entity_type = @response.associated_entity_type
    @response.entity_id = @response.associated_entity_id
    @response.entity_name = @response.entity
    @response.hint_text  = @response.question_help_text


    promises.push @getAssignedQuestionTags()
    promises.push @getAllTemplates()
    promises.push @getFunds()
    promises.push @getQuestionTags()
    promises.push @getSelectedTemplate(@response.template_id) if @response and @response.template_id

    @$q.all(promises).then =>
      try
        @initFromQuestionDetail()
      catch error
        console.log error
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
          text: @response.question_text.replace(/<\/?[^>]+(>|$)/g, "")
          responseType: @response.response_type
          response: {}
          hint_text: @response.hint_text
          tag_ids: angular.copy @assigned_tags
          response_text_copy: ''
        }
      ]
      child_section: child_section
    }

    response_value_types = @getResponseValueTypes(@response.response_type)
    @formData.questions[0].response_text_copy = @response.response_text_copy

    response_value_types = @getResponseValueTypes(@response.response_type)
    # @formData.questions[0].response = _(@response.response).pick(response_value_types)
    @formData.questions[0].response.id = @response.response_id
    @formData.questions[0].response['response_type'] = @response.response_type
    @formData.questions[0].response['textResponse'] = null
    
    if @response.response_type ==  'Date'
      @formData.questions[0].response['dateResponse'] = @Utils.getLocalDateTime(@response.response_text_copy).toDate()
    if @response.response_type ==  'Integer' || @response.response_type ==  'Percentage' || @response.response_type ==  'Numeric' || @response.response_type ==  'Identifier' || @response.response_type ==  'TextPhone'
      if @response.response_text_copy.toString().indexOf('.') == -1
        @formData.questions[0].response['numericResponseA'] = parseInt(@response.response_text_copy)
      else
        @formData.questions[0].response['numericResponseA'] = parseFloat(@response.response_text_copy)
    if @response.response_type ==  'Text'
      @formData.questions[0].response['textResponse'] = @response.response_text_copy
    if @response.response_type ==  'TextEmail'
      @formData.questions[0].response['textResponse'] = @response.response_text_copy
    if @response.response_type ==  'Boolean' || @response.response_type ==  'BooleanPlus' || @response.response_type ==  'NoPlus'
      if @response.response_text_copy == 'Yes'
        @formData.questions[0].response['booleanResponse'] = true
      else
        @formData.questions[0].response['booleanResponse'] = false
    if (@response.response_type ==  'BooleanPlus' && @response.booleanResponse == true) || (@response.response_type ==  'NoPlus' && @response.booleanResponse == false)
      @formData.questions[0].response['textResponse'] = @response.response_text_copy
    if @response.response_type ==  'TextMultiLine'
      @formData.questions[0].response['textResponse'] = @response.response_text_copy

    if (@response.response_type !=  'TextMultiLine' &&  @response.response_type !=  'Text' &&  @response.response_type !=  'TextEmail') && @response.comments.length > 0
      @formData.questions[0].response['textResponse'] = @response.comments[0].comment_text  
    
    # @formData.questions[0].response.id = @response.response_id

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

  getAssignedQuestionTags: =>
    @RestangularHeaderService.RestangularWithHeader(@pageUrl).all('tag_assignments').getList(entity_type: 'Question', entity_id: @response.question_id).then (response) =>
      @assigned_tags = response
      @sortAssignedTags()

  sortAssignedTags: () =>
    @assigned_tags = _(@assigned_tags).sortBy((tag) =>
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
          response_text_copy:''
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
          question.response_text_copy = moment(question.response_text_copy).format('MM-DD-YYYY')
        if question.tag_ids
          question['tagsList'] = question.tag_ids
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

      # if payload.questions[0].responseType == 'Date'
      #   payload.questions[0].response = {id: @response.response_id,response_type: payload.questions[0].responseType,dateResponse:@formData.questions[0].response_text_copy}
      # if payload.questions[0].responseType == 'Integer' || payload.questions[0].responseType == 'Percentage' || payload.questions[0].responseType == 'Numeric' || payload.questions[0].responseType == 'Identifier' || payload.questions[0].responseType == 'TextPhone'
      #   payload.questions[0].response = {id: @response.response_id,response_type: payload.questions[0].responseType,numericResponseA:@formData.questions[0].response_text_copy,textResponse: null}
      # if payload.questions[0].responseType == 'Text'
      #   payload.questions[0].response = {id: @response.response_id,response_type: payload.questions[0].responseType,textResponse:@formData.questions[0].response_text_copy}
      # if payload.questions[0].responseType == 'TextEmail'
      #   payload.questions[0].response = {id: @response.response_id,response_type: payload.questions[0].responseType,textResponse:@formData.questions[0].response_text_copy}
      # if payload.questions[0].responseType == 'Boolean' || payload.questions[0].responseType == 'BooleanPlus' || payload.questions[0].responseType == 'NoPlus'
      #   payload.questions[0].response = {id: @response.response_id,response_type: payload.questions[0].responseType,booleanResponse:@formData.questions[0].response_text_copy}
      # if (payload.questions[0].responseType == 'BooleanPlus' && question.response.booleanResponse == true) || (payload.questions[0].responseType == 'NoPlus' && question.response.booleanResponse == false)
      #   payload.questions[0].response = {id: @response.response_id,response_type: payload.questions[0].responseType,textResponse:@formData.questions[0].response_text_copy}
      # if payload.questions[0].responseType == 'TextMultiLine'
      #   payload.questions[0].response = {id: @response.response_id,response_type: payload.questions[0].responseType,textResponse:@formData.questions[0].response_text_copy}

      payload.questions[0].response.dateResponse = moment(payload.questions[0].response.dateResponse).format("MM-DD-YYYY")
      @RestangularHeaderService.RestangularWithHeader(pageUrl).one('templates',payload.template_id).customPUT(payload,'add_qa').then ((response) =>
        @toaster.pop 'success', '', 'Q & A updated successfully'
        payload['question_id'] = @response.question_id
        @$uibModalInstance.close payload
        @loading = false
        @loadingAddAnother = false
      ), (error) =>
        @loading = false
        @loadingAddAnother = false

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