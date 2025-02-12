class QuestionnairePrintPreviewController extends BaseController
  @register 'QuestionnairePrintPreviewController'

  @inject 'Restangular', '$q', '$stateParams', 'QuestionnaireResponseSequenceFactory',
          'QuestionnaireResponseFactory', 'DueDiligenceDataservice', 'QuestionnaireRuleFactory',
          'BaseDataService', '$state', '$scope', '$attrs', '$parse', '$location', '$anchorScroll',
          '$rootScope','$timeout'

  initialize: ->
    @templateId = @$stateParams.templateId
    @isPrintPreview = true
    @spinner_text = 'Populating the template'
    @indexCount = 0
    @Restangular.all('firm_preferences').customGET().then (response) =>
      @$scope.is_numbered = response.enable_questionnaire_numbering

    @$scope.getTemplate().then (template) =>
      @template = template

    @BaseDataService.getOperators().then (operators) =>
      @operators = operators

    @loading_child_sections = true

    @fetchParentSections().then (response) =>
      @parent_sections = response
      parent_section_ids = []
      if response.length
        _(response).each (parent_section) =>
          parent_section_ids.push(parent_section.id)

        @fetchAllSections(parent_section_ids).then (response) =>
          @initializeChildSections(response.child_sections)

          @question_list = response.question_list
          @rules = response.rules
          @loading_child_sections = false

          @child_sections = _(@child_sections).sortBy (section) => section.parent_order

          #this uses the same logic as printpreview in questionaire page
          @indexCount = 0
          _(@child_sections).each (section) =>
            if @$scope.is_numbered
              _(section.questions).each (question) =>
                question.attributes.indexCount = ++@indexCount

          @$timeout =>
            @$rootScope.$emit 'questionnaire_template:render'
          , 2000

  fetchParentSections: ->
    @Restangular.one('templates', @templateId).all('sections').getList({
      isParent: true
    })

  fetchAllSections: (parent_ids) ->
    deferred = @$q.defer()
    child_sections = []

    parent_ids_string_arr = parent_ids.join(',')
    @Restangular.all('sections').customGET('', {template_id: @templateId, parent_section_ids: parent_ids_string_arr}).then (response) =>
      promises = []
      questionIds = []
      question_list = []

      _(response).each (section) =>
        child_sections.push section
        params = {sectionID: section.id, IncludeNestedQuestions: true}

        promises.push @Restangular.all('questions').getList(params).then do (section) ->
          (questions) ->
            _(questions).each (question) ->
              question.sectionID = section.id
              if (question.responseType == 'TextMultiLine' || question.responseType == 'Text') && question.hasOwnProperty('response_word_limit')
                question.attributes = _(question).pick('responseType', 'text', 'grid_id', 'response_word_limit','grid_version')
              else
                question.attributes = _(question).pick('responseType', 'text', 'grid_id','grid_version')
              questionIds.push question.id
              question_list.push(question)

      @$q.all(promises).then =>
        unless questionIds.length
          deferred.resolve({
            child_sections: child_sections,
            question_list: question_list,
            rules: []
          })

          return

        questionIds = questionIds.join(',')

        @Restangular.all('nestingRules').getList({questionIds: questionIds, templateId: @templateId}).then (rules) =>
          rules = @groupRules(rules)

          rules = _(rules).map (rule) =>
            rule.attributes = _(rule).pick('value', 'nestedQuestionIds')

            rule.operator = _(@operators).find (operator) ->
              operator.id is rule.operatorID
            @QuestionnaireRuleFactory.$new(rule)

          _(question_list).each (question) ->
            question.isParent = !_(rules).find (rule) ->
              _(rule.nestedQuestionIds).contains(question.id)

            question.rules = _(rules).where(questionID: question.id)

          _(child_sections).each (child_section) =>
            parent_section = _(@parent_sections).findWhere(id: child_section.parentID)
            if parent_section
              child_section.name = "#{parent_section.name}: #{child_section.name}"
              child_section.parent_order = parent_section.order
            child_section.questions = _(question_list).filter (question) =>
              question.sectionID is child_section.id and question.isParent

          deferred.resolve({
            child_sections: child_sections,
            question_list: question_list,
            rules: rules
          })

    deferred.promise

  getQuestionForId: (questionID) ->
    _(@question_list).findWhere(id: questionID)

  getResponse: (question, sequence) ->
    @QuestionnaireResponseFactory.$new({}, sequence, question)

  groupRules: (rules) ->
    grouped_rules = []

    rules = _(rules).groupBy (rule) -> "question_#{rule.questionID}-value_#{rule.value}"

    _(rules).each (value) ->
      nestedQuestionIds = _(value).pluck('nestedQuestionId')

      grouped_rules.push(_(value[0]).extend(nestedQuestionIds: nestedQuestionIds))

    grouped_rules

  initializeChildSections: (child_sections) ->
    _(child_sections).each (section) =>
      section.sequences = [@getNewSequence(section)]

    @child_sections = child_sections

  loadOptionList: (questionID) ->
    deferred = @$q.defer()
    @DueDiligenceDataservice.getList(questionID).then (response) ->
      list = _(response).map (option) ->
        {value: option.dropdown_option_text,id: option.dropdown_option_id, group_id: option.dropdown_value_groupid, is_active: option.is_active, order: option.order}
      deferred.resolve(list)

    deferred.promise

  getNewSequence: (section) ->
    sequence = @QuestionnaireResponseSequenceFactory.$new({}, section)

    sequence.responses = _(section.questions).map (question) =>
      @QuestionnaireResponseFactory.$new({}, sequence, question)

    sequence

  addNewSequenceBelow: (section, idx) ->
    new_sequence = @getNewSequence(section)
    section.sequences.splice(idx + 1, 0, new_sequence)
