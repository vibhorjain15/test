class QuestionnairePreviewController extends BaseController
  @register 'QuestionnairePreviewController'

  @inject 'Restangular', '$q', '$stateParams', 'QuestionnaireResponseSequenceFactory',
          'QuestionnaireResponseFactory', 'DueDiligenceDataservice', 'QuestionnaireRuleFactory',
          'BaseDataService', '$state', '$scope', '$attrs', '$parse', '$location', '$anchorScroll',
          '$rootScope','$timeout'

  initialize: ->
    @templateId = @$stateParams.templateId
    @isPrintPreview = angular.isDefined @$attrs.printPreview
    @spinner_text = 'Populating the template'

    @preview = true
    @$scope.preview = @preview
    @noResponseControls = true
    @noResponseIndicator = true

    @indexCount = 0
    @Restangular.all('firm_preferences').customGET().then (response) =>
      @$scope.is_numbered = response.enable_questionnaire_numbering

    @$scope.getTemplate().then (template) =>
      @template = template

    @BaseDataService.getOperators().then (operators) =>
      @operators = operators

    @active_category =
      parent_section: {}
      child_sections: []
      active_child_section_id: -1

    @loading_parent_sections = true
    @fetchParentSections().then (response) =>
      @parent_sections = response
      @parent_sections = _(@parent_sections).sortBy (section) => section.order
      if response.length
        @selectSection(response[0])
      @loading_parent_sections = false

    if @$attrs.selectedSection
      @initializeSelectedSectionTwoWayBinding()


  initializeSelectedSectionTwoWayBinding: ->
    @$scope.$watch @$attrs.selectedSection, (value) =>
      @$parse(@$attrs.selectedSection).assign(@$scope.$parent, value)

  fetchParentSections: ->
    @Restangular.one('templates', @templateId).all('sections').getList({
      isParent: true
    })

  selectSection: (section) =>
    if section.id != @active_category.parent_section.id
      @active_category.parent_section = section
      @active_category.parent_section.child_sections_loading = true
      @active_category.child_sections = []
      @active_category.active_child_section_id = -1

      @selected_section = section
      @loading_child_sections = true

      #This uses the same logic as in questionaire page
      if @$scope.is_numbered
        @indexCount = 0
        for pSection, index in @parent_sections
          @indexCount += @parent_sections[index - 1].question_counts if @parent_sections[index - 1] != undefined
          if pSection.id == @active_category.parent_section.id
            break

      @fetchChildSections(section.id).then (response) =>
        @active_category.child_sections = @active_category.child_sections.concat(response.child_sections)
        @active_category.active_child_section_id = if @active_category.child_sections.length > 0 then @active_category.child_sections[0].id else null
        @active_category.parent_section.child_sections_loading = false

        @initializeChildSections(response.child_sections)
        @question_list = response.question_list
        @rules = response.rules
        @loading_child_sections = false

        $('#js-questionnaire-parent-tpl').css('min-height', ($('#js-questionnaire-sidebar-tpl').outerHeight())+'px')

        @$scope.$emit 'update:active_section', {category_id: @active_category.parent_section.id, sub_category_id: @active_category.active_child_section_id}

  getQuestionForId: (questionID) ->
    _(@question_list).findWhere(id: questionID)

  getResponse: (question, sequence) ->
    @QuestionnaireResponseFactory.$new({}, sequence, question)

  goToChildSection: (childSection)=>
    @active_category.active_child_section_id = childSection.id

    @$anchorScroll.yOffset = 50;
    @$location.hash('child_section_'+childSection.id)
    @$anchorScroll();
    @$scope.$emit 'update:active_section', {category_id: @active_category.parent_section.id, sub_category_id: @active_category.active_child_section_id}

  fetchChildSections: (parentID) ->
    deferred = @$q.defer()
    child_sections = []

    @Restangular.one('templates', @templateId).all('sections').getList({
      parentID: parentID
    }).then (response) =>
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
                question.attributes = _(question).pick('responseType', 'text', 'grid_id', 'grid_version')
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

          _(child_sections).each (child_section) ->
            child_section.questions = _(question_list).filter (question) ->
              question.sectionID is child_section.id and question.isParent

          deferred.resolve({
            child_sections: child_sections,
            question_list: question_list,
            rules: rules
          })

    deferred.promise

  groupRules: (rules) ->
    grouped_rules = []

    rules = _(rules).groupBy (rule) ->
      "question_#{rule.questionID}:value_#{rule.value}:operator_#{rule.operatorID}"

    _(rules).each (value) ->
      nestedQuestionIds = _(value).map (rule) -> rule.nestedQuestionId

      rule = value[0]
      rule.nestedQuestionIds = nestedQuestionIds
      grouped_rules.push(rule)

    grouped_rules

  initializeChildSections: (child_sections) ->
    _(child_sections).each (section) =>
      section.sequences = [@getNewSequence(section)]
      if @$scope.is_numbered
        _(section.questions).each (question) =>
          question.attributes.indexCount = ++@indexCount

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

  removeSequence: (section, idx) ->
    section.sequences.splice(idx, 1)

  removeUnsavedResponse: angular.noop

  addUnsavedResponse: angular.noop

  removeResponseFromDeletion: angular.noop

  removeUnsavedResponse: angular.noop

  addResponseForDeletion: angular.noop

  goToAddQuestions: (section) ->
    @$state.go 'app.diligence.template.categories.subcategories.questions', {
      categoryId: section.parentID,
      subcategoryId: section.id
    }

  goToAddSubCategory: (section) ->
    @$state.go 'app.diligence.template.categories.subcategories', {
      categoryId: section.id
    }

  gotoAddCategory: ->
    @$state.go 'app.diligence.template.categories', {addNew: true}
