class OfflineDDQuestionBuilderController extends BaseController
  @register 'OfflineDDQuestionBuilderController'

  @inject '$attrs', 'TemplatesDataService', '$scope', 'BaseDataService',
          '$timeout', 'Restangular', '$filter', 'DueDiligenceDataservice',
          '$q','ModalFactory','$tinymceMentionsPlaceholderText', '$tinymceToolbarFull', '$tinymcePlugins', 'RestangularHeaderService','ImageDataService','$tinymceStatusbar','$tinymceToolbar1','$tinymceToolbar2', 'dvTextLimits'

  initialize: ->
    @questions = []

    @question_params = @$scope.$parent.$eval(@$attrs.questionParams)

    @title = 'Add a new Question'
    response_types_to_allow = ['Text', 'Grid', 'TextEmail', 'TextMultiLine', 'TextPhone','Boolean', 'BooleanPlus', 'NoPlus']

    @loading = true
    @TemplatesDataService.getResponseTypes().then (responseTypes) =>

      responseTypesFiltered = _(responseTypes).filter (responseType) ->
        responseType.text in response_types_to_allow

      @responseTypes = responseTypesFiltered

      @initializeNewQuestion().then =>
        @loading = false
      @initTinyMc()

  initTinyMc: =>
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
      content_css : 'assets/stylesheets/tiny_mce_custom.css'
      table_toolbar: ""
      render: (editor) =>
        @$timeout => #since this comes from a event handler in tinymce
          @ModalFactory.invokeModal 'questionnaire_upload_image',
            resolve:
              editor: -> editor

    @tinymceOptions

  initializeNewQuestion: =>
    deferred = @$q.defer()
    @resettingDefaultResponsesState = true

    @question =
      responseType: @responseTypes[0]
      rows: []
      columns: []
      options: []

    if @question_params
      @question.extracted_text = @question_params.extracted_text
      @question.hint_text = @question_params.hint_text
      @question.is_mandatory = @question_params.is_mandatory
      @question.id = @question_params.id

      @initQuestionParams(@question, @question_params).then =>
        deferred.resolve()

    @question_form.$setPristine()
    @question_form.$setUntouched()

    @$timeout =>
      @resettingDefaultResponsesState = false
      deferred.promise
    , 500

  initQuestionParams: (question, question_params) ->
    deferred = @$q.defer()

    unless question_params.id?
      deferred.resolve()

      return deferred.promise

    responseType = question_params.response_type

    if angular.isString(responseType)
      question.responseType = _(@responseTypes).findWhere(
        text: responseType
      )
      question.grid_id = question_params.grid_id

    if responseType in ['Dropdown', 'CheckBox']
      @getOptions(question_params.id).then (response) =>
        options = []

        _(response).each (option) ->
          options.push({text: option.value})

        question.options = options

        deferred.resolve()

    else if responseType is 'Grid'
      @getGridRowsAndColumns(question_params.id).then (response) =>
        rows = _(response).where(elementType: 'Row')
        columns = _(response).where(elementType: 'Column')

        @question.rows.length = 0
        @question.columns.length = 0

        _(rows).each (row) =>
          @question.rows.push(text: row.name)

        _(columns).each (column) =>
          @question.columns.push {text: column.name, type: column.type, type_options: column.type_options}

        deferred.resolve()
    else
      deferred.resolve()

    deferred.promise

  getGridRowsAndColumns: (id) ->
    @DueDiligenceDataservice.getGridRowsAndColumnsOfOfflineDD(id)

  getOptions: (questionId) ->
    @Restangular.one('questions', questionId).all('options').getList()

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

  editQuestion: (question) ->
    @question = question
    @question_copy = angular.copy(question)
    @edit_mode = true

  saveQuestion: ->
    @edit_mode = false
    @initializeNewQuestion()

  cancelEdit: ->
    _(@question).extend(@question_copy)
    @saveQuestion()

  removeQuestion: ($index) ->
    @questions.splice($index, 1)

  addOrSaveQuestion: ->
    return unless @question_form.$valid
    @saveQuestion()

  removeQuestion: ($index) ->
    @questions.splice $index, 1

  saveSingleQuestion: ->
    @question_form.$setSubmitted(true)

    if @question_form.$valid
      @saving_questions = true

      @saveGridsIfAny([@question]).then =>
        params = @getQuestionAttrs(@question)
        id = @question_params.id
        editing_question = id?

        _(@question_params).extend(params)

        promise = @Restangular.one('dd_document_lineitems', @question_params.id).customPUT(@question_params)

        promise.then (response) =>
          if editing_question
            _(@question_params).extend(response)

            response = @question_params

          if @$attrs.onSave
            @$scope.$parent.$eval @$attrs.onSave, {question: response}

          @saving_questions = false

  save: ->
    @saveSingleQuestion()

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
    if (question.responseType == 'TextMultiLine' || question.responseType == 'Text') && question.hasOwnProperty('response_word_limit')
      attrs = _(question).pick('responseType', 'text', 'grid_id', 'response_word_limit')
    else
      attrs = _(question).pick('responseType', 'text', 'grid_id')

    attrs.response_type = attrs.responseType.text

    delete attrs.responseType

    if question.options?.length
      attrs.responseOptions = _(question.options).pluck('text')
      attrs.responseOptions.push('Other') if question.has_other_option

    attrs

  getGridParams: (question) ->
    params =
      dataType: 'Integer'

    rows_columns = []

    angular.forEach question.rows, (row, idx) ->
      rows_columns.push({
        name: row.text,
        elementType: 'Row',
        order: idx + 1,
        dd_document_lineitems_id: question.id
      })

    angular.forEach question.columns, (column, idx) ->
      rows_columns.push({
        name: column.text,
        elementType: 'Column',
        type: column.type,
        type_options: column.type_options,
        order: idx + 1,
        dd_document_lineitems_id: question.id
      })

    params.rows_columns = rows_columns

    params

  saveGridsIfAny: (questions) ->
    promises = []

    angular.forEach questions, (question) =>
      if question.responseType.text == 'Grid' || question.responseType.text == 'DynamicGrid'
        grid_params = @getGridParams(question)

        promise = @TemplatesDataService.createOfflineDDGrid(question.id, grid_params.rows_columns)

        promises.push(promise)

    @$q.all(promises)

  saveQuestions: (questions) ->
    params = _(questions).map @getQuestionAttrs

    @TemplatesDataService.createQuestion(@getSubcategoryId(), params).then (response) =>
      {questions: response}

  cancel: ->
    @$scope.$parent.$eval @$attrs.onCancel

  loadParentQuestionOptions: (questionID) ->
    @DueDiligenceDataservice.getList(questionID).then (response) =>
      @parentQuestionOptions = response

  revealAdvanceOptions: ->
    @adding_advance_options = true

  hideAdvanceOptions: ->
    @adding_advance_options = false
