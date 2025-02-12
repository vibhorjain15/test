class TemplateQuestionBuilderController extends BaseController
  @register 'TemplateQuestionBuilderController'

  @inject '$attrs', 'TemplatesDataService', '$scope', 'BaseDataService',
          '$timeout', 'Restangular', '$filter', 'DueDiligenceDataservice',
          '$q','toaster','$state','SweetAlert','ERROR_CODES', '$http', 'baseUrl','Utils','DocumentsService', 'FILTER_TERNARY_OPERATORS', 'FILTER_TYPES','ModalFactory',
          '$tinymceMentionsPlaceholderText', '$tinymceToolbarFull', '$tinymcePlugins', 'RestangularHeaderService','ImageDataService','$tinymceStatusbar','$tinymceToolbarFull', 'dvTextLimits'

  initialize: ->
    @questions = []
    @useSingleQuestionMode = false
    @excludedResponseTypes = ["Grid", "CheckBox" , "Dropdown", "DynamicGrid"]
    @gridTypeResponses = ['DynamicGrid', 'Grid']
    @readonly_title = angular.isDefined(@$attrs.readonlyTitle)
    @single_question_mode = angular.isDefined(@$attrs.singleQuestionMode)
    if @single_question_mode
      @useSingleQuestionMode = true
    @hide_panel_header = angular.isDefined(@$attrs.hidePanelHeader)
    @edit_multiple_questions = angular.isDefined(@$attrs.editMultipleQuestions)
    @newQuestions = []
    @loading = true
    @global_ternary_operator = @FILTER_TERNARY_OPERATORS.AND

    promises = []
    promises.push @Restangular.all('firm_preferences').customGET().then (response) =>
      @default_response_word_limit = response.default_response_word_limit

    @$q.all(promises).then (response)=>
      @oldQuestionsList = []
      @allFilterOptions = []
      @allSearchFilterOptions = []
      @allSortFilterOptions = []
      @search_criterias = []
      @selection_list = []
      @filters_data_loaded = false
      @showFilters = false
      @showAddNewQuestion = false
      @filterApplied = false
      @processing_data = true
      @filters = {'name': ''}
      @frequestlyUsedFilterValue = 'not-selected'
      @mostAnsweredFilterValue = true
      @currentSortFilterSelected = 'ma-true'

      if @$attrs.questionParams
        @question_params = @$scope.$parent.$eval(@$attrs.questionParams)
      else
        if !(angular.isDefined(@$attrs.allowRules))
          @getAllFilterOptions()


      if angular.isDefined(@$attrs.allowRules)
        @allowRules = true
        @parentQuestion = @$scope.$parent.$eval @$attrs.parentQuestion
        parentQuestionText = if @parentQuestion.attributes? then @parentQuestion.attributes.text else @parentQuestion.text
        @title = "Add a Conditional/Nested Question under \"#{parentQuestionText}\""
        @parentQuestionResponseType = if @parentQuestion.attributes? then @parentQuestion.attributes.responseType else @parentQuestion.responseType
        @loadParentQuestionOptions(@parentQuestion.id) if @parentQuestionResponseType is 'Dropdown'
      else
        @title = 'Add a new Question'

      @TemplatesDataService.getResponseTypes().then (responseTypes) =>
        if @single_question_mode && @question_params.has_response
          currentResponseType = @question_params.responseType
          switch currentResponseType
            when 'Boolean', 'BooleanPlus', 'NoPlus'
              response_types_to_allow = ['Boolean', 'BooleanPlus', 'NoPlus']

            when 'TextEmail'
              response_types_to_allow = ['TextEmail', 'TextMultiLine', 'Text']

            when 'Text'
              response_types_to_allow = ['TextMultiLine', 'Text']

            when 'Dropdown'
              response_types_to_allow = ['Dropdown', 'CheckBox']

            when 'Integer','Numeric'
              response_types_to_allow = ['Integer', 'Numeric']

            else
              response_types_to_allow = [currentResponseType]

          if response_types_to_allow
            responseTypesFiltered = _(responseTypes).filter (responseType) ->
              responseType.text in response_types_to_allow

          if responseTypesFiltered
            @responseTypes = responseTypesFiltered
          else
            @responseTypes = responseTypes
        else
          @responseTypes = responseTypes


        @initializeBulkQuestions()

        @initializeNewQuestion().then =>
          @loading = false

        @initRuleVariables() if @allowRules

    @initTinyMc()


  initTinyMc: =>
    @tinymceOptions =
      skin_url: '/assets/stylesheets/tinymce/skins/tinymce-dv'
      browser_spellcheck: true
      height: 180
      plugins: @$tinymcePlugins
      custom_undo_redo_levels: 10
      toolbar: @$tinymceToolbarFull
      toolbar_mode: 'wrap'
      menubar: false
      statusbar: @$tinymceStatusbar
      branding: false
      resize: false
      elementpath: false
      image_dimensions: false
      forced_root_block : ""
      content_css : 'assets/stylesheets/tiny_mce_custom.css'
      table_toolbar: ""
      render: (editor) =>
        @$timeout => #since this comes from a event handler in tinymce
          @ModalFactory.invokeModal 'questionnaire_upload_image',
            resolve:
              editor: -> editor

    @tinymceOptions


  initializeBulkQuestions: =>
    @newQuestions = []
    @selectedResponseTypeForBulk = _(@responseTypes).findWhere({text: 'TextMultiLine'})

  modifyDirectiveData: (array) ->
    modifiedArray = []
    placeholderRow =
      text: "Row 1"
      type: "text"
      type_options: {type: "text"}
    placeholderColumn =
      text: "Column 1"
      type: "text"
      type_options: {type: "text"}
    modifiedArray = []
    _(array).each (question) =>
      obj = {}
      obj.rows = []
      obj.columns = []
      obj.options = []
      obj.text = question.text
      obj.responseType = @selectedResponseTypeForBulk
      if !obj.response_word_limit && @default_response_word_limit
        if obj.responseType.id == 1 || obj.responseType.id == 5
            obj.response_word_limit = @default_response_word_limit
      if @selectedResponseTypeForBulk.text == "Grid"
        obj.rows.push placeholderRow
        obj.columns.push placeholderColumn
      if @selectedResponseTypeForBulk.text == "DynamicGrid"
        obj.dynamic_element = "Row"
        obj.columns.push placeholderColumn
      modifiedArray.push obj
    modifiedArray


  responseTypeChanged: (type) ->
    if type.text in @excludedResponseTypes
      @useSingleQuestionMode = true
      @initializeBulkQuestions()
      @initializeNewQuestion(type.text)

  addBulkQuestions: ->
    newArray = @modifyDirectiveData(@newQuestions)
    @questions = @questions.concat newArray
    if @$attrs.onAdd
      @$scope.$parent.$eval @$attrs.onAdd, {questions: @questions}
    @initializeBulkQuestions()


  initRuleVariables: ->
    responseType = @parentQuestionResponseType
    @boolean_value_options = [
      {label: 'Yes', value: true},
      {label: 'No', value: false}
    ]

    @BaseDataService.getOperators().then (operators) =>
      @operators_copy = [].slice.call(operators)
      @setOperatorsForResponseType(responseType)

  setOperatorsForResponseType: (responseType) ->
    switch responseType
      when 'Numeric', 'Integer', 'Percentage', 'TextPhone', 'Identifier'
        operators = @operators_copy
      else
        operators = _(@operators_copy).filter (operator) ->
          operator.value in ['eq', 'noteq']

    @question.rule.operator = operators[0]
    @operators = operators

  initializeNewQuestion: (type) =>
    deferred = @$q.defer()
    responseTypeLocalVar = null
    if type
      responseTypeLocalVar = _(@responseTypes).findWhere({text: type})
    @resettingDefaultResponsesState = true
    @question_form.$setPristine()
    @question_form.$setUntouched()
    @question =
      responseType: if responseTypeLocalVar then responseTypeLocalVar else @responseTypes[15]
      rows: []
      columns: []
      options: []
      dynamic_element: null
      attachmentUploadEnabled: false

    if @question_params
      @question.id = @question_params.id
      @question.text = @question_params.text
      @question.hint_text = @question_params.hint_text
      @question.is_mandatory = @question_params.is_mandatory
      @question.sectionID = @question_params.sectionID
      if @question_params.responseType in ["TextMultiLine", "Text"]
        @question.response_word_limit = @question_params.response_word_limit

      @initQuestionParams(@question, @question_params).then =>
        deferred.resolve()
    else
      @question.options = []
      if @question.responseType.id == 1 || @question.responseType.id == 5
        @question.response_word_limit = @default_response_word_limit
      deferred.resolve()

    if @allowRules
      @question.rule = {}

    @question_form.$setPristine()
    @question_form.$setUntouched()

    @$timeout =>
      @question_form.$setPristine()
      @question_form.$setUntouched()
      @resettingDefaultResponsesState = false
      deferred.promise
    , 500


  initQuestionParams: (question, question_params) ->
    deferred = @$q.defer()

    unless question_params.id?
      deferred.resolve()

      return deferred.promise

    responseType = question_params.responseType

    if angular.isString(responseType)
      question.responseType = _(@responseTypes).findWhere(
        text: responseType
      )
      question.grid_id = question_params.grid_id
      question.grid_version = question_params.grid_version
      question.dropdown_id = question_params.dropdown_id
      question.dropdown_version = question_params.dropdown_version

    if responseType in ['Dropdown', 'CheckBox']
      @getOptions(question_params.id).then (response) =>
        options = []

        _(response).each (option) ->
          options.push({text: option.dropdown_option_text,id: option.dropdown_option_id, group_id: option.dropdown_value_groupid, is_active: option.is_active, order: option.order})

        ###delete question.options###

        question.options = options
        question.oldOptions = angular.copy options
        deferred.resolve()

    else if responseType is 'Grid' or responseType is 'DynamicGrid'
      @getGridRowsAndColumns(question_params.grid_id, question_params.grid_version).then (response) =>
        rows = _(response.rows_columns).where(elementType: 'Row')
        columns = _(response.rows_columns).where(elementType: 'Column')
        @question.dynamic_element = response.dynamic_element
        @question.formulas_json = response.formulas_json
        @question.actualRows = []
        @question.actualColumns = []

        @question.rows.length = 0
        @question.columns.length = 0

        _(rows).each (row) =>
          @question.rows.push(text: row.name, id: row.id, group_id: row.group_id)
          @question.actualRows.push(text: row.name, id: row.id, group_id: row.group_id)

        _(columns).each (column) =>
          @question.columns.push(text: column.name, id: column.id, group_id: column.group_id, type: column.type, type_options: column.type_options)
          @question.actualColumns.push(text: column.name, id: column.id, group_id: column.group_id, type: column.type, type_options: column.type_options)

        deferred.resolve()
    else if responseType is 'Attachment'
      @removeDocumentUrl(@question)
      if @question.attachmentHtml
        @question.attachmentUploadEnabled = true
        attributeValue = angular.element(@question.attachmentHtml).attr('data-ng-click')
        #get the href string from the attribute value
        href = attributeValue.match(/'([^\']+)'/)[1]
        @question.attachmentHref = href
        filename  = @Utils.getQueryParams('file_name',href)
        @question.filename = decodeURIComponent((filename + '').replace(/\+/g, '%20'))
      deferred.resolve()
    else
      deferred.resolve()

    deferred.promise

  getGridRowsAndColumns: (id, version) ->
    @DueDiligenceDataservice.getGridData(id, version)

  getOptions: (questionId) ->
    @Restangular.one('questions', questionId).all('options').getList()

  addQuestion: ->
    if @allowRules
      @updateDisplayValue(@question)

    @attachDocumentUrl(@question)

    @questions.push(@question)
    if @$attrs.onAdd
      @$scope.$parent.$eval @$attrs.onAdd, {questions: @questions}

    @initializeNewQuestion()

  attachDocumentUrl: (question)=>
    if question.responseType.text == 'Attachment' and question.attachmentHtml and question.text.indexOf('<separator>') == -1 and question.attachmentUploadEnabled
      question.text = question.text + "<separator> "+ question.attachmentHtml

  removeDocumentUrl: (question)=>
    if question.responseType.text == 'Attachment' and question.text.indexOf('<separator>') > -1
      [question.text,question.attachmentHtml] = question.text.split('<separator> ')

  downloadAttachment: (question)=>
    if question.attachmentHref
      @DocumentsService.downloadAttachment(question.attachmentHref)

  updateDisplayValue: (question) ->
    value = question.rule.value

    switch @parentQuestionResponseType
      when 'Dropdown'
        display_value = _(@parentQuestionOptions).findWhere(id: value).value
      when 'Boolean', 'BooleanPlus', 'NoPlus'
        display_value = if value is true then 'Yes' else 'No'
      when 'Date'
        display_value = @formatDate(value)
      else
        display_value = value

    question.rule.display_value = display_value

  editQuestion: (question, index) ->
    @editingIndex = index
    @question = angular.copy question
    @removeDocumentUrl(@question)
    @useSingleQuestionMode = true
    @question.responseType = _(@responseTypes).find (response)=>
      response.id == @question.responseType.id
    @edit_mode = true

  saveQuestion: ->
    @edit_mode = false
    @attachDocumentUrl(@question)
    @questions[@editingIndex] = @question
    @initializeNewQuestion()

  cancelEdit: ->
    @edit_mode = false
    @initializeNewQuestion()

  attachmentUploaded: (question)=>
    uploaded = true
    if question.responseType.text is 'Attachment'
      if (question.attachmentUploadEnabled and question.attachmentHtml != undefined) or not question.attachmentUploadEnabled
        uploaded = true
      else
        uploaded = false
    else
      uploaded = true
    @toaster.pop 'error','','Please upload source file' if not uploaded
    uploaded

  addOrSaveQuestion: ->
    return unless @question_form.$valid and @attachmentUploaded(@question)
    @$scope.$broadcast 'adding_question' , true
    if @edit_mode then @saveQuestion() else @addQuestion()

  removeQuestion: (question,$index) ->
    @questions.splice $index, 1
    if @$attrs.onAdd
      @$scope.$parent.$eval @$attrs.onAdd, {questions: @questions}
    @getQuestionByText(question)

  processDropdownOptions: (question)=>
    if question.oldOptions and question.oldOptions.length > 0
      _(question.oldOptions).each (option)=>
        optionIndex = _(question.options).findIndex (opt)=>
          opt.id == option.id
        if optionIndex == -1 and (option.text.toLowerCase() != 'other' or (option.text.toLowerCase() is 'other' and not question.has_other_option))
          option.is_active = false
          question.options.push option
        if option.text.toLowerCase() is 'other' and question.has_other_option
          question.options.push option

  saveSingleQuestion: ->
    @question_form.$setSubmitted(true)
    return unless @attachmentUploaded(@question)
    questionObj = angular.copy @question
    if @question_form.$valid
      @attachDocumentUrl(questionObj)
      @saving_questions = true
      @saveGridsIfAny([questionObj]).then =>
        params = @getQuestionAttrs(questionObj)
        id = @question_params.id
        editing_question = id?

        if editing_question
          promise = @Restangular.one('questions', id).customPUT(params)
        else
          promise = @Restangular.all('questions').post(params)

        promise.then ((response) =>
          if editing_question
            _(@question_params).extend(response)

            response = @question_params

          if @$attrs.onSave
            @$scope.$parent.$eval @$attrs.onSave, {question: response}
          @saving_questions = false
        ),((error) =>
          @saving_questions = false
          if error.status == @ERROR_CODES.BAD_REQUEST
            @SweetAlert.error({
              title: error.data.message
              confirmButtonText: 'Refresh'
            }).then (isConfirm) =>
              if isConfirm.value and isConfirm.value == true
                if @$attrs.onError
                  @$scope.$parent.$eval @$attrs.onError
                @$state.go("app.diligence.template.preview",{templateId: @getTemplateId()})
          else if error.data != "" and error.data.message != ""
            @SweetAlert.error({
              title: error.data.message
              confirmButtonText: 'Okay'
            })
        )
      ,(error)=>
        @saving_questions = false
        if error.status == @ERROR_CODES.BAD_REQUEST
          @SweetAlert.error({
            title: error.data.message
            confirmButtonText: 'Refresh'
          }).then (isConfirm) =>
            if isConfirm.value and isConfirm.value == true
              if @$attrs.onError
                @$scope.$parent.$eval @$attrs.onError
              @$state.go("app.diligence.template.preview",{templateId: @getTemplateId()})
        else if error.data != "" and error.data.message != ""
          @SweetAlert.error({
            title: error.data.message
            confirmButtonText: 'Okay'
          })

  confirmOptionsChange: =>
    if @question_params and @question_params.responseType != @question.responseType.text and @question_params.nestingRuleIds.length > 0
      @SweetAlert.confirm({
        title: 'Are you sure you want to continue?'
        text: "All your nested questions will be removed."
        focusCancel: true
      }).then (isConfirm)=>
        @$timeout =>
          swal.close()
        @saveSingleQuestion() if isConfirm.value and isConfirm.value == true
    else
      @saveSingleQuestion()

  save: ->
    @$scope.$broadcast 'adding_question' , true
    if @single_question_mode
      return @confirmOptionsChange()
    questions = @questions
    @display_alert_to_add_atleast_one_question = false

    unless questions.length
      @display_alert_to_add_atleast_one_question = true
      return

    @saving_questions = true
    @saveGridsIfAny(questions).then =>
      params =
        filters: "and" : "question" : []
      for addedQuestion,index in questions
        if (!addedQuestion.hasOwnProperty('id') || !addedQuestion.id) && addedQuestion.id != 0
          questionsParam =
            question_id: index+1
            question_text: addedQuestion.text
            response_type: addedQuestion.responseType.id
          params.filters.and.question.push questionsParam
      params.filters.and['current_template_id'] = @getTemplateId()
      if params.filters.and.question.length > 0
        @Restangular.all('service/es_service/question_suggestions_new').post(params).then (es_response) =>
          if es_response.status == 200
            for questionKey of es_response.data
              questions[parseInt(questionKey)-1]['id'] = es_response.data[questionKey].question_id
          else
            console.log 'ES Down'
          if @allowRules
            promise = @saveQuestionsWithRules(questions)
          else
            promise = @saveQuestions(questions)
          promise.then ((response) =>
            if @$attrs.onSave
              @$scope.$parent.$eval @$attrs.onSave, {questions: response}
            @saving_questions = false
          ),((error) =>
            @saving_questions = false
            @$scope.$emit 'errorWhileSaving' , error
            if error.status == @ERROR_CODES.BAD_REQUEST
              @SweetAlert.error({
                title: error.data.message
                confirmButtonText: 'Refresh'
              }).then (isConfirm) =>
                if isConfirm.value and isConfirm.value == true
                  if @$attrs.onError
                    @$scope.$parent.$eval @$attrs.onError
                  @$state.go("app.diligence.template.preview",{templateId: @getTemplateId()})
            else if error.data != "" and error.data.message != ""
              @SweetAlert.error({
                title: error.data.message
                confirmButtonText: 'Okay'
              })
          )
      else
        if @allowRules
          promise = @saveQuestionsWithRules(questions)
        else
          promise = @saveQuestions(questions)
        promise.then ((response) =>
          if @$attrs.onSave
            @$scope.$parent.$eval @$attrs.onSave, {questions: response}
          @saving_questions = false
        ),((error) =>
          @saving_questions = false
          @$scope.$emit 'errorWhileSaving' , error
          if error.status == @ERROR_CODES.BAD_REQUEST
            @SweetAlert.error({
              title: error.data.message
              confirmButtonText: 'Refresh'
            }).then (isConfirm) =>
              if isConfirm.value and isConfirm.value == true
                if @$attrs.onError
                  @$scope.$parent.$eval @$attrs.onError
                @$state.go("app.diligence.template.preview",{templateId: @getTemplateId()})
          else if error.data != "" and error.data.message != ""
            @SweetAlert.error({
              title: error.data.message
              confirmButtonText: 'Okay'
            })
        )
    ,(error)=>
      @saving_questions = false
      @$scope.$emit 'errorWhileSaving' , error
      if error.status == @ERROR_CODES.BAD_REQUEST
        @SweetAlert.error({
          title: error.data.message
          confirmButtonText: 'Refresh'
        }).then (isConfirm) =>
          if isConfirm.value and isConfirm.value == true
            if @$attrs.onError
              @$scope.$parent.$eval @$attrs.onError
            @$state.go("app.diligence.template.preview",{templateId: @getTemplateId()})
      else if error.data != "" and error.data.message != ""
        @SweetAlert.error({
          title: error.data.message
          confirmButtonText: 'Okay'
        })

  getParentQuestionId: ->
    @$scope.$parent.$eval @$attrs.parentQuestionId

  getSubcategoryId: ->
    @$scope.$parent.$eval @$attrs.subCategoryId

  getTemplateId: ->
    @$scope.$parent.$eval @$attrs.templateId

  formatDate: (value) ->
    @$filter('date')(value, 'mediumDate')

  getStringifiedRuleValue: (value) ->
    return unless value?

    if _.isDate(value)
      @formatDate(value)
    else if value.toString?
      value.toString()
    else
      value

  getQuestionType: (ques) ->
    found = false
    if ques.responseType and ques.responseType.text in @gridTypeResponses and ques.columns.length >= 5
      found = true
    found

  saveQuestionsWithRules: (questions) ->
    questionID = @getParentQuestionId()
    subCategoryId = @getSubcategoryId()

    params = _(questions).map (question) =>
      attrs = @getQuestionAttrs(question)
      rule = question.rule
      rule_attrs =
        operatorID: rule.operator.id
        value: @getStringifiedRuleValue(rule.value)
        questionID: questionID

      attrs.nestingRules = [rule_attrs]

      attrs

    @Restangular.one('sections', subCategoryId).all('NestedQuestions').post(params).then ->
      {questionID: questionID}

  getQuestionAttrs: (question) ->
    if (question.responseType.id == 5 || question.responseType.id == 1) && question.hasOwnProperty('response_word_limit')
      attrs = _(question).pick('text', 'responseType', 'isPublic', 'grid_id', 'grid_version', 'is_mandatory', 'hint_text', 'sectionID', 'id', 'response_word_limit','dropdown_id','dropdown_version')
    else
      attrs = _(question).pick('text', 'responseType', 'isPublic', 'grid_id', 'grid_version', 'is_mandatory', 'hint_text', 'sectionID', 'id','dropdown_id','dropdown_version')
    attrs.id = attrs.id
    attrs.responseType = attrs.responseType.id

    attrs

  getGridParams: (question) ->
    params =
      template_id: @getTemplateId()
      dataType: 'Integer'
      dynamic_element: question.dynamic_element
      formulas_json: question.formulas_json
      id: question.grid_id
      version: question.grid_version
      question_id: question.id

    rows_columns = []

    if question.dynamic_element == null
      angular.forEach question.rows, (row, idx) ->
        rows_columns.push({
          id: row.id,
          group_id: row.group_id
          name: row.text,
          elementType: 'Row',
          order: idx + 1
        })

      angular.forEach question.columns, (column, idx) ->
        rows_columns.push({
          id: column.id,
          group_id: column.group_id
          name: column.text,
          elementType: 'Column',
          order: idx + 1,
          type: column.type,
          type_options: column.type_options
        })

    else if question.dynamic_element == 'Row'
      angular.forEach question.columns, (column, idx) ->
        rows_columns.push({
          id: column.id,
          group_id: column.group_id
          name: column.text,
          elementType: 'Column',
          order: idx + 1,
          type: column.type,
          type_options: column.type_options
        })

    else if question.dynamic_element == 'Column'
      angular.forEach question.rows, (row, idx) ->
        rows_columns.push({
          id: row.id,
          group_id: row.group_id
          name: row.text,
          elementType: 'Row',
          order: idx + 1
        })

    params.rows_columns = rows_columns

    params

  getDropdownParams: (question)=>
    params = {
      name: question.text
      id: question.dropdown_id
      version: question.dropdown_version
      options: []
      template_id: @getTemplateId()
      question_id: question.id
    }
    @processDropdownOptions(question)
    if question.options?.length
      params.options = _(question.options).map (option)=>
        newOption =
          dropdown_option_text: option.text
          dropdown_option_id: option.id
          dropdown_value_groupid: option.group_id
          order: option.order
          is_active: option.is_active
      if question.has_other_option
        if question.oldOptions
          #do this only if there are old options
          other_option = _(question.oldOptions).find (option) ->
            option.text.toLowerCase() is 'other'
        if !other_option or !question.oldOptions.length
          #if there are no other options already added in the options or if there are no old options
          params.options.push({dropdown_option_text:'Other', is_active: true})
    params

  saveGridsIfAny: (questions) ->
    promises = []
    templateId = @getTemplateId()

    angular.forEach questions, (question) =>
      if (question.responseType.text is 'Grid' or question.responseType.text is 'DynamicGrid') and @gridChanged(question)
        grid_params = @getGridParams(question)

        promise = @TemplatesDataService.createGrid(grid_params).then do (question) ->
          (response) ->
            question.grid_id = response.id
            question.grid_version = response.version

        promises.push(promise)

      else if question.responseType.text is 'Dropdown' or question.responseType.text is 'CheckBox'
        params = @getDropdownParams(question)
        promise = @TemplatesDataService.createDropdownOptions(params).then do (question) ->
          (response) ->
            question.dropdown_id = response.id
            question.dropdown_version = response.version

        promises.push(promise)

    @$q.all(promises)

  gridChanged: (question)=>
    gridChanged = false

    if @question_params and @question_params.responseType != question.responseType.text
      gridChanged = true
    else if question.actualRows and question.actualColumns
      if question.rows.length != question.actualRows.length or question.columns.length != question.actualColumns.length
        gridChanged = true
        gridChanged
      else
        _(question.rows).each (row,index)=>
          if row.text != question.actualRows[index].text
            gridChanged = true
            return gridChanged

        _(question.columns).each (column,index)=>
          if column.text != question.actualColumns[index].text or column.type != question.actualColumns[index].type or column.type_options != question.actualColumns[index].type_options
            gridChanged = true
            return gridChanged
    else
      gridChanged = true

    gridChanged

  saveQuestions: (questions) ->
    params = _(questions).map @getQuestionAttrs

    @TemplatesDataService.createQuestion(@getSubcategoryId(), params).then (response) =>
      {questions: response}

  cancel: ->
    @$scope.$parent.$eval @$attrs.onCancel

  loadParentQuestionOptions: (questionID) ->
    @DueDiligenceDataservice.getList(questionID).then (response) =>
      @parentQuestionOptions = _(response).map (option) ->
        {value: option.dropdown_option_text,id: option.dropdown_option_id, group_id: option.dropdown_value_groupid, is_active: option.is_active, order: option.order}

  revealAdvanceOptions: ->
    @adding_advance_options = true

  hideAdvanceOptions: ->
    @adding_advance_options = false

  addNewQuestion: ->
    @showAddNewQuestion = !@showAddNewQuestion

  getAllFilterOptions: ->
    params =
      filters: {
        "type" : "reuse"
      }
    @Restangular.all('service/es_service/question_filters').post(params).then (response) =>
      if response.status == 200
        @allFilterOptions = response.data
        for option in response.data
          if option.filter_function == 'search'
            @allSearchFilterOptions.push(option)
        for option in response.data
          if option.filter_function == 'sort'
            @allSortFilterOptions.push(option)
        @filters_data_loaded = true
        newCriteria = {}
        newCriteria = {criteria_obj:@allSearchFilterOptions[0]}
        @search_criterias.push(newCriteria)
        @searchByFilters()
      else
        @allFilterOptions = response.data
        @filters_data_loaded = true
        @searchByFilters()
        @toaster.pop 'error','Unexpected error occurred'



  addNewCriteria: ->
    @$timeout =>
      newCriteria = {}
      newCriteria = {criteria_obj: @allSearchFilterOptions[0]}
      @search_criterias.push(newCriteria)
    , 400

  toggleFiltersSection: ->
    @showFilters = !@showFilters

  removeCurrentFilter: (criteria, index) =>
    if index<@search_criterias.length == 1
      # @default_criteria_options.splice(index, 1)
      criteria.advance_filter_value = ''
    else
      @search_criterias.splice(index, 1)

  selectSortCriteriaFilter: () =>
    if @currentSortFilterSelected == 'ma-true'
      @mostAnsweredFilterValue = true
      @frequestlyUsedFilterValue = 'not-selected'
    else if @currentSortFilterSelected == 'ma-false'
      @mostAnsweredFilterValue = false
      @frequestlyUsedFilterValue = 'not-selected'
    else if @currentSortFilterSelected == 'fu-true'
      @frequestlyUsedFilterValue = true
      @mostAnsweredFilterValue = 'not-selected'
    else if @currentSortFilterSelected == 'fu-false'
      @frequestlyUsedFilterValue = false
      @mostAnsweredFilterValue = 'not-selected'
    else
      @frequestlyUsedFilterValue = 'not-selected'
      @mostAnsweredFilterValue = 'not-selected'
    @searchByFilters()


  setOptionsDefaultValue: (criteria,index) =>
    if criteria.condition
      criteria.condition = criteria.condition
    else
      criteria.condition = criteria.criteria_obj.search_type[0].value

  resetFilters: ->
    @global_ternary_operator = @FILTER_TERNARY_OPERATORS.AND
    @search_criterias = []
    @showFilters = false
    @custom_search_form.$setPristine()
    @custom_search_form.$setUntouched()
    @filters.name = ''
    @frequestlyUsedFilterValue = 'not-selected'
    @mostAnsweredFilterValue = 'not-selected'
    @addNewCriteria()
    @searchByFilters()

  searchByFilters: ()=>
    searchByFiltersData = []
    for filter,index in @search_criterias
      if filter
        if(filter.hasOwnProperty('condition') && filter.hasOwnProperty('advance_filter_value') && filter.condition != null && filter.advance_filter_value != null && filter.advance_filter_value != "" && filter.advance_filter_value != undefined)
          searchByFiltersData.push(filter)
    params =
      filters: "#{@global_ternary_operator}" : []
    for filter in searchByFiltersData
      filter_params =
        filter_name: filter.criteria_obj.filter_name,
        filter_type: filter.criteria_obj.filter_type,
        search_type: filter.condition,
        filter_value: filter.advance_filter_value
      params.filters[@global_ternary_operator].push(filter_params)
    @applyFiltersSearch(params)

  getAllOldQuestionsList: ->
    params =
      filters: "#{@global_ternary_operator}" : []
    @processing_data = true
    @Restangular.all('service/es_service/question_suggestions').post(params).then (response) =>
      if response.status == 200
        @oldQuestionsList = response.data
        @processing_data = false
      else
        @oldQuestionsList = response.data
        @processing_data = false
        @toaster.pop 'error','Unexpected error occurred'

  applyNameFilter: ->
    if @filters.name.length > 3 || @filters.name.length == 0
      @searchByFilters()

  addToSelection: (question) ->
    ids = _(@selection_list).pluck('question_id')
    unless _(ids).contains(question.question_id)
      question.is_selected = true
      @selection_list.push(question)
    @addOldQuestions(question)

  addOldQuestions: (question) =>
    questions = []
    questions.push(question)
    newArray = @modifyOldQuestionDirectiveData(questions)
    @questions = @questions.concat newArray
    if @$attrs.onAdd
      @$scope.$parent.$eval @$attrs.onAdd, {questions: @questions}
    @initializeBulkQuestions()

  selectALLQuestions: () ->
    selected_questions = []
    for question in @oldQuestionsList
      ids = _(@selection_list).pluck('question_id')
      unless _(ids).contains(question.question_id)
        question.is_selected = true
        selected_questions.push(question)
        @selection_list.push(question)
    newArray = @modifyOldQuestionDirectiveData(selected_questions)
    @questions = @questions.concat newArray
    if @$attrs.onAdd
      @$scope.$parent.$eval @$attrs.onAdd, {questions: @questions}
    @initializeBulkQuestions()

  removeALLQuestions: ->
    @selection_list = []
    @questions.length = 0
    @questions = []
    for question in @oldQuestionsList
      question.is_selected = false

  modifyOldQuestionDirectiveData: (array) ->
    modifiedArray = []
    promises = []
    placeholderRow =
      text: "Row 1"
      type: "text"
      type_options: {type: "text"}
    placeholderColumn =
      text: "Column 1"
      type: "text"
      type_options: {type: "text"}
    modifiedArray = []
    _(array).each (question) =>
      obj = {}
      obj.rows = []
      obj.columns = []
      obj.options = []
      obj.id = question.question_id
      obj.text = question.question_text
      obj.responseType = @getResponseTypeById(question.response_type)
      for option in question.options_values
        obj.options.push({text: option, type:'text', type_options:{type:'text'}, id: 0, is_active: true})
      if question.response_type == 4 || question.response_type == 20
        if question.hasOwnProperty('reference_grid_id') && question.reference_grid_id != null && question.reference_grid_id != undefined
          promise = @getGridRowsAndColumns(question.reference_grid_id, question.grid_version).then (response) =>
            rows = _(response.rows_columns).where(elementType: 'Row')
            columns = _(response.rows_columns).where(elementType: 'Column')
            obj.dynamic_element = response.dynamic_element

            obj.rows.length = 0
            obj.columns.length = 0

            _(rows).each (row) =>
              obj.rows.push(text: row.name)

            _(columns).each (column) =>
              obj.columns.push(text: column.name, type: column.type, type_options: column.type_options)
          promises.push promise
      if @selectedResponseTypeForBulk.text == "Grid"
        obj.rows.push placeholderRow
        obj.columns.push placeholderColumn
      if @selectedResponseTypeForBulk.text == "DynamicGrid"
        obj.dynamic_element = "Row"
        obj.columns.push placeholderColumn
      modifiedArray.push obj
    @$q.all(promises)
    modifiedArray

  getResponseTypeById:(id) =>
    response_type = {}
    for response in @responseTypes
      if response.id == id
        response_type = response
    response_type

  getQuestionByText: (question) =>
    new_question = question
    for org_question in @oldQuestionsList
      if question.text == org_question.question_text
         @removeFromSelection(org_question)

  removeFromSelection: (question) ->
    @handleDeselection([question])
    @selection_list.splice(@selection_list.indexOf(question), 1)
    question_to_remove = {}
    question_to_remove_index = null
    for selected_question,index in @questions
      if selected_question.text == question.question_text
        question_to_remove = selected_question
        question_to_remove_index = index
    if question_to_remove_index != null
      @removeQuestion(question_to_remove,question_to_remove_index)

  handleDeselection: (questions) ->
    _(questions).each (question) =>
      question_from_main_list = _(@oldQuestionsList).findWhere(question_id: question.question_id)

      question_from_main_list.is_selected = false if question_from_main_list?

    @select_all_entities = false

  applyFiltersSearch: (filter_params) =>
    if (filter_params.filters.hasOwnProperty('and') || filter_params.filters.hasOwnProperty('or')) && filter_params.filters[@global_ternary_operator].length == 0
      @filterApplied = false
    else
      @filterApplied = true
    if @filters.name
      nameFilterParams =
          filter_name: 'question_text',
          filter_type: 'str',
          search_type: 'contains',
          filter_value: @filters.name
      filter_params.filters[@global_ternary_operator].push(nameFilterParams)

    if @mostAnsweredFilterValue != 'not-selected'
      nameFilterParams =
          filter_name: 'response_count_sort',
          filter_type: 'bool',
          search_type: 'exact',
          filter_value: @mostAnsweredFilterValue
      filter_params.filters[@global_ternary_operator].push(nameFilterParams)

    if @frequestlyUsedFilterValue != 'not-selected'
      nameFilterParams =
          filter_name: 'template_count',
          filter_type: 'bool',
          search_type: 'exact',
          filter_value: @frequestlyUsedFilterValue
      filter_params.filters[@global_ternary_operator].push(nameFilterParams)
    templateFilterParams =
      filter_name: 'current_template_id',
      filter_type: 'str',
      search_type: 'exact',
      filter_value: @getTemplateId()
    filter_params.filters[@global_ternary_operator].push(templateFilterParams)
    @processing_data = true
    @Restangular.all('service/es_service/question_suggestions').post(filter_params).then (response) =>
      @oldQuestionsList = response.data
      for selected_question in @selection_list
        for question in @oldQuestionsList
         if question.question_id == selected_question.question_id
          question.is_selected = true
      @processing_data = false

  mostAnsweredFilterSelected: ->
    if @mostAnsweredFilterValue == true
      @mostAnsweredFilterValue = false
    else if @mostAnsweredFilterValue == false
      @mostAnsweredFilterValue = 'not-selected'
    else
      @mostAnsweredFilterValue = true
    @searchByFilters()

  frequestlyUsedFilterSelected: ->
    if @frequestlyUsedFilterValue == true
      @frequestlyUsedFilterValue = false
    else if @frequestlyUsedFilterValue == false
      @frequestlyUsedFilterValue = 'not-selected'
    else
      @frequestlyUsedFilterValue = true
    @searchByFilters()

  selectCriteria: (criteria, index) =>
    criteria.condition = criteria.criteria_obj.search_type[0].value
    if criteria.advance_filter_value
      criteria.advance_filter_value = ''

  clearAllFilters: () =>
    @search_criterias = []
    @addNewCriteria()

  showTemplatesNames: (templates) =>
    return templates.map((template) ->
      template.template_name
    ).join ', '

  showEditQuestionFAQ:=>
    @ModalFactory.invokeModal 'edit-question-faq'
